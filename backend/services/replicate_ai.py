"""Replicate AI service for image and video generation + fine-tuning."""
import replicate
import asyncio
import logging
import os
import zipfile
import io
from pathlib import Path

logger = logging.getLogger("cth.replicate")

REPLICATE_API_TOKEN = os.environ.get("REPLICATE_API_TOKEN", "")

REPLICATE_IMAGE_MODELS = [
    {"id": "black-forest-labs/flux-1.1-pro", "label": "FLUX Pro", "type": "image"},
    {"id": "black-forest-labs/flux-schnell", "label": "FLUX Schnell (Fast)", "type": "image"},
    {"id": "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", "label": "SDXL", "type": "image"},
]

REPLICATE_VIDEO_MODELS = [
    {"id": "kwaivgi/kling-v3-omni-video", "label": "Kling v3 Omni", "type": "video"},
    {"id": "minimax/video-01-live", "label": "Minimax Video-01", "type": "video"},
]

FLUX_LORA_TRAINER = "ostris/flux-dev-lora-trainer:b6af14222e6bd9be257cbc1ea4afda3cd0503e1133083b9d1de0364d8568e6ef"


async def replicate_generate_image(prompt: str, model: str = "black-forest-labs/flux-schnell",
                                    width: int = 1024, height: int = 1024,
                                    negative_prompt: str = None, lora_url: str = None,
                                    lora_scale: float = 0.8) -> list:
    """Generate images using Replicate, optionally with a LoRA fine-tuned model."""
    if not REPLICATE_API_TOKEN:
        raise ValueError("REPLICATE_API_TOKEN not configured")

    client = replicate.Client(api_token=REPLICATE_API_TOKEN)
    input_params = {
        "prompt": prompt,
        "width": width,
        "height": height,
    }
    if negative_prompt:
        input_params["negative_prompt"] = negative_prompt
    if lora_url:
        input_params["hf_lora"] = lora_url
        input_params["lora_scale"] = lora_scale

    try:
        output = await asyncio.to_thread(client.run, model, input=input_params)
        if isinstance(output, list):
            return [item.url if hasattr(item, 'url') else str(item) for item in output]
        elif hasattr(output, 'url'):
            return [output.url]
        else:
            return [str(output)]
    except Exception as e:
        logger.error(f"Replicate image generation error: {e}")
        raise


async def replicate_generate_video(prompt: str, model: str = "kwaivgi/kling-v3-omni-video",
                                    duration: int = 5, aspect_ratio: str = "16:9") -> str:
    """Generate video using Replicate."""
    if not REPLICATE_API_TOKEN:
        raise ValueError("REPLICATE_API_TOKEN not configured")

    client = replicate.Client(api_token=REPLICATE_API_TOKEN)
    input_params = {
        "prompt": prompt,
        "duration": duration,
        "aspect_ratio": aspect_ratio,
    }

    try:
        output = await asyncio.to_thread(client.run, model, input=input_params)
        if isinstance(output, list) and len(output) > 0:
            return output[0].url if hasattr(output[0], 'url') else str(output[0])
        elif hasattr(output, 'url'):
            return output.url
        else:
            return str(output)
    except Exception as e:
        logger.error(f"Replicate video generation error: {e}")
        raise


def create_training_zip(image_paths: list, output_path: str) -> str:
    """Create a ZIP file from a list of image paths for LoRA training."""
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for path in image_paths:
            p = Path(path)
            if p.exists():
                zf.write(p, p.name)
    return output_path


async def start_lora_training(zip_file_path: str, trigger_word: str = "TOK",
                               steps: int = 1000, learning_rate: float = 0.0004,
                               autocaption: bool = True) -> dict:
    """Start a FLUX LoRA training job on Replicate."""
    if not REPLICATE_API_TOKEN:
        raise ValueError("REPLICATE_API_TOKEN not configured")

    client = replicate.Client(api_token=REPLICATE_API_TOKEN)

    # Upload the training ZIP to Replicate
    with open(zip_file_path, "rb") as f:
        zip_url = await asyncio.to_thread(
            lambda: client.files.create(f, content_type="application/zip")
        )

    file_url = zip_url.urls.get("get") if hasattr(zip_url, "urls") else str(zip_url)

    training_input = {
        "input_images": file_url,
        "trigger_word": trigger_word,
        "steps": steps,
        "learning_rate": learning_rate,
        "autocaption": autocaption,
        "resolution": "512,768,1024",
    }

    try:
        training = await asyncio.to_thread(
            lambda: client.trainings.create(
                version=FLUX_LORA_TRAINER,
                input=training_input,
                destination=f"cth-brand-studio/flux-lora-{trigger_word.lower()}"
            )
        )
        return {
            "training_id": training.id,
            "status": training.status,
            "model": str(training.model) if hasattr(training, 'model') else None,
            "version": str(training.version) if hasattr(training, 'version') else None,
        }
    except Exception as e:
        logger.error(f"Replicate training start error: {e}")
        raise


async def check_training_status(training_id: str) -> dict:
    """Check the status of a Replicate training job."""
    if not REPLICATE_API_TOKEN:
        raise ValueError("REPLICATE_API_TOKEN not configured")

    client = replicate.Client(api_token=REPLICATE_API_TOKEN)
    try:
        training = await asyncio.to_thread(client.trainings.get, training_id)
        result = {
            "training_id": training.id,
            "status": training.status,
        }
        if training.status == "succeeded" and hasattr(training, "output"):
            result["output"] = training.output
            if hasattr(training.output, "weights") or (isinstance(training.output, dict) and "weights" in training.output):
                result["weights_url"] = training.output.get("weights") if isinstance(training.output, dict) else str(training.output)
            elif hasattr(training.output, "version"):
                result["model_version"] = str(training.output.version)
        if training.status == "failed" and hasattr(training, "error"):
            result["error"] = str(training.error)
        if hasattr(training, "logs"):
            result["logs"] = str(training.logs)[-500:] if training.logs else None
        return result
    except Exception as e:
        logger.error(f"Replicate training status error: {e}")
        raise
