"""
Media generation routes (image + video) with all Emergent runtime dependencies removed.

What this version does:
- removes all emergentintegrations imports
- removes EMERGENT_LLM_KEY usage
- uses OpenAI directly for image generation
- uses Replicate for video generation and LoRA workflows
- keeps the existing route surface as intact as possible
- preserves gallery, delete, watermark, fine-tune, and Replicate endpoints
"""

from __future__ import annotations

import asyncio
import base64
import io
import logging
import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from openai import OpenAI
from pydantic import BaseModel, Field
from PIL import Image, ImageDraw, ImageFont

from backend.database import UPLOAD_DIR, get_db
from backend.services.replicate_ai import (
    REPLICATE_API_TOKEN,
    REPLICATE_IMAGE_MODELS,
    REPLICATE_VIDEO_MODELS,
    check_training_status,
    create_training_zip,
    replicate_generate_image,
    replicate_generate_video,
    start_lora_training,
)

logger = logging.getLogger("cth.media")

router = APIRouter(prefix="/api", tags=["media"])

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
DEFAULT_IMAGE_MODEL = "gpt-image-1"
DEFAULT_VIDEO_MODEL = "kwaivgi/kling-v3-omni-video"

TRAINING_DIR = UPLOAD_DIR / "training"
TRAINING_DIR.mkdir(parents=True, exist_ok=True)


class VideoGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    size: str = Field(default="1280x720")
    duration: int = Field(default=5)
    user_id: str = Field(default="default")
    workspace_id: Optional[str] = None


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _require_db() -> Any:
    try:
        database = get_db()
    except Exception as e:
        logger.error("Database access failed: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Database connection unavailable",
        )

    if database is None:
        raise HTTPException(
            status_code=500,
            detail="Database not initialized",
        )

    return database


def _require_openai() -> None:
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")


def _require_replicate() -> None:
    if not REPLICATE_API_TOKEN:
        raise HTTPException(status_code=500, detail="Replicate API key not configured")


def _openai_client() -> OpenAI:
    _require_openai()
    return OpenAI(api_key=OPENAI_API_KEY)


def _safe_workspace_id(workspace_id: Optional[str]) -> Optional[str]:
    value = (workspace_id or "").strip()
    return value or None


def _infer_aspect_ratio_from_size(size: str) -> str:
    mapping = {
        "1280x720": "16:9",
        "1792x1024": "16:9",
        "1024x1792": "9:16",
        "1024x1024": "1:1",
    }
    return mapping.get(size, "16:9")


def _normalize_duration(duration: int) -> int:
    if duration <= 0:
        return 5
    if duration > 10:
        return 10
    return duration


def _build_image_prompt(prompt: str, style: str, has_reference: bool = False) -> str:
    parts = [prompt.strip()]
    if style.strip():
        parts.append(f"Visual style: {style.strip()}.")
    if has_reference:
        parts.append(
            "Use the uploaded reference image as inspiration for composition, mood, palette, or subject treatment while generating an original image."
        )
    return " ".join(parts).strip()


def _extract_image_bytes_from_openai_response(result: Any) -> bytes:
    data_items = getattr(result, "data", None) or []
    if not data_items:
        raise RuntimeError("OpenAI returned no image data.")

    first = data_items[0]

    b64_json = getattr(first, "b64_json", None)
    if b64_json:
        return base64.b64decode(b64_json)

    if isinstance(first, dict) and first.get("b64_json"):
        return base64.b64decode(first["b64_json"])

    raise RuntimeError("OpenAI image response did not include b64_json.")


def _save_bytes_to_uploads(filename: str, file_bytes: bytes) -> Path:
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        f.write(file_bytes)
    return filepath


async def _download_bytes(url: str, timeout: int = 120) -> bytes:
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.content


async def _persist_media_doc(doc: Dict[str, Any]) -> None:
    database = _require_db()
    await database.generated_media.insert_one(doc)


async def _persist_video_job(job: Dict[str, Any]) -> None:
    database = _require_db()
    await database.video_jobs.insert_one(job)


async def _update_video_job(job_id: str, update_data: Dict[str, Any]) -> None:
    database = _require_db()
    await database.video_jobs.update_one({"job_id": job_id}, {"$set": update_data})


async def _generate_openai_image_bytes(prompt: str) -> bytes:
    def _generate() -> bytes:
        client = _openai_client()
        result = client.images.generate(
            model=DEFAULT_IMAGE_MODEL,
            prompt=prompt,
            size="1024x1024",
        )
        return _extract_image_bytes_from_openai_response(result)

    return await asyncio.to_thread(_generate)


