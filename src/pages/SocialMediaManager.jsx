import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";
import {
 Plus,
 ChevronLeft,
 ChevronRight,
 Instagram,
 Twitter,
 Linkedin,
 Facebook,
 Clock,
 Send,
 Trash2,
 Wand2,
 Loader2,
 X,
 Share2,
 Hash,
 Sparkles,
 Video,
 Upload,
 Music,
 Store,
 Pin,
 Layout,
 Check,
} from "lucide-react";
import TrackingLinkManager from "../components/mail/TrackingLinkManager";
import CampaignContextBanner from "../components/shared/CampaignContextBanner";

const PLATFORM_CFG = {
 instagram: { icon: Instagram, color: "#E1306C", limit: 2200, label: "Instagram" },
 twitter: { icon: Twitter, color: "#1DA1F2", limit: 280, label: "Twitter / X" },
 linkedin: { icon: Linkedin, color: "#0A66C2", limit: 3000, label: "LinkedIn" },
 facebook: { icon: Facebook, color: "#1877F2", limit: 5000, label: "Facebook" },
 tiktok: { icon: Music, color: "#FF0050", limit: 2200, label: "TikTok" },
 google_business: { icon: Store, color: "#4285F4", limit: 1500, label: "Google Business" },
 threads: { icon: Hash, color: "var(--cth-surface-midnight)111", limit: 500, label: "Threads" },
 pinterest: { icon: Pin, color: "#E60023", limit: 500, label: "Pinterest" },
};

const STATUS_CFG = {
 draft: { label: "Draft", color: "#6f5a74", bg: "rgba(111,90,116,0.14)" },
 needs_approval: { label: "Needs Approval", color: "var(--cth-admin-ruby)", bg: "rgba(118,59,91,0.12)" },
 rejected: { label: "Rejected", color: "#b44343", bg: "rgba(180,67,67,0.12)" },
 scheduled: { label: "Scheduled", color: "var(--cth-admin-accent)", bg: "rgba(224,78,53,0.10)" },
 published: { label: "Published", color: "#3f7a5f", bg: "rgba(63,122,95,0.12)" },
 failed: { label: "Failed", color: "#b44343", bg: "rgba(180,67,67,0.12)" },
};

const TONES = [
 "professional",
 "casual",
 "witty",
 "inspirational",
 "educational",
 "conversational",
];

function PlatformBadge({ platform, size = "sm" }) {
 const cfg = PLATFORM_CFG[platform] || PLATFORM_CFG.instagram;
 const Icon = cfg.icon;
 const px = size === "sm" ? "px-2 py-0.5" : "px-3 py-1.5";

 return (
 <span
 className={`inline-flex items-center gap-1.5 rounded-full text-xs font-medium ${px}`}
 style={{
 background: `${cfg.color}15`,
 color: cfg.color,
 border: `1px solid ${cfg.color}25`,
 }}
 >
 <Icon size={size === "sm" ? 10 : 14} /> {cfg.label}
 </span>
 );
}