@router.post("/media/generate-image")
async def generate_image(
    prompt: str = Form(...),
    style: str = Form("professional"),
    user_id: str = Form("default"),
    workspace_id: Optional[str] = Form(None),
    reference_image: Optional[UploadFile] = File(None),
):
    _require_openai()

    try:
        reference_bytes: Optional[bytes] = None
        if reference_image is not None:
            reference_bytes = await reference_image.read()
            if reference_bytes:
                ref_filename = f"ref_{uuid.uuid4().hex[:8]}.png"
                _save_bytes_to_uploads(ref_filename, reference_bytes)

        enhanced_prompt = _build_image_prompt(
            prompt=prompt,
            style=style,
            has_reference=bool(reference_bytes),
        )

        image_bytes = await _generate_openai_image_bytes(enhanced_prompt)

        filename = f"genimg_{uuid.uuid4().hex[:8]}.png"
        _save_bytes_to_uploads(filename, image_bytes)

        image_base64 = base64.b64encode(image_bytes).decode("utf-8")
        media_id = str(uuid.uuid4())

        media_doc = {
            "id": media_id,
            "user_id": user_id,
            "workspace_id": _safe_workspace_id(workspace_id),
            "media_type": "image",
            "prompt": prompt,
            "style": style,
            "provider": "openai",
            "model": DEFAULT_IMAGE_MODEL,
            "filename": filename,
            "file_url": f"/api/assets/file/{filename}",
            "file_size": len(image_bytes),
            "has_reference": bool(reference_bytes),
            "created_at": _utc_now_iso(),
        }
        await _persist_media_doc(media_doc)

        return {
            "success": True,
            "image_url": f"/api/assets/file/{filename}",
            "image_base64": image_base64,
            "media_id": media_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Image generation error: %s", e)
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


@router.post("/media/generate-video")
async def generate_video(data: VideoGenerateRequest):
    _require_replicate()

    valid_sizes = {"1280x720", "1792x1024", "1024x1792", "1024x1024"}
    if data.size not in valid_sizes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid size. Must be one of: {sorted(valid_sizes)}",
        )

    job_id = str(uuid.uuid4())
    await _persist_video_job(
        {
            "job_id": job_id,
            "status": "processing",
            "prompt": data.prompt,
            "size": data.size,
            "duration": _normalize_duration(data.duration),
            "provider": "replicate",
            "model": DEFAULT_VIDEO_MODEL,
            "user_id": data.user_id,
            "workspace_id": _safe_workspace_id(data.workspace_id),
            "created_at": _utc_now_iso(),
        }
    )

    asyncio.create_task(_run_video_generation(job_id, data))
    return {"job_id": job_id, "status": "processing"}


async def _run_video_generation(job_id: str, data: VideoGenerateRequest):
    try:
        video_url = await replicate_generate_video(
            prompt=data.prompt,
            model=DEFAULT_VIDEO_MODEL,
            duration=_normalize_duration(data.duration),
            aspect_ratio=_infer_aspect_ratio_from_size(data.size),
        )

        if not video_url:
            await _update_video_job(
                job_id,
                {
                    "status": "failed",
                    "error": "No video generated",
                },
            )
            return

        video_bytes = await _download_bytes(video_url, timeout=180)

        filename = f"genvid_{job_id[:8]}.mp4"
        _save_bytes_to_uploads(filename, video_bytes)

        media_id = str(uuid.uuid4())
        media_doc = {
            "id": media_id,
            "user_id": data.user_id,
            "workspace_id": _safe_workspace_id(data.workspace_id),
            "media_type": "video",
            "prompt": data.prompt,
            "provider": "replicate",
            "model": DEFAULT_VIDEO_MODEL,
            "filename": filename,
            "file_url": f"/api/assets/file/{filename}",
            "file_size": len(video_bytes),
            "duration": _normalize_duration(data.duration),
            "size": data.size,
            "created_at": _utc_now_iso(),
        }
        await _persist_media_doc(media_doc)

        await _update_video_job(
            job_id,
            {
                "status": "complete",
                "video_url": f"/api/assets/file/{filename}",
                "filename": filename,
                "media_id": media_id,
            },
        )

    except Exception as e:
        logger.error("Video generation error: %s", e)
        await _update_video_job(
            job_id,
            {
                "status": "failed",
                "error": str(e),
            },
        )


@router.get("/media/video-status/{job_id}")
async def get_video_status(job_id: str):
    database = _require_db()
    job = await database.video_jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/media/gallery")
async def get_media_gallery(
    user_id: str = "default",
    workspace_id: Optional[str] = None,
    media_type: Optional[str] = None,
):
    database = _require_db()
    query: Dict[str, Any] = {"user_id": user_id}

    if workspace_id:
        query["workspace_id"] = _safe_workspace_id(workspace_id)
    if media_type:
        query["media_type"] = media_type

    media_items = (
        await database.generated_media
        .find(query, {"_id": 0})
        .sort("created_at", -1)
        .to_list(100)
    )
    return {"media": media_items}


@router.delete("/media/{media_id}")
async def delete_media(media_id: str):
    database = _require_db()
    media = await database.generated_media.find_one({"id": media_id}, {"_id": 0})
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    filename = media.get("filename") or ""
    file_path = UPLOAD_DIR / filename

    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            logger.warning("Failed to delete media file: %s", e)

    await database.generated_media.delete_one({"id": media_id})
    return {"success": True, "message": "Media deleted"}


@router.get("/media/replicate-models")
async def get_replicate_models():
    return {
        "image_models": REPLICATE_IMAGE_MODELS,
        "video_models": REPLICATE_VIDEO_MODELS,
        "available": bool(REPLICATE_API_TOKEN),
    }