function backendAssetUrl(url) {
 if (!url) return "";
 if (/^https?:\/\//i.test(url)) return url;

 const base =
 import.meta.env.VITE_API_BASE_URL ||
 import.meta.env.VITE_BACKEND_URL ||
 "https://api.coretruthhouse.com";

 return `${String(base).replace(/\/+$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}

export default function SocialMediaManager() {
 const { currentWorkspace } = useWorkspace();
 const location = useLocation();
 const navigate = useNavigate();
 const handoff = location.state || {};
 const workspaceId = currentWorkspace?.id || currentWorkspace?.workspace_id || "";
 const surfaceParam = new URLSearchParams(location.search).get("surface");
 const [loading, setLoading] = useState(true);
 const [posts, setPosts] = useState([]);
 const [calendarData, setCalendarData] = useState({});
 const [platforms, setPlatforms] = useState([]);
 const [analytics, setAnalytics] = useState(null);
 const [currentDate, setCurrentDate] = useState(new Date());
 const [showModal, setShowModal] = useState(null);
 const [editingPostId, setEditingPostId] = useState(null);
 const [formData, setFormData] = useState({});
 const [selectedPlatforms, setSelectedPlatforms] = useState([]);
 const [activePlatformTab, setActivePlatformTab] = useState("instagram");
 const [platformContent, setPlatformContent] = useState({});
 const [generating, setGenerating] = useState(false);
 const [activeView, setActiveView] = useState("publish");
 const [filterPlatform, setFilterPlatform] = useState("all");
 const [sortBy, setSortBy] = useState("time");
 const [selectedPostIds, setSelectedPostIds] = useState([]);
 const [bulkScheduleDate, setBulkScheduleDate] = useState("");
 const [gridProfile, setGridProfile] = useState({
 handle: "yourbrand",
 display_name: "Your Brand",
 category: "Brand / Business",
 bio_line_1: "Write a clear brand promise",
 bio_line_2: "Show what you help people do",
 bio_line_3: "Add a simple CTA or offer",
 website: "yourbrand.com",
 avatar_url: "",
 posts_count: 0,
 followers_count: 0,
 following_count: 0,
 });

 const closePostModal = () => {
 setShowModal(null);
 if (surfaceParam === "create") {
 navigate("/social-media-manager?surface=publish", { replace: true });
 }
 };

 useEffect(() => {
 const allowed = new Set(["create", "plan", "grid", "publish", "linkhub"]);
 if (!surfaceParam || !allowed.has(surfaceParam)) return;

 if (surfaceParam === "create") {
 if (activeView !== "publish") {
 setActiveView("publish");
 }
 if (!selectedPlatforms.length) {
 setSelectedPlatforms(["instagram"]);
 }
 setFormData((d) => ({
 ...d,
 platform: d.platform || "instagram",
 }));
 if (showModal !== "post") {
 setShowModal("post");
 }
 return;
 }

 if (activeView !== surfaceParam) {
 setActiveView(surfaceParam);
 }
 }, [surfaceParam, activeView, showModal, selectedPlatforms.length]);

 useEffect(() => {
 if (!selectedPlatforms.length) {
 if (activePlatformTab !== "") {
 setActivePlatformTab("");
 }
 return;
 }

 if (!selectedPlatforms.includes(activePlatformTab)) {
 setActivePlatformTab(selectedPlatforms[0]);
 }
 }, [selectedPlatforms, activePlatformTab]);


 useEffect(() => {
 try {
 const raw = localStorage.getItem(`cth-social-grid-profile:${workspaceId}`);
 if (!raw) return;
 const saved = JSON.parse(raw);
 setGridProfile((prev) => ({ ...prev, ...saved }));
 } catch (err) {
 console.error("Grid profile load error:", err);
 }
 }, [workspaceId]);

 useEffect(() => {
 try {
 localStorage.setItem(
 `cth-social-grid-profile:${workspaceId}`,
 JSON.stringify(gridProfile)
 );
 } catch (err) {
 console.error("Grid profile save error:", err);
 }
 }, [gridProfile, workspaceId]);

 const [gridSlots, setGridSlots] = useState([]);
 const [draggedGridIndex, setDraggedGridIndex] = useState(null);
 const [pendingGridSlotIndex, setPendingGridSlotIndex] = useState(null);
 const [uploadingMedia, setUploadingMedia] = useState(false);
 const [mediaPreview, setMediaPreview] = useState([]);
 const mediaInputRef = useRef(null);
 const gridSlotFileInputRef = useRef(null);
 const gridAvatarInputRef = useRef(null);

 const currentYear = currentDate.getFullYear();
 const currentMonth = currentDate.getMonth() + 1;

 useEffect(() => {
 if (!workspaceId) return;
 void fetchAllData();
 }, [currentYear, currentMonth, workspaceId]);

 // Campaign context state (banner + filter on payloads)
 const [activeCampaignId, setActiveCampaignId] = useState(() => handoff?.campaignId || null);
 const [activeCampaignName, setActiveCampaignName] = useState(() => handoff?.campaignName || null);

 // Compose-from-Campaign drawer
 const [showCampaignDrawer, setShowCampaignDrawer] = useState(false);
 const [drawerCampaigns, setDrawerCampaigns] = useState([]);
 const [drawerCampaignsLoading, setDrawerCampaignsLoading] = useState(false);
 const [drawerSelectedCampaignId, setDrawerSelectedCampaignId] = useState(null);
 const [drawerContent, setDrawerContent] = useState([]);
 const [drawerMedia, setDrawerMedia] = useState([]);
 const [drawerSelectedContentId, setDrawerSelectedContentId] = useState(null);
 const [drawerSelectedMediaIds, setDrawerSelectedMediaIds] = useState([]);
 const [drawerLoading, setDrawerLoading] = useState(false);

 // Pre-fill from ContentStudio "Add to Social" or other handoffs
 useEffect(() => {
 if (!handoff) return;
 const pf = handoff.prefillContent;
 const pt = handoff.prefillTitle;
 const cid = handoff.contentItemId;
 const camp = handoff.campaignId;
 const campName = handoff.campaignName;
 if (!pf && !pt && !cid && !camp) return;

 if (camp) {
 setActiveCampaignId(camp);
 if (campName) setActiveCampaignName(campName);
 }
 setFormData((prev) => ({
 ...prev,
 ...(pf ? { content: pf } : {}),
 ...(pt ? { title: pt } : {}),
 ...(cid ? { content_item_id: cid } : {}),
 ...(camp ? { campaign_id: camp } : {}),
 }));
 if (pf || pt) {
 setShowModal("post");
 if (!selectedPlatforms.length) setSelectedPlatforms(["instagram"]);
 }
 // intentional one-shot: only respond to handoff changing
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [handoff?.prefillContent, handoff?.prefillTitle, handoff?.contentItemId, handoff?.campaignId, handoff?.campaignName]);

 useEffect(() => {
 if (!handoff?.campaignId || !Array.isArray(handoff?.contentPlan) || !handoff.contentPlan.length) return;

 const firstItem = handoff.contentPlan[0] || {};
 const normalizedPlatform = String(firstItem.platform || "").toLowerCase().includes("linkedin")
 ? "linkedin"
 : String(firstItem.platform || "").toLowerCase().includes("instagram")
 ? "instagram"
 : String(firstItem.platform || "").toLowerCase().includes("facebook")
 ? "facebook"
 : String(firstItem.platform || "").toLowerCase().includes("twitter") || String(firstItem.platform || "").toLowerCase().includes("x")
 ? "twitter"
 : String(firstItem.platform || "").toLowerCase().includes("tiktok")
 ? "tiktok"
 : "instagram";

 setActiveView("calendar");
 setShowModal("post");
 setSelectedPlatforms([normalizedPlatform]);
 setFormData((prev) => ({
 ...prev,
 campaign_id: handoff.campaignId || "",
 title: handoff.campaignName || "",
 topic: firstItem.topic || handoff.offerName || handoff.campaignName || "",
 platform: normalizedPlatform,
 content: prev.content || "",
 scheduled_date: prev.scheduled_date || new Date().toISOString().slice(0, 10),
 media_urls: prev.media_urls || [],
 }));
 }, [handoff]);

 async function fetchAllData() {
 setLoading(true);

 try {
 const [postsRes, calRes, platRes, anaRes] = await Promise.all([
 apiClient.get("/api/social/posts", { params: { limit: 50 } }),
 apiClient.get("/api/social/posts/calendar", {
 params: { year: currentYear, month: currentMonth },
 }),
 apiClient.get("/api/social/platforms"),
 apiClient.get("/api/social/analytics"),
 ]);

 setPosts(postsRes?.posts || []);
 setCalendarData(calRes?.calendar || {});
 setPlatforms(platRes?.platforms || []);
 setAnalytics(anaRes || null);
 } catch (err) {
 console.error("Social fetch error:", err);
 setPosts([]);
 setCalendarData({});
 setPlatforms([]);
 setAnalytics(null);
 } finally {
 setLoading(false);
 }
 }

 async function openCampaignDrawer() {
 setShowCampaignDrawer(true);
 setDrawerCampaignsLoading(true);
 setDrawerSelectedCampaignId(null);
 setDrawerContent([]);
 setDrawerMedia([]);
 setDrawerSelectedContentId(null);
 setDrawerSelectedMediaIds([]);
 try {
 const res = await apiClient.get('/api/campaigns', {
 params: { user_id: currentWorkspace?.user_id || '', workspace_id: workspaceId },
 });
 setDrawerCampaigns(res?.campaigns || []);
 } catch (err) {
 console.error('Failed to load campaigns for drawer:', err);
 setDrawerCampaigns([]);
 } finally {
 setDrawerCampaignsLoading(false);
 }
 }

 async function selectDrawerCampaign(campaign) {
 if (!campaign?.id) return;
 setDrawerSelectedCampaignId(campaign.id);
 setDrawerSelectedContentId(null);
 setDrawerSelectedMediaIds([]);
 setDrawerLoading(true);
 try {
 const [contentRes, mediaRes] = await Promise.allSettled([
 apiClient.get('/api/persist/content/library', {
 params: {
 user_id: currentWorkspace?.user_id || '',
 workspace_id: workspaceId,
 campaign_id: campaign.id,
 },
 }),
 apiClient.get(`/api/media/campaign/${campaign.id}`),
 ]);
 const allContent = contentRes.status === 'fulfilled' ? (contentRes.value?.items || contentRes.value?.content || []) : [];
 setDrawerContent(allContent.filter((it) => it.campaign_id === campaign.id));
 setDrawerMedia(mediaRes.status === 'fulfilled' ? (mediaRes.value?.media || []) : []);
 } catch (err) {
 console.error('Failed to load campaign assets for drawer:', err);
 } finally {
 setDrawerLoading(false);
 }
 }

 function applyDrawerSelections() {
 const selectedCampaign = drawerCampaigns.find((c) => c.id === drawerSelectedCampaignId);
 const selectedContent = drawerContent.find((c) => c.id === drawerSelectedContentId);
 const selectedMediaItems = drawerMedia.filter((m) => drawerSelectedMediaIds.includes(m.asset_id || m.id));
 const mediaUrls = selectedMediaItems
 .map((m) => m.preview_url || m.file_url || m.url || '')
 .filter(Boolean);
 const mediaIds = selectedMediaItems.map((m) => m.asset_id || m.id).filter(Boolean);

 if (selectedCampaign) {
 setActiveCampaignId(selectedCampaign.id);
 setActiveCampaignName(selectedCampaign.name || null);
 }

 setFormData((prev) => ({
 ...prev,
 campaign_id: selectedCampaign?.id || prev.campaign_id || null,
 content: selectedContent?.content || prev.content || '',
 title: selectedContent?.title || prev.title || '',
 content_item_id: selectedContent?.id || prev.content_item_id || null,
 media_urls: [...(prev.media_urls || []), ...mediaUrls],
 media_asset_ids: [...(prev.media_asset_ids || []), ...mediaIds],
 }));

 if (!selectedPlatforms.length) setSelectedPlatforms(['instagram']);
 setShowCampaignDrawer(false);
 setShowModal('post');
 }

 async function handleCreatePost() {
 try {
 if (editingPostId) {
 const postData = {
 ...formData,
 media_urls: formData.media_urls || [],
 cta_url: formData.cta_url || "",
 link_in_bio_url: formData.link_in_bio_url || "",
 content: activePlatformData.content || formData.content || "",
 hashtags: activePlatformData.hashtags || formData.hashtags || [],
 platform: formData.platform || activePlatformKey || "instagram",
 campaign_id: formData.campaign_id || activeCampaignId || null,
 content_item_id: formData.content_item_id || null,
 media_asset_ids: formData.media_asset_ids || [],
 };

 await apiClient.put(`/api/social/posts/${editingPostId}`, postData);
 } else {
 const platformsToSave = selectedPlatforms.length
 ? selectedPlatforms
 : [formData.platform || "instagram"];

 await Promise.all(
 platformsToSave.map((platformId) => {
 const platformData = platformContent[platformId] || {};
 const postData = {
 ...formData,
 platform: platformId,
 content: platformData.content || formData.content || "",
 hashtags: platformData.hashtags || formData.hashtags || [],
 media_urls: formData.media_urls || [],
 cta_url: formData.cta_url || "",
 link_in_bio_url: formData.link_in_bio_url || "",
 campaign_id: formData.campaign_id || activeCampaignId || null,
 content_item_id: formData.content_item_id || null,
 media_asset_ids: formData.media_asset_ids || [],
 };

 return apiClient.post("/api/social/posts", postData);
 })
 );
 }

 closePostModal();
 setEditingPostId(null);
 setFormData({});
 setSelectedPlatforms([]);
 setActivePlatformTab("instagram");
 setPlatformContent({});
 setMediaPreview([]);
 await fetchAllData();
 } catch (err) {
 console.error("Create post error:", err);
 }
 }

 async function handleBulkSchedule() {
 if (!selectedPostIds.length || !bulkScheduleDate) return;

 try {
 await Promise.all(
 selectedPostIds.map((id) =>
 apiClient.put(`/api/social/posts/${id}`, {
 scheduled_for: new Date(bulkScheduleDate).toISOString(),
 status: "scheduled",
 })
 )
 );

 setSelectedPostIds([]);
 setBulkScheduleDate("");
 await fetchAllData();
 } catch (err) {
 console.error("Bulk schedule error:", err);
 alert("Bulk scheduling failed");
 }
 }

 function handleRecycleTopPost() {
 const ranked = [...posts].sort((a, b) => {
 const aScore =
 Number(a.engagement_rate || 0) +
 Number(a.clicks || 0) +
 Number(a.likes || 0) +
 Number(a.comments || 0) +
 Number(a.shares || 0);

 const bScore =
 Number(b.engagement_rate || 0) +
 Number(b.clicks || 0) +
 Number(b.likes || 0) +
 Number(b.comments || 0) +
 Number(b.shares || 0);

 return bScore - aScore;
 });

 const sourcePost =
 ranked.find((post) => post.status === "published") ||
 ranked.find((post) => post.status === "scheduled") ||
 ranked[0];

 if (!sourcePost) {
 alert("No posts available to recycle yet.");
 return;
 }

 setShowModal("post");
 setEditingPostId(null);
 setSelectedPlatforms([sourcePost.platform || "instagram"]);
 setFormData({
 title: sourcePost.title || sourcePost.topic || "",
 topic: sourcePost.topic || sourcePost.title || "",
 platform: sourcePost.platform || "instagram",
 content: sourcePost.content || "",
 hashtags: sourcePost.hashtags || [],
 media_urls: sourcePost.media_urls || [],
 first_comment: sourcePost.first_comment || "",
 cta_url: sourcePost.cta_url || "",
 link_in_bio_url: sourcePost.link_in_bio_url || "",
 status: "draft",
 recycled_from_post_id: sourcePost.id,
 recycle_mode: true,
 });
 setMediaPreview(
 (sourcePost.media_urls || []).map((url, i) => ({
 url,
 name: `recycled-${i + 1}`,
 type: "image",
 }))
 );
 }

 async function handleMediaUpload(event) {
 const files = event.target.files;
 if (!files?.length) return;

 setUploadingMedia(true);

 try {
 const newUrls = [...(formData.media_urls || [])];
 const newPreviews = [...mediaPreview];

 for (const file of files) {
 const fd = new FormData();
 fd.append("file", file);

 const res = await apiClient.post("/api/social/upload-media", fd, {
 headers: {},
 });

 newUrls.push(res.file_url);
 newPreviews.push({
 url: res.file_url,
 name: file.name,
 type: res.media_type,
 });
 }

 setFormData((d) => ({ ...d, media_urls: newUrls }));
 setMediaPreview(newPreviews);
 } catch (err) {
 console.error("Upload error:", err);
 alert("Media upload failed");
 } finally {
 setUploadingMedia(false);
 if (mediaInputRef.current) mediaInputRef.current.value = "";
 }
 }


 async function handleGridFileDrop(event, slotIndex) {
 event.preventDefault();

 const file = event.dataTransfer?.files?.[0];
 if (!file) {
 handleGridDrop(slotIndex);
 return;
 }

 const isImage = String(file.type || "").startsWith("image/");
 if (!isImage) {
 alert("Please drop an image file for Instagram grid planning.");
 return;
 }

 try {
 const fd = new FormData();
 fd.append("file", file);

 const uploadRes = await apiClient.post("/api/social/upload-media", fd, {
 headers: {},
 });

 await apiClient.post("/api/social/posts", {
 platform: "instagram",
 content: "",
 topic: file.name.replace(/\.[^.]+$/, ""),
 media_urls: [uploadRes.file_url],
 status: "draft",
 hashtags: [],
 });

 await fetchAllData();
 } catch (err) {
 console.error("Grid file drop upload error:", err);
 alert("Could not add image to grid.");
 }
 }


 async function handleGridSlotFileSelect(event) {
 const file = event.target.files?.[0];
 if (!file) return;

 const isImage = String(file.type || "").startsWith("image/");
 if (!isImage) {
 alert("Please choose an image file for Instagram grid planning.");
 if (gridSlotFileInputRef.current) gridSlotFileInputRef.current.value = "";
 return;
 }

 try {
 const fd = new FormData();
 fd.append("file", file);

 const uploadRes = await apiClient.post("/api/social/upload-media", fd, {
 headers: {},
 });

 await apiClient.post("/api/social/posts", {
 platform: "instagram",
 content: "",
 topic: file.name.replace(/\.[^.]+$/, ""),
 media_urls: [uploadRes.file_url],
 status: "draft",
 hashtags: [],
 });

 await fetchAllData();
 } catch (err) {
 console.error("Grid slot file select upload error:", err);
 alert("Could not add image to grid.");
 } finally {
 setPendingGridSlotIndex(null);
 if (gridSlotFileInputRef.current) gridSlotFileInputRef.current.value = "";
 }
 }


 async function handleGridAvatarSelect(event) {
 const file = event.target.files?.[0];
 if (!file) return;

 const isImage = String(file.type || "").startsWith("image/");
 if (!isImage) {
 alert("Please choose an image file for the avatar.");
 if (gridAvatarInputRef.current) gridAvatarInputRef.current.value = "";
 return;
 }

 try {
 const fd = new FormData();
 fd.append("file", file);

 const uploadRes = await apiClient.post("/api/social/upload-media", fd, {
 headers: {},
 });

 setGridProfile((prev) => ({
 ...prev,
 avatar_url: uploadRes.file_url,
 }));
 } catch (err) {
 console.error("Grid avatar upload error:", err);
 alert("Could not upload avatar image.");
 } finally {
 if (gridAvatarInputRef.current) gridAvatarInputRef.current.value = "";
 }
 }

 function removeMedia(index) {
 const urls = [...(formData.media_urls || [])];
 urls.splice(index, 1);

 const previews = [...mediaPreview];
 previews.splice(index, 1);

 setFormData((d) => ({ ...d, media_urls: urls }));
 setMediaPreview(previews);
 }

 async function handleDeletePost(id) {
 if (!window.confirm("Delete this post?")) return;

 try {
 await apiClient.delete(`/api/social/posts/${id}`);
 await fetchAllData();
 } catch (err) {
 console.error("Delete error:", err);
 }
 }

 function handleEditPost(post) {
 setEditingPostId(post.id);
 setShowModal("post");
 setSelectedPlatforms([post.platform || "instagram"]);
 setFormData({
 ...post,
 media_urls: post.media_urls || [],
 hashtags: post.hashtags || [],
 first_comment: post.first_comment || "",
 cta_url: post.cta_url || "",
 link_in_bio_url: post.link_in_bio_url || "",
 recycle_mode: false,
 });
 setMediaPreview(
 (post.media_urls || []).map((url, i) => ({
 url,
 name: `media-${i + 1}`,
 type: "image",
 }))
 );
 }

 async function handlePublishPost(id) {
 try {
 await apiClient.post(`/api/social/posts/${id}/publish`, {});
 await fetchAllData();
 } catch (err) {
 console.error("Publish error:", err);
 }
 }

 async function handleGenerateContent() {
 if (!formData.topic || !selectedPlatforms.length) return;

 setGenerating(true);

 try {
 const results = await Promise.all(
 selectedPlatforms.map(async (platformId) => {
 const res = await apiClient.post("/api/social/generate", {
 topic: formData.topic,
 platform: platformId,
 tone: formData.tone || "professional",
 include_hashtags: true,
 include_cta: true,
 });

 return [platformId, {
 content: res.generated_content || "",
 hashtags: res.hashtags || [],
 }];
 })
 );

 const nextPlatformContent = Object.fromEntries(results);

 setPlatformContent((prev) => ({
 ...prev,
 ...nextPlatformContent,
 }));

 const primaryPlatform = activePlatformKey || selectedPlatforms[0] || "instagram";
 const primaryData = nextPlatformContent[primaryPlatform] || nextPlatformContent[selectedPlatforms[0]] || {};

 setFormData((d) => ({
 ...d,
 platform: primaryPlatform,
 content: primaryData.content || d.content || "",
 hashtags: primaryData.hashtags || d.hashtags || [],
 }));
 } catch (err) {
 console.error("AI gen error:", err);
 } finally {
 setGenerating(false);
 }
 }

 function navigateMonth(dir) {
 const d = new Date(currentDate);
 d.setMonth(d.getMonth() + dir);
 setCurrentDate(d);
 }

 function renderCalendar() {
 const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
 const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
 const cells = [];
 const today = new Date().toISOString().slice(0, 10);

 for (let i = 0; i < firstDay; i += 1) {
 cells.push(
 <div
 key={`e-${i}`}
 className="min-h-[170px] rounded-2xl border border-transparent bg-transparent"
 />
 );
 }

 for (let day = 1; day <= daysInMonth; day += 1) {
 const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
 const dayPosts = calendarData[dateStr] || [];
 const isToday = today === dateStr;

 cells.push(
 <div
 key={day}
 className="min-h-[170px] rounded-2xl border p-2.5 transition-all"
 style={{
 background: isToday ? "rgba(224,78,53,0.06)" : "var(--cth-admin-panel)",
 borderColor: isToday ? "rgba(224,78,53,0.35)" : "var(--cth-admin-border)",
 boxShadow: isToday ? "0 8px 24px rgba(224,78,53,0.08)" : "none",
 }}
 >
 <div className="mb-2 flex items-center justify-between">
 <span
 className="inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold"
 style={{
 color: isToday ? "var(--cth-white)" : "var(--cth-admin-ink)",
 background: isToday ? "var(--cth-admin-accent)" : "var(--cth-admin-panel-alt)",
 }}
 >
 {day}
 </span>
 {dayPosts.length > 0 && (
 <span className="text-[11px] font-medium cth-muted">
 {dayPosts.length} post{dayPosts.length === 1 ? "" : "s"}
 </span>
 )}
 </div>

 <div className="space-y-1.5">
 {dayPosts.slice(0, 4).map((post, i) => {
 const cfg = PLATFORM_CFG[post.platform] || PLATFORM_CFG.instagram;
 const Icon = cfg.icon;

 return (
 <button
 key={i}
 type="button"
 onClick={() => handleEditPost(post)}
 className="flex w-full items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs text-left transition-all hover:opacity-90"
 style={{
 background: `${cfg.color}12`,
 border: `1px solid ${cfg.color}20`,
 }}
 >
 <Icon size={11} style={{ color: cfg.color, flexShrink: 0 }} />
 <span className="truncate cth-muted">
 {post.content?.slice(0, 28) || "Untitled post"}
 </span>
 </button>
 );
 })}

 {dayPosts.length > 4 && (
 <button
 type="button"
 onClick={() => handleEditPost(dayPosts[4])}
 className="pl-1 text-[11px] font-medium cth-muted hover:text-[var(--cth-admin-accent)]"
 >
 +{dayPosts.length - 4} more
 </button>
 )}
 </div>
 </div>
 );
 }

 return cells;
 }

 const filteredPosts = useMemo(() => {
 const next = posts.filter((p) => filterPlatform === "all" || p.platform === filterPlatform);

 const metricValue = (post, key) => Number(post?.[key] || 0);

 next.sort((a, b) => {
 if (sortBy === "likes") return metricValue(b, "likes") - metricValue(a, "likes");
 if (sortBy === "shares") return metricValue(b, "shares") - metricValue(a, "shares");
 if (sortBy === "comments") return metricValue(b, "comments") - metricValue(a, "comments");
 if (sortBy === "clicks") return metricValue(b, "clicks") - metricValue(a, "clicks");

 const aTime = new Date(a.scheduled_for || a.created_at || 0).getTime();
 const bTime = new Date(b.scheduled_for || b.created_at || 0).getTime();
 return bTime - aTime;
 });

 return next;
 }, [posts, filterPlatform, sortBy]);

 const instagramGridPosts = useMemo(() => {
 const ranked = [...posts]
 .filter((p) => p.platform === "instagram")
 .sort((a, b) => {
 const aDate = new Date(a.scheduled_for || a.created_at || 0).getTime();
 const bDate = new Date(b.scheduled_for || b.created_at || 0).getTime();
 return bDate - aDate;
 });

 const slots = [...ranked.slice(0, 18)];
 while (slots.length < 18) {
 slots.push({
 id: `grid-empty-${slots.length + 1}`,
 isEmpty: true,
 label: `Slot ${slots.length + 1}`,
 });
 }
 return slots;
 }, [posts]);

 useEffect(() => {
 setGridSlots(instagramGridPosts);
 }, [instagramGridPosts]);

 const handleGridDrop = (dropIndex) => {
 if (draggedGridIndex === null || draggedGridIndex === dropIndex) return;

 setGridSlots((prev) => {
 const next = [...prev];
 const dragged = next[draggedGridIndex];
 next[draggedGridIndex] = next[dropIndex];
 next[dropIndex] = dragged;
 return next.map((item, idx) =>
 item?.isEmpty ? { ...item, label: `Slot ${idx + 1}` } : item
 );
 });

 setDraggedGridIndex(null);
 };

 async function handleResetGrid() {
 const filled = gridSlots.filter((p) => !p?.isEmpty && p?.id);

 if (!filled.length) return;
 if (!window.confirm("Reset this grid and remove all planned posts from it?")) return;

 try {
 await Promise.all(
 filled.map((post) => apiClient.delete(`/api/social/posts/${post.id}`))
 );
 setDraggedGridIndex(null);
 await fetchAllData();
 } catch (err) {
 console.error("Grid reset error:", err);
 alert("Could not reset grid.");
 }
 }

 const activePlatformKey = activePlatformTab || formData.platform || selectedPlatforms[0] || "instagram";
 const activePlatformData = platformContent[activePlatformKey] || {};
 const charLimit = PLATFORM_CFG[activePlatformKey]?.limit || 2200;
 const charCount = (activePlatformData.content || formData.content || "").length;

 return (
 <DashboardLayout>
 <div
 data-testid="social-media-manager"
 className="cth-page flex-1 overflow-y-auto"
 >
 <TopBar
 title="Social Media Manager"
 subtitle={`${analytics?.total_posts || 0} posts / ${analytics?.total_scheduled || 0} scheduled / ${analytics?.total_published || 0} published`}
 action={
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => openCampaignDrawer()}
 className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
 style={{
 borderRadius: 4,
 background: 'var(--cth-command-panel-soft)',
 border: '1px solid var(--cth-command-border)',
 color: 'var(--cth-command-purple)',
 fontFamily: '"DM Sans", system-ui, sans-serif',
 }}
 >
 <Layout size={15} /> From Campaign
 </button>
 <button
 data-testid="create-post-btn"
 onClick={() => {
 setSelectedPlatforms(["instagram"]);
 setFormData((d) => ({ ...d, platform: d.platform || "instagram" }));
 setShowModal("post");
 }}
 className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold hover:opacity-90"
 style={{
 borderRadius: 4,
 background: 'var(--cth-command-purple)',
 color: 'var(--cth-command-gold)',
 border: 'none',
 }}
 >
 <Plus size={16} /> Create Post
 </button>
 </div>
 }
 />

 <CampaignContextBanner
 campaignId={activeCampaignId}
 campaignName={activeCampaignName}
 label="Composing for campaign:"
 onClear={() => {
 setActiveCampaignId(null);
 setActiveCampaignName(null);
 setFormData((d) => ({ ...d, campaign_id: null }));
 }}
 />

 <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
 {loading ? (
 <div className="py-20 text-center">
 <Loader2 size={32} className="mx-auto animate-spin cth-text-accent" />
 </div>
 ) : (
 <>

 <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
 <div className="flex items-center gap-2">
 <button
 type="button"
 className="cth-button-secondary text-xs"
 data-testid="channels-drawer-trigger"
 >
 All Channels
 </button>
 </div>

 {(activeView === "create" || activeView === "publish") && (
 <div className="flex flex-wrap items-center gap-3">
 <div className="flex items-center gap-2">
 <select
 value={filterPlatform}
 onChange={(e) => setFilterPlatform(e.target.value)}
 data-testid="platform-filter"
 className="cth-select text-xs"
 >
 <option value="all">All Posts</option>
 {Object.entries(PLATFORM_CFG).map(([id, c]) => (
 <option key={id} value={id}>
 {c.label}
 </option>
 ))}
 </select>
 </div>

 <div className="flex items-center gap-2">
 <select
 defaultValue="all"
 data-testid="channels-filter"
 className="cth-select text-xs"
 >
 <option value="all">Channels</option>
 {Object.entries(PLATFORM_CFG).map(([id, c]) => (
 <option key={id} value={id}>
 {c.label}
 </option>
 ))}
 </select>
 </div>

 <div className="flex items-center gap-2">
 <span className="text-xs cth-muted">Tags</span>
 <select
 value={sortBy}
 onChange={(e) => setSortBy(e.target.value)}
 data-testid="sort-posts"
 className="cth-select text-xs"
 >
 <option value="time">All Tags</option>
 <option value="likes">Likes</option>
 <option value="shares">Shares</option>
 <option value="comments">Comments</option>
 <option value="clicks">Clicks</option>
 </select>
 </div>

 <div className="flex items-center gap-2">
 <select
 defaultValue="America/Chicago"
 data-testid="posting-timezone"
 className="cth-select text-xs"
 >
 <option value="America/Chicago">Time Zone · Central</option>
 <option value="America/New_York">Eastern</option>
 <option value="America/Chicago">Central</option>
 <option value="America/Denver">Mountain</option>
 <option value="America/Los_Angeles">Pacific</option>
 <option value="America/Anchorage">Alaska</option>
 <option value="Pacific/Honolulu">Hawaii</option>
 </select>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 {[
 { id: "draft", label: "Drafts" },
 { id: "needs_approval", label: "Needs Approval" },
 ].map((status) => {
 const active = filterPlatform === status.id;
 return (
 <button
 key={status.id}
 onClick={() => setFilterPlatform(status.id)}
 className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
 active
 ? "bg-[var(--cth-command-purple)] text-[var(--cth-command-gold)]"
 : "border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] cth-muted"
 }`}
 >
 {status.label}
 </button>
 );
 })}
 </div>
 </div>
 )}
 </div>

 
 <div className="mt-6">
 <TrackingLinkManager
 title="Social Tracking Links"
 subtitle="Create tracked links for social CTAs, post captions, profile links, and campaign posts."
 defaultLabel={formData?.title || formData?.topic || "Social CTA"}
 defaultUrl={
 formData?.cta_url ||
 formData?.link_in_bio_url ||
 handoff?.ctaUrl ||
 handoff?.cta_url ||
 handoff?.landingPageUrl ||
 handoff?.landing_page_url ||
 ""
 }
 context={{
 source: "social_media_manager",
 platform: typeof activePlatform !== "undefined" ? activePlatform : "",
 post_id: typeof selectedPost !== "undefined" ? selectedPost?.id || "" : "",
 campaign_id: typeof handoff !== "undefined" ? handoff?.campaignId || "" : "",
 cta_url: formData?.cta_url || "",
 link_in_bio_url: formData?.link_in_bio_url || "",
 metadata: {
 surface: typeof activeView !== "undefined" ? activeView : "",
 },
 }}
 compact
 />
 </div>

 {activeView === "publish" && (
 <section className="rounded-[28px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4 shadow-[0_18px_45px_rgba(20,15,43,0.06)] md:p-5">
 <div className="mb-5 flex flex-col gap-4 rounded-[24px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-4 md:flex-row md:items-center md:justify-between">
 <div className="min-w-0">
 <p className="text-[10px] font-semibold uppercase tracking-[0.18em] cth-muted mb-1">
 Planner
 </p>
 <h2 className="text-xl font-bold cth-heading">
 {currentDate.toLocaleString("default", {
 month: "long",
 year: "numeric",
 })}
 </h2>
 <p className="text-sm cth-muted">
 View scheduled posts, open drafts, and manage your publishing flow.
 </p>
 </div>

 <div className="flex items-center gap-2 self-start md:self-center">
 <button
 data-testid="prev-month"
 onClick={() => navigateMonth(-1)}
 className="cth-button-secondary h-10 w-10 !p-0 flex items-center justify-center"
 >
 <ChevronLeft size={18} />
 </button>

 <button
 data-testid="next-month"
 onClick={() => navigateMonth(1)}
 className="cth-button-secondary h-10 w-10 !p-0 flex items-center justify-center"
 >
 <ChevronRight size={18} />
 </button>
 </div>
 </div>

 <div className="rounded-[24px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-3 md:p-4">
 <div className="mb-2 grid grid-cols-7 gap-1">
 {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
 <div
 key={d}
 className="rounded-xl py-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] cth-muted"
 >
 {d}
 </div>
 ))}
 </div>

 <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
 </div>
 </section>
 )}

 {activeView === "grid" && (
 <div className="space-y-6" data-testid="instagram-grid-planner">
 <div className="cth-card rounded-[28px] border border-[var(--cth-admin-border)] p-5 md:p-6">
 <div className="flex flex-col gap-5">
 <div className="flex flex-col gap-4 md:flex-row md:items-start">
 <div className="flex items-center gap-4">
 <input
 ref={gridAvatarInputRef}
 type="file"
 accept="image/*"
 onChange={handleGridAvatarSelect}
 style={{ display: "none" }}
 />

 <button
 type="button"
 onClick={() => gridAvatarInputRef.current?.click()}
 className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)]"
 title="Upload avatar"
 >
 {gridProfile.avatar_url ? (
 <img
 src={backendAssetUrl(gridProfile.avatar_url)}
 alt=""
 className="h-full w-full object-cover"
 />
 ) : (
 <div className="flex h-full w-full items-center justify-center text-xs cth-muted">
 Avatar
 </div>
 )}
 <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-[11px] font-semibold text-white opacity-0 transition-all group-hover:bg-black/35 group-hover:opacity-100">
 Change
 </div>
 </button>

 <div className="grid grid-cols-3 gap-4 text-center md:hidden">
 <div>
 <p className="text-lg font-semibold cth-heading">{gridProfile.posts_count || gridSlots.filter((p) => !p?.isEmpty).length}</p>
 <p className="text-xs cth-muted">Posts</p>
 </div>
 <div>
 <p className="text-lg font-semibold cth-heading">{gridProfile.followers_count || 0}</p>
 <p className="text-xs cth-muted">Followers</p>
 </div>
 <div>
 <p className="text-lg font-semibold cth-heading">{gridProfile.following_count || 0}</p>
 <p className="text-xs cth-muted">Following</p>
 </div>
 </div>
 </div>

 <div className="min-w-0 flex-1 space-y-4">
 <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
 <div className="min-w-0">
 <input
 value={gridProfile.handle}
 onChange={(e) => setGridProfile((p) => ({ ...p, handle: e.target.value }))}
 className="w-full bg-transparent text-2xl font-bold cth-heading focus:outline-none"
 />
 </div>

 <div className="hidden grid-cols-3 gap-6 text-center md:grid">
 <div>
 <p className="text-2xl font-semibold cth-heading">{gridProfile.posts_count || gridSlots.filter((p) => !p?.isEmpty).length}</p>
 <p className="text-sm cth-muted">Posts</p>
 </div>
 <div>
 <p className="text-2xl font-semibold cth-heading">{gridProfile.followers_count || 0}</p>
 <p className="text-sm cth-muted">Followers</p>
 </div>
 <div>
 <p className="text-2xl font-semibold cth-heading">{gridProfile.following_count || 0}</p>
 <p className="text-sm cth-muted">Following</p>
 </div>
 </div>
 </div>

 <div className="space-y-1">
 <input
 value={gridProfile.display_name}
 onChange={(e) => setGridProfile((p) => ({ ...p, display_name: e.target.value }))}
 className="w-full bg-transparent text-base font-semibold cth-heading focus:outline-none"
 />
 <input
 value={gridProfile.category}
 onChange={(e) => setGridProfile((p) => ({ ...p, category: e.target.value }))}
 className="w-full bg-transparent text-sm cth-muted focus:outline-none"
 />
 <input
 value={gridProfile.bio_line_1}
 onChange={(e) => setGridProfile((p) => ({ ...p, bio_line_1: e.target.value }))}
 className="w-full bg-transparent text-sm cth-heading focus:outline-none"
 />
 <input
 value={gridProfile.bio_line_2}
 onChange={(e) => setGridProfile((p) => ({ ...p, bio_line_2: e.target.value }))}
 className="w-full bg-transparent text-sm cth-heading focus:outline-none"
 />
 <input
 value={gridProfile.bio_line_3}
 onChange={(e) => setGridProfile((p) => ({ ...p, bio_line_3: e.target.value }))}
 className="w-full bg-transparent text-sm cth-heading focus:outline-none"
 />
 <input
 value={gridProfile.website}
 onChange={(e) => setGridProfile((p) => ({ ...p, website: e.target.value }))}
 className="w-full bg-transparent text-sm font-medium text-[var(--cth-admin-accent)] focus:outline-none"
 />
 </div>
 </div>
 </div>

 <div className="flex items-center justify-between">
 <div>
 <p className="text-[10px] font-semibold uppercase tracking-[0.18em] cth-muted">Instagram Grid Planner</p>
 <p className="text-sm cth-muted">Plan 18 posts at a glance in a clean 4:5 feed layout.</p>
 </div>
 <p className="text-xs cth-muted">{gridSlots.filter((p) => !p?.isEmpty).length}/18 filled</p>
 </div>

 <input
 ref={gridSlotFileInputRef}
 type="file"
 accept="image/*"
 onChange={handleGridSlotFileSelect}
 style={{ display: "none" }}
 />

 <div className="grid grid-cols-3 gap-3">
 {gridSlots.map((post, index) => {
 if (post.isEmpty) {
 return (
 <div
 key={post.id}
 onDragOver={(e) => e.preventDefault()}
 onDrop={(e) => handleGridFileDrop(e, index)}
 className="overflow-hidden rounded-2xl border border-dashed border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)]"
 >
 <div className="aspect-[4/5] flex flex-col items-center justify-center p-4 text-center">
 <p className="text-xs font-semibold cth-muted">{post.label}</p>
 <p className="mt-1 text-[11px] cth-muted">Drag a post or drop an image file here</p>
 <button
 type="button"
 onClick={() => {
 setPendingGridSlotIndex(index);
 gridSlotFileInputRef.current?.click();
 }}
 className="mt-3 inline-flex items-center justify-center rounded bg-[var(--cth-command-purple)] px-3 py-2 text-xs font-semibold text-[var(--cth-command-gold)] shadow-sm"
 >
 Select Image
 </button>
 </div>
 </div>
 );
 }

 const statusCfg = STATUS_CFG[post.status] || STATUS_CFG.draft;
 const thumb = post.media_urls?.[0];

 return (
 <div
 key={post.id}
 draggable
 onDragStart={() => setDraggedGridIndex(index)}
 onDragOver={(e) => e.preventDefault()}
 onDrop={() => handleGridDrop(index)}
 className="group relative overflow-hidden rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] text-left transition-all hover:-translate-y-0.5"
 >
 <button
 type="button"
 onClick={() => handleEditPost(post)}
 className="block w-full text-left"
 >
 <div className="aspect-[4/5] w-full overflow-hidden bg-[var(--cth-admin-panel-alt)]">
 {thumb ? (
 <>
 <img
 src={backendAssetUrl(thumb)}
 alt=""
 className="h-full w-full object-cover"
 onError={(e) => {
 e.currentTarget.style.display = "none";
 const fallback = e.currentTarget.parentElement?.querySelector("[data-grid-fallback]");
 if (fallback) fallback.classList.remove("hidden");
 }}
 />
 <div
 data-grid-fallback
 className="hidden h-full w-full items-center justify-center px-4 text-center text-xs cth-muted"
 >
 No media preview
 </div>
 </>
 ) : (
 <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs cth-muted">
 No media preview
 </div>
 )}
 </div>

 <div className="space-y-2 p-3">
 <div className="flex items-center justify-between gap-2">
 <span className="text-[10px] font-semibold uppercase tracking-[0.12em] cth-muted">
 Slot {index + 1}
 </span>
 <span
 className="rounded-full px-2 py-0.5 text-[10px]"
 style={{
 background: statusCfg.bg,
 color: statusCfg.color,
 border: `1px solid ${statusCfg.color}30`,
 }}
 >
 {statusCfg.label}
 </span>
 </div>

 <p className="line-clamp-2 text-xs leading-relaxed cth-body">
 {post.content || post.topic || "Untitled Instagram post"}
 </p>
 </div>
 </button>

 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 handleDeletePost(post.id);
 }}
 className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(0,0,0,0.72)] text-white opacity-100 shadow-sm transition-all hover:bg-[rgba(180,67,67,0.92)]"
 title="Delete post"
 >
 <Trash2 size={14} />
 </button>
 </div>
 );
 })}
 </div>

 {gridSlots.filter((p) => !p?.isEmpty).length === 18 && (
 <div className="flex justify-end">
 <button
 type="button"
 onClick={handleResetGrid}
 className="inline-flex items-center justify-center rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-4 py-2.5 text-sm font-semibold cth-heading transition-all hover:bg-[rgba(180,67,67,0.10)] hover:text-[var(--cth-danger)]"
 >
 Reset Grid
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 {activeView === "posts" && (
 <div className="space-y-3" data-testid="posts-list">
 <div className="cth-card rounded-2xl border border-[var(--cth-admin-border)] p-4">
 <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <div>
 <p className="text-[10px] font-semibold uppercase tracking-[0.18em] cth-muted mb-1">
 Recycle Top-Performing Posts
 </p>
 <p className="text-sm cth-muted">
 Reopen your strongest content as a fresh draft so you can refine it, reschedule it, and keep proven ideas working longer.
 </p>
 </div>

 <button
 onClick={handleRecycleTopPost}
 className="inline-flex items-center justify-center rounded bg-[var(--cth-command-purple)] px-4 py-2.5 text-sm font-semibold text-[var(--cth-command-gold)] shadow-sm"
 >
 Recycle Top Post
 </button>
 </div>
 </div>

 {filteredPosts.length > 0 && (
 <div className="cth-card-muted rounded-2xl border border-[var(--cth-admin-border)] p-4">
 <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <div className="flex items-center gap-3">
 <button
 onClick={() => {
 if (selectedPostIds.length === filteredPosts.length) {
 setSelectedPostIds([]);
 } else {
 setSelectedPostIds(filteredPosts.map((post) => post.id));
 }
 }}
 className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-3 py-2 text-xs font-semibold cth-heading"
 >
 {selectedPostIds.length === filteredPosts.length ? "Clear Selection" : "Select All"}
 </button>
 <p className="text-xs cth-muted">
 {selectedPostIds.length} selected
 </p>
 </div>

 <div className="flex items-center gap-2">
 <input
 type="datetime-local"
 value={bulkScheduleDate}
 onChange={(e) => setBulkScheduleDate(e.target.value)}
 className="cth-input text-xs"
 />
 <button
 onClick={handleBulkSchedule}
 disabled={!selectedPostIds.length || !bulkScheduleDate}
 className="cth-button-primary text-xs disabled:opacity-40"
 >
 Bulk Schedule
 </button>
 </div>
 </div>
 </div>
 )}

 {filteredPosts.length > 0 ? (
 filteredPosts.map((post) => {
 const statusCfg = STATUS_CFG[post.status] || STATUS_CFG.draft;
 const checked = selectedPostIds.includes(post.id);

 return (
 <div
 key={post.id}
 data-testid={`post-${post.id}`}
 className={`cth-card group p-5 transition-all hover:-translate-y-0.5 ${
 checked
 ? "ring-2 ring-[var(--cth-admin-accent)] bg-[var(--cth-admin-panel-alt)]"
 : ""
 }`}
 >
 <div className="flex items-start justify-between gap-4">
 <div className="flex items-start gap-3 min-w-0 flex-1">
 <input
 type="checkbox"
 checked={checked}
 onChange={(e) => {
 setSelectedPostIds((prev) =>
 e.target.checked
 ? [...prev, post.id]
 : prev.filter((id) => id !== post.id)
 );
 }}
 className="mt-1 h-4 w-4 rounded border-[var(--cth-admin-border)]"
 />

 <div className="min-w-0 flex-1">
 <div className="mb-2 flex items-center gap-2 flex-wrap">
 <PlatformBadge platform={post.platform} />
 {checked && (
 <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-[var(--cth-command-purple)] text-[var(--cth-command-gold)]">
 Selected
 </span>
 )}
 <span
 className="rounded-full px-2 py-0.5 text-xs"
 style={{
 background: statusCfg.bg,
 color: statusCfg.color,
 border: `1px solid ${statusCfg.color}30`,
 }}
 >
 {statusCfg.label}
 </span>
 {post.campaign_id ? (
 <span
 style={{
 fontSize: 9,
 fontWeight: 700,
 letterSpacing: '0.14em',
 textTransform: 'uppercase',
 padding: '3px 7px',
 borderRadius: 999,
 background: 'var(--cth-command-purple, #33033C)',
 color: 'var(--cth-command-gold, #C4A95B)',
 fontFamily: '"DM Sans", system-ui, sans-serif',
 }}
 >
 Campaign
 </span>
 ) : null}
 {post.content_item_id ? (
 <span
 style={{
 fontSize: 9,
 fontWeight: 700,
 letterSpacing: '0.14em',
 textTransform: 'uppercase',
 padding: '3px 7px',
 borderRadius: 999,
 background: 'transparent',
 color: 'var(--cth-command-ink, #2a1a25)',
 border: '1px solid var(--cth-command-border, rgba(216,197,195,0.6))',
 fontFamily: '"DM Sans", system-ui, sans-serif',
 }}
 >
 Content
 </span>
 ) : null}
 </div>

 <p className="mb-2 text-sm leading-relaxed cth-body line-clamp-3">
 {post.content}
 </p>

 {post.media_urls?.length > 0 && (
 <div className="mb-2 flex gap-1.5">
 {post.media_urls.slice(0, 4).map((url, i) => (
 <img
 key={i}
 src={backendAssetUrl(url)}
 alt=""
 className="w-12 h-12 rounded-lg object-cover"
 style={{ border: "1px solid var(--cth-app-border)" }}
 />
 ))}
 {post.media_urls.length > 4 && (
 <span
 className="w-12 h-12 rounded-lg flex items-center justify-center text-xs cth-muted"
 style={{
 background: "var(--cth-app-panel-alt)",
 border: "1px solid var(--cth-app-border)",
 }}
 >
 +{post.media_urls.length - 4}
 </span>
 )}
 </div>
 )}

 {post.hashtags && post.hashtags.length > 0 && (
 <div className="mb-2 flex flex-wrap gap-1.5">
 {post.hashtags.slice(0, 5).map((tag, i) => (
 <span
 key={i}
 className="text-xs px-2 py-0.5 rounded-full"
 style={{
 background: "rgba(224,78,53,0.1)",
 color: "var(--cth-app-accent)",
 }}
 >
 #{tag}
 </span>
 ))}
 </div>
 )}

 <div className="flex items-center gap-4 text-xs cth-muted">
 {post.scheduled_for && (
 <span className="flex items-center gap-1">
 <Clock size={10} />
 {new Date(post.scheduled_for).toLocaleDateString("en-US", {
 month: "short",
 day: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 })}
 </span>
 )}
 {post.content && <span>{post.content.length} chars</span>}
 </div>
 </div>
 </div>

 <div className="flex flex-shrink-0 items-center gap-1">
 <button
 onClick={() => handleEditPost(post)}
 className="p-2 rounded-lg cth-muted transition-all hover:bg-[rgba(224,78,53,0.10)] hover:text-[var(--cth-admin-accent)]"
 title="Edit post"
 >
 <Wand2 size={14} />
 </button>

 {post.status === "scheduled" && (
 <button
 data-testid={`publish-${post.id}`}
 onClick={() => handlePublishPost(post.id)}
 className="p-2 rounded-lg cth-muted transition-all hover:bg-[rgba(63,122,95,0.10)] hover:text-[var(--cth-success)]"
 title="Publish now"
 >
 <Send size={14} />
 </button>
 )}

 <button
 onClick={() => handleDeletePost(post.id)}
 className="p-2 rounded-lg cth-muted transition-all hover:bg-[rgba(180,67,67,0.10)] hover:text-[var(--cth-danger)]"
 >
 <Trash2 size={14} />
 </button>
 </div>
 </div>
 </div>
 );
 })
 ) : (
 <div className="py-16 text-center" data-testid="empty-posts">
 <Share2 size={32} className="mx-auto mb-3 cth-muted" />
 <p className="mb-1 font-semibold cth-heading">No posts yet</p>
 <p className="text-xs cth-muted">
 Create your first social media post.
 </p>
 </div>
 )}
 </div>
 )}
 </>
 )}
 </div>

 {showModal === "post" && (
 <div
 className="fixed inset-0 z-50 flex items-center justify-center p-4"
 data-testid="post-modal"
 >
 <div
 className="absolute inset-0 bg-black/40 backdrop-blur-sm"
 onClick={closePostModal}
 />
 <div
 className="cth-modal relative w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
 >
 <div
 className="flex items-center justify-between px-6 py-4 border-b"
 style={{ borderColor: "var(--cth-app-border)" }}
 >
 <span className="text-sm font-semibold cth-heading">{formData.recycle_mode ? "Recycle Post" : editingPostId ? "Edit Post" : "Create Post"}</span>
 <button
 onClick={closePostModal}
 className="cth-muted hover:text-[var(--cth-app-ink)]"
 >
 <X size={18} />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-6 space-y-4">
 <div>
 <label className="cth-label">Platforms</label>
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
 {Object.entries(PLATFORM_CFG).map(([id, cfg]) => {
 const Icon = cfg.icon;
 const active = selectedPlatforms.includes(id);

 return (
 <button
 key={id}
 type="button"
 onClick={() =>
 setSelectedPlatforms((prev) => {
 const next = prev.includes(id)
 ? prev.filter((platformId) => platformId !== id)
 : [...prev, id];

 setFormData((d) => ({
 ...d,
 platform: next[0] || "",
 }));

 return next;
 })
 }
 data-testid={`select-${id}`}
 className="flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all text-xs"
 style={{
 background: active ? `${cfg.color}15` : "var(--cth-app-panel)",
 borderColor: active ? `${cfg.color}50` : "var(--cth-app-border)",
 color: active ? cfg.color : "var(--cth-app-muted)",
 }}
 >
 <Icon size={18} />
 <span>{cfg.label.split(" ")[0]}</span>
 </button>
 );
 })}
 </div>
 </div>

 <div
 className="overflow-hidden rounded-2xl border"
 style={{
 background: "rgba(224,78,53,0.04)",
 borderColor: "rgba(224,78,53,0.15)",
 }}
 >
 <div
 className="flex items-center gap-2 px-4 py-3 border-b"
 style={{ borderColor: "rgba(224,78,53,0.10)" }}
 >
 <Sparkles size={14} className="cth-text-accent" />
 <span className="text-xs font-semibold cth-text-accent">
 AI Content Generator
 </span>
 </div>

 <div className="space-y-3 p-4">
 <input
 data-testid="ai-topic-input"
 placeholder="What should the post be about?"
 value={formData.topic || ""}
 onChange={(e) => setFormData((d) => ({ ...d, topic: e.target.value }))}
 className="cth-input text-sm"
 />

 <div className="flex gap-2">
 <select
 value={formData.tone || "professional"}
 onChange={(e) => setFormData((d) => ({ ...d, tone: e.target.value }))}
 className="cth-select flex-1 text-xs capitalize"
 >
 {TONES.map((t) => (
 <option key={t} value={t}>
 {t}
 </option>
 ))}
 </select>

 <button
 data-testid="generate-btn"
 onClick={handleGenerateContent}
 disabled={!formData.topic || !formData.platform || generating}
 className="cth-button-primary flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold disabled:opacity-40"
 >
 {generating ? (
 <Loader2 size={12} className="animate-spin" />
 ) : (
 <Wand2 size={12} />
 )}
 {generating ? "Generating..." : "Generate"}
 </button>
 </div>
 </div>
 </div>

 <div>
 <div className="mb-2 flex flex-wrap items-center gap-2">
 {selectedPlatforms.map((platformId) => {
 const cfg = PLATFORM_CFG[platformId] || PLATFORM_CFG.instagram;
 const Icon = cfg.icon;
 const active = activePlatformKey === platformId;

 return (
 <button
 key={platformId}
 type="button"
 onClick={() => setActivePlatformTab(platformId)}
 className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all"
 style={{
 background: active ? `${cfg.color}15` : "var(--cth-app-panel)",
 borderColor: active ? `${cfg.color}50` : "var(--cth-app-border)",
 color: active ? cfg.color : "var(--cth-app-muted)",
 }}
 >
 <Icon size={14} />
 <span>{cfg.label}</span>
 </button>
 );
 })}
 </div>

 <div className="mb-1.5 flex items-center justify-between">
 <label className="cth-label !mb-0">
 Content {PLATFORM_CFG[activePlatformKey]?.label ? `· ${PLATFORM_CFG[activePlatformKey].label}` : ""}
 </label>
 <span
 className="text-xs"
 style={{ color: charCount > charLimit ? "var(--cth-danger)" : "var(--cth-app-muted)" }}
 >
 {charCount}/{charLimit}
 </span>
 </div>

 <textarea
 data-testid="post-content-textarea"
 value={activePlatformData.content || formData.content || ""}
 onChange={(e) => {
 const nextValue = e.target.value;
 setPlatformContent((prev) => ({
 ...prev,
 [activePlatformKey]: {
 ...(prev[activePlatformKey] || {}),
 content: nextValue,
 hashtags: (prev[activePlatformKey] || {}).hashtags || formData.hashtags || [],
 },
 }));
 setFormData((d) => ({
 ...d,
 content: activePlatformKey === (d.platform || selectedPlatforms[0] || "instagram") ? nextValue : d.content,
 }));
 }}
 placeholder="Write your post or use the AI generator above..."
 rows={5}
 className="cth-textarea text-sm"
 />
 </div>

 {(activePlatformData.hashtags || formData.hashtags || []).length > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {(activePlatformData.hashtags || formData.hashtags || []).map((tag, i) => (
 <span
 key={i}
 className="rounded-full border px-2.5 py-1 text-xs"
 style={{
 background: "rgba(224,78,53,0.1)",
 color: "var(--cth-app-accent)",
 borderColor: "rgba(224,78,53,0.15)",
 }}
 >
 #{tag}
 </span>
 ))}
 </div>
 )}

 <div>
 <label className="cth-label">Media (optional)</label>

 <input
 ref={mediaInputRef}
 type="file"
 accept="image/*,video/*"
 multiple
 onChange={handleMediaUpload}
 style={{ display: "none" }}
 data-testid="social-media-file-input"
 />

 {mediaPreview.length > 0 && (
 <div className="mb-3 flex flex-wrap gap-2">
 {mediaPreview.map((m, i) => (
 <div key={i} className="relative group">
 {m.type === "video" ? (
 <div
 className="w-20 h-20 rounded-xl flex items-center justify-center"
 style={{
 background: "var(--cth-app-panel-alt)",
 border: "1px solid var(--cth-app-border)",
 }}
 >
 <Video size={24} className="cth-text-accent" />
 <span className="absolute bottom-1 inset-x-0 truncate px-1 text-center text-[8px] cth-muted">
 {m.name}
 </span>
 </div>
 ) : (
 <img
 src={backendAssetUrl(m.url)}
 alt={m.name}
 className="w-20 h-20 rounded-xl object-cover"
 style={{ border: "1px solid var(--cth-app-border)" }}
 />
 )}

 <button
 onClick={() => removeMedia(i)}
 className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
 >
 <X size={10} />
 </button>
 </div>
 ))}
 </div>
 )}

 <button
 data-testid="upload-media-btn"
 onClick={() => mediaInputRef.current?.click()}
 disabled={uploadingMedia}
 className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed text-xs transition-all"
 style={{
 borderColor: "rgba(224,78,53,0.24)",
 color: "var(--cth-app-muted)",
 }}
 >
 {uploadingMedia ? (
 <>
 <Loader2 size={14} className="animate-spin" /> Uploading...
 </>
 ) : (
 <>
 <Upload size={14} /> Upload Images or Videos
 </>
 )}
 </button>
 </div>

 <div className="space-y-4">
 <div>
 <label className="cth-label">Schedule (optional)</label>

 <input
 type="datetime-local"
 value={formData.scheduled_for ? formData.scheduled_for.slice(0, 16) : ""}
 onChange={(e) =>
 setFormData((d) => ({
 ...d,
 scheduled_for: e.target.value
 ? new Date(e.target.value).toISOString()
 : null,
 status: e.target.value ? "scheduled" : "draft",
 }))
 }
 className="cth-input text-sm"
 />
 </div>

 <div>
 <label className="cth-label">CTA URL</label>
 <input
 type="url"
 value={formData.cta_url || ""}
 onChange={(e) =>
 setFormData((d) => ({
 ...d,
 cta_url: e.target.value,
 }))
 }
 placeholder="https://yourdomain.com/cta"
 className="cth-input text-sm"
 />
 </div>

 <div>
 <label className="cth-label">Link-in-bio URL</label>
 <input
 type="url"
 value={formData.link_in_bio_url || ""}
 onChange={(e) =>
 setFormData((d) => ({
 ...d,
 link_in_bio_url: e.target.value,
 }))
 }
 placeholder="https://yourdomain.com/link-in-bio"
 className="cth-input text-sm"
 />
 </div>

 <div>
 <label className="cth-label">First Comment (optional)</label>
 <textarea
 value={formData.first_comment || ""}
 onChange={(e) =>
 setFormData((d) => ({
 ...d,
 first_comment: e.target.value,
 }))
 }
 rows={3}
 placeholder="Add a first comment to publish right after the post..."
 className="cth-input min-h-[96px] resize-none text-sm"
 />
 </div>
 </div>
 </div>

 <div
 className="flex justify-end gap-2 border-t px-6 py-4"
 style={{ borderColor: "var(--cth-app-border)" }}
 >
 <button
 onClick={closePostModal}
 className="cth-button-secondary text-xs"
 >
 Cancel
 </button>

 <button
 data-testid="save-post-btn"
 onClick={handleCreatePost}
 disabled={!selectedPlatforms.length || (!Object.values(platformContent).some((entry) => entry?.content) && !(formData.content || formData.topic || formData.title))}
 className="cth-button-primary text-xs disabled:opacity-40"
 >
 {formData.scheduled_for ? "Schedule Post" : "Save as Draft"}
 </button>
 </div>
 </div>
 </div>
 )}

 {showCampaignDrawer ? (
 <>
 <div
 onClick={() => setShowCampaignDrawer(false)}
 style={{
 position: 'fixed',
 inset: 0,
 background: 'rgba(13, 0, 16, 0.5)',
 zIndex: 60,
 }}
 />
 <div
 style={{
 position: 'fixed',
 top: 0,
 right: 0,
 height: '100vh',
 width: 400,
 maxWidth: '100vw',
 background: 'var(--cth-command-panel, #fbf7f1)',
 borderLeft: '1px solid var(--cth-command-border, rgba(216,197,195,0.6))',
 boxShadow: '-12px 0 32px rgba(13,0,16,0.18)',
 zIndex: 61,
 display: 'flex',
 flexDirection: 'column',
 fontFamily: '"DM Sans", system-ui, sans-serif',
 }}
 >
 <div
 style={{
 padding: '16px 20px',
 borderBottom: '1px solid var(--cth-command-border, rgba(216,197,195,0.6))',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 }}
 >
 <div>
 <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--cth-command-muted, #7a6a72)' }}>
 Compose
 </div>
 <h3 style={{ margin: 0, fontFamily: '"Playfair Display", serif', fontSize: 20, color: 'var(--cth-command-ink, #2a1a25)' }}>
 From Campaign
 </h3>
 </div>
 <button
 type="button"
 onClick={() => setShowCampaignDrawer(false)}
 aria-label="Close"
 style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--cth-command-muted, #7a6a72)' }}
 >
 <X size={18} />
 </button>
 </div>

 <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
 {!drawerSelectedCampaignId ? (
 drawerCampaignsLoading ? (
 <p style={{ color: 'var(--cth-command-muted, #7a6a72)', fontSize: 13 }}>Loading campaigns…</p>
 ) : drawerCampaigns.length === 0 ? (
 <p style={{ color: 'var(--cth-command-muted, #7a6a72)', fontSize: 13 }}>No campaigns yet. Create one in Campaign Builder.</p>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {drawerCampaigns.map((c) => (
 <div
 key={c.id}
 style={{
 padding: '12px 14px',
 background: 'var(--cth-command-panel-soft, #f4eee5)',
 border: '1px solid var(--cth-command-border, rgba(216,197,195,0.6))',
 borderRadius: 4,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: 8,
 }}
 >
 <div style={{ minWidth: 0, flex: 1 }}>
 <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--cth-command-ink, #2a1a25)' }}>{c.name || 'Untitled'}</div>
 <div style={{ fontSize: 11, color: 'var(--cth-command-muted, #7a6a72)', textTransform: 'capitalize' }}>{c.status || 'draft'}</div>
 </div>
 <button
 type="button"
 onClick={() => selectDrawerCampaign(c)}
 style={{
 padding: '6px 10px',
 fontSize: 11,
 fontWeight: 600,
 borderRadius: 4,
 backgroundColor: 'var(--cth-command-purple, #33033C)',
 color: 'var(--cth-command-gold, #C4A95B)',
 border: 'none',
 cursor: 'pointer',
 }}
 >
 Use This Campaign
 </button>
 </div>
 ))}
 </div>
 )
 ) : drawerLoading ? (
 <p style={{ color: 'var(--cth-command-muted, #7a6a72)', fontSize: 13 }}>Loading campaign assets…</p>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
 <button
 type="button"
 onClick={() => { setDrawerSelectedCampaignId(null); setDrawerContent([]); setDrawerMedia([]); }}
 style={{
 alignSelf: 'flex-start',
 background: 'transparent',
 border: 'none',
 padding: 0,
 fontSize: 12,
 color: 'var(--cth-command-muted, #7a6a72)',
 cursor: 'pointer',
 textDecoration: 'underline',
 }}
 >
 ← Back to campaigns
 </button>

 <div>
 <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--cth-command-muted, #7a6a72)', marginBottom: 6 }}>
 Pick Content
 </div>
 {drawerContent.length === 0 ? (
 <p style={{ color: 'var(--cth-command-muted, #7a6a72)', fontSize: 12 }}>No content for this campaign.</p>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
 {drawerContent.map((item) => {
 const isSel = drawerSelectedContentId === item.id;
 return (
 <button
 key={item.id}
 type="button"
 onClick={() => setDrawerSelectedContentId(isSel ? null : item.id)}
 style={{
 textAlign: 'left',
 padding: '10px 12px',
 background: isSel ? 'rgba(196,169,91,0.15)' : 'var(--cth-command-panel-soft, #f4eee5)',
 border: `1px solid ${isSel ? 'var(--cth-command-gold, #C4A95B)' : 'var(--cth-command-border, rgba(216,197,195,0.6))'}`,
 borderRadius: 4,
 cursor: 'pointer',
 fontFamily: '"DM Sans", system-ui, sans-serif',
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
 {isSel ? <Check size={12} color="var(--cth-command-purple, #33033C)" /> : null}
 <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--cth-command-ink, #2a1a25)' }}>{item.title || item.content_type || 'Untitled'}</span>
 </div>
 <p style={{ margin: 0, fontSize: 11, color: 'var(--cth-command-muted, #7a6a72)', lineHeight: 1.4 }}>
 {(item.content || '').replace(/[#*_>`]/g, '').slice(0, 100)}
 </p>
 </button>
 );
 })}
 </div>
 )}
 </div>

 <div>
 <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--cth-command-muted, #7a6a72)', marginBottom: 6 }}>
 Pick Media
 </div>
 {drawerMedia.length === 0 ? (
 <p style={{ color: 'var(--cth-command-muted, #7a6a72)', fontSize: 12 }}>No media for this campaign.</p>
 ) : (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
 {drawerMedia.map((m) => {
 const id = m.asset_id || m.id;
 const isSel = drawerSelectedMediaIds.includes(id);
 const url = m.preview_url || m.file_url || m.url || '';
 const isVideo = m.media_type === 'video' || m.file_type?.startsWith?.('video');
 return (
 <button
 key={id}
 type="button"
 onClick={() => {
 setDrawerSelectedMediaIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
 }}
 style={{
 padding: 0,
 background: 'var(--cth-command-panel-soft, #f4eee5)',
 border: `2px solid ${isSel ? 'var(--cth-command-gold, #C4A95B)' : 'var(--cth-command-border, rgba(216,197,195,0.6))'}`,
 borderRadius: 4,
 cursor: 'pointer',
 overflow: 'hidden',
 aspectRatio: '1 / 1',
 position: 'relative',
 }}
 >
 {url ? (
 isVideo ? (
 <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
 ) : (
 <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
 )
 ) : null}
 {isSel ? (
 <div style={{ position: 'absolute', top: 4, right: 4, background: 'var(--cth-command-purple, #33033C)', color: 'var(--cth-command-gold, #C4A95B)', borderRadius: 3, padding: 2 }}>
 <Check size={10} />
 </div>
 ) : null}
 </button>
 );
 })}
 </div>
 )}
 </div>
 </div>
 )}
 </div>

 {drawerSelectedCampaignId ? (
 <div style={{ padding: '16px 20px', borderTop: '1px solid var(--cth-command-border, rgba(216,197,195,0.6))' }}>
 <button
 type="button"
 onClick={applyDrawerSelections}
 style={{
 width: '100%',
 padding: '10px 16px',
 borderRadius: 4,
 backgroundColor: 'var(--cth-command-purple, #33033C)',
 color: 'var(--cth-command-gold, #C4A95B)',
 fontWeight: 600,
 fontSize: 13,
 border: 'none',
 cursor: 'pointer',
 }}
 >
 Compose Post
 </button>
 </div>
 ) : null}
 </div>
 </>
 ) : null}
 </div>
 </DashboardLayout>
 );
}