@router.post("/media/replicate/generate-image")
async def replicate_image(
    prompt: str = Form(...),
    model: str = Form("black-forest-labs/flux-schnell"),
    width: int = Form(1024),
    height: int = Form(1024),
    user_id: str = Form("default"),
    workspace_id: Optional[str] = Form(None),
):
    _require_replicate()

    try:
        urls = await replicate_generate_image(
            prompt=prompt,
            model=model,
            width=width,
            height=height,
        )

        if not urls:
            raise HTTPException(status_code=500, detail="No image generated")

        img_bytes = await _download_bytes(urls[0])

        filename = f"rep_img_{uuid.uuid4().hex[:8]}.png"
        _save_bytes_to_uploads(filename, img_bytes)

        image_base64 = base64.b64encode(img_bytes).decode("utf-8")
        media_id = str(uuid.uuid4())

        media_doc = {
            "id": media_id,
            "user_id": user_id,
            "workspace_id": _safe_workspace_id(workspace_id),
            "media_type": "image",
            "prompt": prompt,
            "provider": "replicate",
            "model": model,
            "filename": filename,
            "file_url": f"/api/assets/file/{filename}",
            "file_size": len(img_bytes),
            "created_at": _utc_now_iso(),
        }
        await _persist_media_doc(media_doc)

        return {
            "success": True,
            "image_url": f"/api/assets/file/{filename}",
            "image_base64": image_base64,
            "media_id": media_id,
            "external_url": urls[0],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Replicate image generation error: %s", e)
        raise HTTPException(status_code=500, detail=f"Replicate image generation failed: {str(e)}")


@router.post("/media/replicate/generate-video")
async def replicate_video(
    prompt: str = Form(...),
    model: str = Form(DEFAULT_VIDEO_MODEL),
    duration: int = Form(5),
    aspect_ratio: str = Form("16:9"),
    user_id: str = Form("default"),
    workspace_id: Optional[str] = Form(None),
):
    _require_replicate()

    job_id = str(uuid.uuid4())
    await _persist_video_job(
        {
            "job_id": job_id,
            "status": "processing",
            "prompt": prompt,
            "provider": "replicate",
            "model": model,
            "duration": _normalize_duration(duration),
            "aspect_ratio": aspect_ratio,
            "user_id": user_id,
            "workspace_id": _safe_workspace_id(workspace_id),
            "created_at": _utc_now_iso(),
        }
    )

    asyncio.create_task(
        _run_replicate_video(
            job_id=job_id,
            prompt=prompt,
            model=model,
            duration=_normalize_duration(duration),
            aspect_ratio=aspect_ratio,
            user_id=user_id,
            workspace_id=_safe_workspace_id(workspace_id),
        )
    )

    return {"job_id": job_id, "status": "processing"}


async def _run_replicate_video(
    job_id: str,
    prompt: str,
    model: str,
    duration: int,
    aspect_ratio: str,
    user_id: str,
    workspace_id: Optional[str],
):
    try:
        video_url = await replicate_generate_video(
            prompt=prompt,
            model=model,
            duration=duration,
            aspect_ratio=aspect_ratio,
        )

        if not video_url:
            await _update_video_job(
                job_id,
                {
                    "status": "failed",
                    "error": "No video generated",
                },
            )
            return

        vid_bytes = await _download_bytes(video_url, timeout=180)

        filename = f"rep_vid_{job_id[:8]}.mp4"
        _save_bytes_to_uploads(filename, vid_bytes)

        media_id = str(uuid.uuid4())
        media_doc = {
            "id": media_id,
            "user_id": user_id,
            "workspace_id": workspace_id,
            "media_type": "video",
            "prompt": prompt,
            "provider": "replicate",
            "model": model,
            "filename": filename,
            "file_url": f"/api/assets/file/{filename}",
            "file_size": len(vid_bytes),
            "created_at": _utc_now_iso(),
        }
        await _persist_media_doc(media_doc)

        await _update_video_job(
            job_id,
            {
                "status": "complete",
                "video_url": f"/api/assets/file/{filename}",
                "filename": filename,
                "media_id": media_id,
            },
        )

    except Exception as e:
        logger.error("Replicate video generation error: %s", e)
        await _update_video_job(
            job_id,
            {
                "status": "failed",
                "error": str(e),
            },
        )


@router.post("/media/fine-tune/start")
async def start_fine_tuning(
    training_images: List[UploadFile] = File(...),
    trigger_word: str = Form("MYBRAND"),
    steps: int = Form(1000),
    learning_rate: float = Form(0.0004),
    autocaption: bool = Form(True),
    user_id: str = Form("default"),
    workspace_id: Optional[str] = Form(None),
):
    _require_replicate()

    if len(training_images) < 3:
        raise HTTPException(status_code=400, detail="Please upload at least 3 images for training")
    if len(training_images) > 30:
        raise HTTPException(status_code=400, detail="Maximum 30 images allowed for training")

    job_id = str(uuid.uuid4())
    job_dir = TRAINING_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    image_paths: List[str] = []
    for i, img in enumerate(training_images):
        ext = os.path.splitext(img.filename or "image.png")[1] or ".png"
        img_path = job_dir / f"train_{i:03d}{ext}"
        content = await img.read()

        with open(img_path, "wb") as f:
            f.write(content)

        image_paths.append(str(img_path))

    zip_path = str(job_dir / "training_data.zip")
    create_training_zip(image_paths, zip_path)

    database = _require_db()
    training_doc = {
        "id": job_id,
        "user_id": user_id,
        "workspace_id": _safe_workspace_id(workspace_id),
        "trigger_word": trigger_word,
        "status": "uploading",
        "steps": steps,
        "learning_rate": learning_rate,
        "autocaption": autocaption,
        "image_count": len(training_images),
        "replicate_training_id": None,
        "weights_url": None,
        "model_version": None,
        "error": None,
        "logs": None,
        "created_at": _utc_now_iso(),
        "updated_at": _utc_now_iso(),
    }
    await database.lora_trainings.insert_one(training_doc)

    asyncio.create_task(
        _run_lora_training(
            job_id=job_id,
            zip_path=zip_path,
            trigger_word=trigger_word,
            steps=steps,
            learning_rate=learning_rate,
            autocaption=autocaption,
        )
    )

    return {
        "success": True,
        "job_id": job_id,
        "status": "uploading",
        "message": f"Training job started with {len(training_images)} images. This may take 15-30 minutes.",
    }


async def _run_lora_training(
    job_id: str,
    zip_path: str,
    trigger_word: str,
    steps: int,
    learning_rate: float,
    autocaption: bool,
):
    try:
        database = _require_db()

        await database.lora_trainings.update_one(
            {"id": job_id},
            {"$set": {"status": "processing", "updated_at": _utc_now_iso()}},
        )

        result = await start_lora_training(
            zip_file_path=zip_path,
            trigger_word=trigger_word,
            steps=steps,
            learning_rate=learning_rate,
            autocaption=autocaption,
        )

        await database.lora_trainings.update_one(
            {"id": job_id},
            {
                "$set": {
                    "replicate_training_id": result.get("training_id"),
                    "status": result.get("status", "processing"),
                    "updated_at": _utc_now_iso(),
                }
            },
        )

    except Exception as e:
        logger.error("LoRA training start error: %s", e)
        database = _require_db()
        await database.lora_trainings.update_one(
            {"id": job_id},
            {
                "$set": {
                    "status": "failed",
                    "error": str(e),
                    "updated_at": _utc_now_iso(),
                }
            },
        )


@router.get("/media/fine-tune/status/{job_id}")
async def get_fine_tune_status(job_id: str):
    database = _require_db()
    job = await database.lora_trainings.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Training job not found")

    if job.get("replicate_training_id") and job.get("status") in {"processing", "starting"}:
        try:
            replicate_status = await check_training_status(job["replicate_training_id"])

            update_data: Dict[str, Any] = {
                "status": replicate_status.get("status", job["status"]),
                "updated_at": _utc_now_iso(),
            }

            if replicate_status.get("weights_url"):
                update_data["weights_url"] = replicate_status["weights_url"]
            if replicate_status.get("model_version"):
                update_data["model_version"] = replicate_status["model_version"]
            if replicate_status.get("error"):
                update_data["error"] = replicate_status["error"]
            if replicate_status.get("logs"):
                update_data["logs"] = replicate_status["logs"]

            await database.lora_trainings.update_one({"id": job_id}, {"$set": update_data})
            job.update(update_data)

        except Exception as e:
            logger.warning("Failed to check Replicate training status: %s", e)

    return job


@router.get("/media/fine-tune/models")
async def get_trained_models(
    user_id: str = "default",
    workspace_id: Optional[str] = None,
):
    database = _require_db()
    query: Dict[str, Any] = {"user_id": user_id, "status": "succeeded"}

    if workspace_id:
        query["workspace_id"] = _safe_workspace_id(workspace_id)

    models = await database.lora_trainings.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"models": models}


@router.get("/media/fine-tune/jobs")
async def get_training_jobs(
    user_id: str = "default",
    workspace_id: Optional[str] = None,
):
    database = _require_db()
    query: Dict[str, Any] = {"user_id": user_id}

    if workspace_id:
        query["workspace_id"] = _safe_workspace_id(workspace_id)

    jobs = await database.lora_trainings.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"jobs": jobs}


@router.delete("/media/fine-tune/{job_id}")
async def delete_training_job(job_id: str):
    database = _require_db()
    job = await database.lora_trainings.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Training job not found")

    job_dir = TRAINING_DIR / job_id
    if job_dir.exists():
        try:
            shutil.rmtree(job_dir)
        except Exception as e:
            logger.warning("Failed to delete training directory: %s", e)

    await database.lora_trainings.delete_one({"id": job_id})
    return {"success": True, "message": "Training job deleted"}


@router.post("/media/replicate/generate-with-lora")
async def generate_with_lora(
    prompt: str = Form(...),
    lora_job_id: str = Form(...),
    width: int = Form(1024),
    height: int = Form(1024),
    lora_scale: float = Form(0.8),
    user_id: str = Form("default"),
    workspace_id: Optional[str] = Form(None),
):
    _require_replicate()

    database = _require_db()
    job = await database.lora_trainings.find_one(
        {"id": lora_job_id, "status": "succeeded"},
        {"_id": 0},
    )
    if not job:
        raise HTTPException(status_code=404, detail="Trained model not found or training not complete")

    weights_url = job.get("weights_url")
    if not weights_url:
        raise HTTPException(status_code=400, detail="No weights URL available for this model")

    trigger_word = job.get("trigger_word", "MYBRAND")
    enhanced_prompt = prompt if trigger_word.lower() in prompt.lower() else f"{trigger_word} {prompt}"

    try:
        urls = await replicate_generate_image(
            prompt=enhanced_prompt,
            model="black-forest-labs/flux-schnell",
            width=width,
            height=height,
            lora_url=weights_url,
            lora_scale=lora_scale,
        )

        if not urls:
            raise HTTPException(status_code=500, detail="No image generated")

        img_bytes = await _download_bytes(urls[0])

        filename = f"lora_img_{uuid.uuid4().hex[:8]}.png"
        _save_bytes_to_uploads(filename, img_bytes)

        image_base64 = base64.b64encode(img_bytes).decode("utf-8")
        media_id = str(uuid.uuid4())

        media_doc = {
            "id": media_id,
            "user_id": user_id,
            "workspace_id": _safe_workspace_id(workspace_id),
            "media_type": "image",
            "prompt": prompt,
            "provider": "replicate-lora",
            "lora_job_id": lora_job_id,
            "trigger_word": trigger_word,
            "filename": filename,
            "file_url": f"/api/assets/file/{filename}",
            "file_size": len(img_bytes),
            "created_at": _utc_now_iso(),
        }
        await _persist_media_doc(media_doc)

        return {
            "success": True,
            "image_url": f"/api/assets/file/{filename}",
            "image_base64": image_base64,
            "media_id": media_id,
            "external_url": urls[0],
            "trigger_word": trigger_word,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("LoRA image generation error: %s", e)
        raise HTTPException(status_code=500, detail=f"LoRA image generation failed: {str(e)}")


@router.post("/media/nano-banana/generate")
async def nano_banana_generate(
    prompt: str = Form(...),
    style: str = Form("photorealistic"),
    user_id: str = Form("default"),
    workspace_id: Optional[str] = Form(None),
):
    _require_openai()

    try:
        enhanced_prompt = _build_image_prompt(
            prompt=prompt,
            style=style,
            has_reference=False,
        )
        image_bytes = await _generate_openai_image_bytes(enhanced_prompt)

        filename = f"nanob_{uuid.uuid4().hex[:8]}.png"
        _save_bytes_to_uploads(filename, image_bytes)

        image_base64 = base64.b64encode(image_bytes).decode("utf-8")
        media_id = str(uuid.uuid4())

        media_doc = {
            "id": media_id,
            "user_id": user_id,
            "workspace_id": _safe_workspace_id(workspace_id),
            "media_type": "image",
            "prompt": prompt,
            "provider": "openai",
            "model": DEFAULT_IMAGE_MODEL,
            "style": style,
            "filename": filename,
            "file_url": f"/api/assets/file/{filename}",
            "file_size": len(image_bytes),
            "created_at": _utc_now_iso(),
        }
        await _persist_media_doc(media_doc)

        return {
            "success": True,
            "image_url": f"/api/assets/file/{filename}",
            "image_base64": image_base64,
            "media_id": media_id,
            "text_response": "Image generated successfully.",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Nano Banana compatibility generation error: %s", e)
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


@router.post("/media/watermark")
async def apply_watermark(
    image: UploadFile = File(...),
    text: str = Form("Core Truth House"),
    position: str = Form("bottom-right"),
    opacity: float = Form(0.5),
    font_size: int = Form(24),
    color: str = Form("#ffffff"),
    user_id: str = Form("default"),
    workspace_id: Optional[str] = Form(None),
):
    try:
        image_bytes = await image.read()
        img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        hex_color = color.lstrip("#")
        if len(hex_color) != 6:
            raise HTTPException(status_code=400, detail="Color must be a 6-digit hex value like #ffffff")

        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)
        alpha = max(0, min(255, int(opacity * 255)))

        try:
            font = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                font_size,
            )
        except Exception:
            font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]

        padding = 20
        w, h = img.size
        positions = {
            "top-left": (padding, padding),
            "top-right": (w - text_w - padding, padding),
            "top-center": ((w - text_w) // 2, padding),
            "bottom-left": (padding, h - text_h - padding),
            "bottom-right": (w - text_w - padding, h - text_h - padding),
            "bottom-center": ((w - text_w) // 2, h - text_h - padding),
            "center": ((w - text_w) // 2, (h - text_h) // 2),
        }
        pos = positions.get(position, positions["bottom-right"])

        draw.text(pos, text, fill=(r, g, b, alpha), font=font)

        watermarked = Image.alpha_composite(img, overlay).convert("RGB")

        filename = f"wm_{uuid.uuid4().hex[:8]}.png"
        buffer = io.BytesIO()
        watermarked.save(buffer, format="PNG")
        buffer.seek(0)

        _save_bytes_to_uploads(filename, buffer.getvalue())

        image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        media_id = str(uuid.uuid4())

        media_doc = {
            "id": media_id,
            "user_id": user_id,
            "workspace_id": _safe_workspace_id(workspace_id),
            "media_type": "image",
            "prompt": f"Watermarked: {text}",
            "provider": "watermark",
            "filename": filename,
            "file_url": f"/api/assets/file/{filename}",
            "file_size": len(buffer.getvalue()),
            "created_at": _utc_now_iso(),
        }
        await _persist_media_doc(media_doc)

        return {
            "success": True,
            "image_url": f"/api/assets/file/{filename}",
            "image_base64": image_base64,
            "media_id": media_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Watermark error: %s", e)
        raise HTTPException(status_code=500, detail=f"Watermark failed: {str(e)}")
