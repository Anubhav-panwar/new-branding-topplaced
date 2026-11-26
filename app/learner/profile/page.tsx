"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Image from "next/image";
import {
  Pencil,
  Mail,
  Phone,
  Briefcase,
  Upload,
  Camera,
  FileText,
  ExternalLink,
  Linkedin,
  Target,
  GraduationCap,
  Settings,
  Download,
  Trash2,
  MapPin,
  Award,
  Plus,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateUserName, updateProfileImage } from "@/store/slices/authSlice";
import MetricCounter from "@/components/interview/MetricCounter";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

interface ExtractedData {
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  summary?: string | null;
  professional_summary?: string | null;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  certifications?: string[];
  projects?: Array<{
    title: string;
    description: string;
  }>;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  designation: string;
  linkedinProfile: string;
  goals: string;
  profile_image?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  certifications?: string[];
  projects?: Array<{
    title: string;
    description: string;
  }>;
}

const safeParseProfileArray = <T,>(val: any, fallback: T[] = []): T[] => {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
        if (parsed) return [parsed];
      } catch (e) {}
    }
  }
  return fallback;
};

function ProfileCompletionBar({
  percent,
  completed,
  total,
}: {
  percent: number;
  completed: number;
  total: number;
}) {
  return (
    <div className="sticky top-14 md:top-16 z-30 mb-6">
      <div className="bg-[#FFFFFF]/95 px-4 py-3 rounded-2xl border border-[#E8D9CC] shadow-xs backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-wider text-[#E85D04] font-bold">
              Profile Completion
            </span>
            <span className="text-xs text-[#70645C]">
              ({completed}/{total} items)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold font-mono text-[#2B211C]">
              <MetricCounter value={percent} suffix="%" />
            </span>
            <span
              className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
                percent >= 80
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold"
                  : "border-[#E8D9CC] bg-[#FFFCF8] text-[#70645C] font-medium"
              }`}
            >
              {percent >= 80 ? "Interview Ready" : "In Progress"}
            </span>
          </div>
        </div>

        <div className="mt-2.5 h-1.5 w-full rounded-full bg-[#FFF0E6] border border-[#E8D9CC] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#E85D04] to-[#E85D04] shadow-[0_0_8px_rgba(242,106,10,0.3)] transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(100, Math.max(4, percent))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function LearnerProfilePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<
    "idle" | "uploading" | "processing" | "extracting" | "completed"
  >("idle");
  const [activeTab, setActiveTab] = useState<
    "info" | "resume" | "skills" | "experience" | "education" | "certifications" | "projects"
  >("info");
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [editableExtracted, setEditableExtracted] = useState<ExtractedData | null>(null);
  const [newSkillTag, setNewSkillTag] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showExtractedData, setShowExtractedData] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // per-section editing
  const [editHeader, setEditHeader] = useState(false);
  const [editSkills, setEditSkills] = useState(false);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<number | null>(null);
  const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null);
  const [editGoals, setEditGoals] = useState(false);
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [newSkillText, setNewSkillText] = useState("");

  // Profile Photo Upload State
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const currentUserId = user?._id || (user as any)?.id || (user as any)?.userId || "";

  const getFullAvatarUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
      return url;
    }
    return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be selected again
    e.target.value = "";

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    const isValidType = allowedTypes.includes(file.type.toLowerCase()) || (ext && ["jpg", "jpeg", "png", "webp"].includes(ext));

    if (!isValidType) {
      toast.error("Unsupported file type. Please upload a JPG, JPEG, PNG, or WEBP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB. Please choose an image smaller than 5MB.");
      return;
    }

    const preview = URL.createObjectURL(file);
    setSelectedImageFile(file);
    setImagePreviewUrl(preview);
    setIsPhotoModalOpen(true);
  };

  const handleCancelUpload = () => {
    if (imagePreviewUrl) {
      try {
        URL.revokeObjectURL(imagePreviewUrl);
      } catch {}
    }
    setImagePreviewUrl(null);
    setSelectedImageFile(null);
    setIsPhotoModalOpen(false);
  };

  const handleConfirmUpload = async () => {
    if (!selectedImageFile || !currentUserId) {
      toast.error("Please select an image file first.");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedImageFile);

      let res = await fetch(`${API_URL}/users/${currentUserId}/avatar`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (res.status === 404) {
        res = await fetch(`${API_URL}/api/users/${currentUserId}/avatar`, {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to upload profile photo.");
      }

      const data = await res.json();
      const newAvatarUrl = data.profile_image || data.user?.profile_image || "";

      dispatch(updateProfileImage(newAvatarUrl));
      toast.success("Profile photo updated successfully!");
      handleCancelUpload();
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      toast.error(err.message || "Failed to upload profile photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentUserId) return;
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;

    setIsDeletingPhoto(true);
    try {
      let res = await fetch(`${API_URL}/users/${currentUserId}/avatar`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 404) {
        res = await fetch(`${API_URL}/api/users/${currentUserId}/avatar`, {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      }

      if (!res.ok) {
        throw new Error("Failed to remove profile photo.");
      }

      dispatch(updateProfileImage(""));
      toast.success("Profile photo removed.");
    } catch (err: any) {
      console.error("Failed to delete avatar:", err);
      toast.error("Failed to remove profile photo.");
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: "",
    designation: user?.bio || "",
    linkedinProfile: user?.linkedin_profile || "",
    goals: user?.goals || "",
    profile_image: user?.profile_image || "",
    skills: [],
    experience: [],
    education: [],
  });

  const [uploadedResume, setUploadedResume] = useState<{
    filename: string;
    url: string;
    uploadDate: string;
  } | null>(
    user?.resume_url
      ? {
          filename: "Resume.pdf",
          url: user.resume_url,
          uploadDate: new Date().toLocaleDateString(),
        }
      : null
  );

  // ---------- Profile completion ----------
  const completion = useMemo(() => {
    const fields = [
      profileData.name,
      profileData.email,
      profileData.phone,
      profileData.location,
      profileData.designation,
      profileData.linkedinProfile,
      profileData.goals,
      profileData.skills.length > 0,
      profileData.experience.length > 0,
      profileData.education.length > 0,
      !!uploadedResume,
    ];

    const completed = fields.filter((field) =>
      field
        ? typeof field === "boolean"
          ? field
          : field.toString().trim() !== ""
        : false
    ).length;

    const total = fields.length;
    const percent = Math.round((completed / total) * 100);

    return { percent, completed, total };
  }, [profileData, uploadedResume]);

  // ---------- API & Data ----------
  const fetchProfileData = async () => {
    if (!user || !currentUserId || !token) return;

    setIsLoadingProfile(true);
    try {
      const response = await fetch(`${API_URL}/users/${currentUserId}/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const backendData = await response.json();

        setProfileData({
          name: backendData.name || user.name || "",
          email: backendData.email || user.email || "",
          phone: backendData.phone || user.phone || "",
          location: backendData.location || "",
          designation: backendData.designation || user.bio || "",
          linkedinProfile: backendData.linkedin_url || user.linkedin_profile || "",
          goals: backendData.career_goals || user.goals || "",
          profile_image: backendData.profile_image || user.profile_image || "",
          skills:
            backendData.skills ||
            (user.tech_stack ? user.tech_stack.split(",") : []),
          experience:
            backendData.experience ||
            safeParseProfileArray(user.experience),
          education:
            backendData.education ||
            safeParseProfileArray(user.education),
          certifications: backendData.certifications || [],
          projects: backendData.projects || [],
        });

        if (backendData.profile_image && backendData.profile_image !== user.profile_image) {
          dispatch(updateProfileImage(backendData.profile_image));
        }

        if (backendData.resume_url) {
          const resumeUrl: string = backendData.resume_url;
          const derivedFilename = resumeUrl.split("/").pop() || "Resume.pdf";
          setUploadedResume({
            filename: decodeURIComponent(derivedFilename),
            url: resumeUrl,
            uploadDate: new Date().toLocaleDateString(),
          });
        } else {
          setUploadedResume(null);
        }
      } else if (response.status === 404) {
        // No profile yet – hydrate from user
        setProfileData({
          name: user?.name || "",
          email: user?.email || "",
          phone: user?.phone || "",
          location: "",
          designation: user?.bio || "",
          linkedinProfile: user?.linkedin_profile || "",
          goals: user?.goals || "",
          skills: user?.tech_stack ? user.tech_stack.split(",") : [],
          experience: safeParseProfileArray(user?.experience),
          education: safeParseProfileArray(user?.education),
        });

        if (user?.resume_url) {
          const resumeUrl = user.resume_url;
          const derivedFilename = resumeUrl.split("/").pop() || "Resume.pdf";
          setUploadedResume({
            filename: decodeURIComponent(derivedFilename),
            url: resumeUrl,
            uploadDate: new Date().toLocaleDateString(),
          });
        } else {
          setUploadedResume(null);
        }
      } else {
        throw new Error("Failed to fetch profile data");
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast.error("Failed to load profile data");

      // Fallback
      setProfileData({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        location: "",
        designation: user?.bio || "",
        linkedinProfile: user?.linkedin_profile || "",
        goals: user?.goals || "",
        skills: user?.tech_stack ? user.tech_stack.split(",") : [],
        experience: safeParseProfileArray(user?.experience),
        education: safeParseProfileArray(user?.education),
      });

      if (user?.resume_url) {
        const resumeUrl = user.resume_url;
        const derivedFilename = resumeUrl.split("/").pop() || "Resume.pdf";
        setUploadedResume({
          filename: decodeURIComponent(derivedFilename),
          url: resumeUrl,
          uploadDate: new Date().toLocaleDateString(),
        });
      } else {
        setUploadedResume(null);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    setIsVisible(true);
    if (user && token) {
      fetchProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  // ---------- Local handlers ----------
  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSkillAdd = (skill: string) => {
    if (skill.trim() && !profileData.skills.includes(skill.trim())) {
      setProfileData((prev) => ({
        ...prev,
        skills: [...prev.skills, skill.trim()],
      }));
      setHasUnsavedChanges(true);
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    setProfileData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
    setHasUnsavedChanges(true);
  };

  const handleExperienceAdd = () => {
    const nextIndex = profileData.experience.length;

    setProfileData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { title: "", company: "", duration: "", description: "" },
      ],
    }));

    setEditingExperienceIndex(nextIndex);
    setHasUnsavedChanges(true);
  };

  const handleExperienceUpdate = (
    index: number,
    field: string,
    value: string
  ) => {
    setProfileData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      ),
    }));
    setHasUnsavedChanges(true);
  };

  const handleExperienceRemove = (index: number) => {
    setProfileData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
    setEditingExperienceIndex(null);
    setHasUnsavedChanges(true);
  };

  const handleEducationAdd = () => {
    const nextIndex = profileData.education.length;

    setProfileData((prev) => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", year: "" }],
    }));

    setEditingEducationIndex(nextIndex);
    setHasUnsavedChanges(true);
  };

  const handleEducationUpdate = (
    index: number,
    field: string,
    value: string
  ) => {
    setProfileData((prev) => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      ),
    }));
    setHasUnsavedChanges(true);
  };

  const handleEducationRemove = (index: number) => {
    setProfileData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
    setEditingEducationIndex(null);
    setHasUnsavedChanges(true);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const validExtensions = [".pdf", ".docx", ".doc"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const isValidFormat = validExtensions.includes(ext) || file.type === "application/pdf" || file.type.includes("wordprocessingml") || file.type.includes("msword");

    if (!isValidFormat) {
      const err = "Please upload a PDF or DOCX file only";
      toast.error(err);
      setUploadError(err);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      const err = "File size must be less than 10MB";
      toast.error(err);
      setUploadError(err);
      return;
    }

    setIsUploading(true);
    setUploadStage("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setTimeout(() => setUploadStage("processing"), 400);
      setTimeout(() => setUploadStage("extracting"), 900);

      const response = await fetch(`${API_URL}/users/${currentUserId}/resume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStage("completed");
        setUploadedResume({
          filename: data.resume?.filename || file.name,
          url: data.resume?.url || "",
          uploadDate: new Date().toLocaleDateString(),
        });

        const raw = data.resume?.extracted_data || data.extracted_data;
        if (raw) {
          setExtractedData(raw);
          setEditableExtracted({
            name: raw.name || raw.full_name || "",
            full_name: raw.full_name || raw.name || "",
            email: raw.email || "",
            phone: raw.phone || "",
            summary: raw.summary || raw.professional_summary || "",
            professional_summary: raw.professional_summary || raw.summary || "",
            skills: Array.isArray(raw.skills) ? [...raw.skills] : [],
            experience: Array.isArray(raw.experience)
              ? raw.experience.map((e: any) => ({
                  title: e.title || e.job_title || "",
                  company: e.company || "",
                  duration: e.duration || e.dates || "",
                  description: e.description || "",
                }))
              : [],
            education: Array.isArray(raw.education)
              ? raw.education.map((ed: any) => ({
                  degree: ed.degree || "",
                  institution: ed.institution || "",
                  year: ed.year || ed.dates || "",
                }))
              : [],
            certifications: Array.isArray(raw.certifications)
              ? raw.certifications.map((c: any) =>
                  typeof c === "string" ? c : c.name || ""
                )
              : [],
            projects: Array.isArray(raw.projects)
              ? raw.projects.map((p: any) => ({
                  title: p.title || p.name || "",
                  description: p.description || "",
                }))
              : [],
          });
          setShowExtractedData(true);
          toast.success("Resume parsed successfully! Review fields before saving.");
        } else {
          toast.success("Resume uploaded successfully!");
        }
      } else {
        setUploadStage("idle");
        const msg = data.detail || data.message || "Failed to upload resume";
        setUploadError(msg);
        toast.error(msg);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStage("idle");
      setUploadError("Network error during resume upload. Please check connection and retry.");
      toast.error("Failed to upload resume");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadStage("idle");
      }, 1500);
    }
  };

  const [isApplyingData, setIsApplyingData] = useState(false);

  const handleApplyExtractedData = async () => {
    if (!editableExtracted || !user || !currentUserId || !token) return;

    try {
      setIsApplyingData(true);

      const updatedName = editableExtracted.name?.trim() || profileData.name;
      const updatedEmail = editableExtracted.email?.trim() || profileData.email;
      const updatedPhone = editableExtracted.phone?.trim() || profileData.phone;
      const updatedGoals = editableExtracted.summary?.trim() || profileData.goals;
      const updatedSkills =
        editableExtracted.skills && editableExtracted.skills.length > 0
          ? Array.from(new Set([...profileData.skills, ...editableExtracted.skills]))
          : profileData.skills;
      const updatedExperience =
        editableExtracted.experience && editableExtracted.experience.length > 0
          ? [...editableExtracted.experience]
          : profileData.experience;
      const updatedEducation =
        editableExtracted.education && editableExtracted.education.length > 0
          ? [...editableExtracted.education]
          : profileData.education;
      const updatedCertifications =
        editableExtracted.certifications && editableExtracted.certifications.length > 0
          ? Array.from(new Set([...(profileData.certifications || []), ...editableExtracted.certifications]))
          : profileData.certifications || [];
      const updatedProjects =
        editableExtracted.projects && editableExtracted.projects.length > 0
          ? [...editableExtracted.projects]
          : profileData.projects || [];

      const newProfileData: ProfileData = {
        ...profileData,
        name: updatedName,
        email: updatedEmail,
        phone: updatedPhone,
        goals: updatedGoals,
        skills: updatedSkills,
        experience: updatedExperience,
        education: updatedEducation,
        certifications: updatedCertifications,
        projects: updatedProjects,
      };

      setProfileData(newProfileData);

      // Persist directly to user collection
      await fetch(`${API_URL}/users/${currentUserId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: updatedName,
          phone: updatedPhone ? updatedPhone.replace(/\s+/g, "") : "",
          goals: updatedGoals,
          tech_stack: updatedSkills.join(","),
          experience:
            updatedExperience.length > 0
              ? JSON.stringify(updatedExperience)
              : undefined,
        }),
      });

      const profilePayload = {
        user_id: currentUserId,
        name: updatedName,
        email: updatedEmail,
        phone: updatedPhone ? updatedPhone.replace(/\s+/g, "") : "",
        location: profileData.location,
        designation: profileData.designation,
        linkedin_url: profileData.linkedinProfile,
        skills: updatedSkills,
        experience: updatedExperience,
        education: updatedEducation,
        certifications: updatedCertifications,
        projects: updatedProjects,
        career_goals: updatedGoals,
      };

      let patchProfileRes = await fetch(`${API_URL}/users/${currentUserId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profilePayload),
      });

      if (patchProfileRes.status === 404) {
        patchProfileRes = await fetch(`${API_URL}/users/${currentUserId}/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profilePayload),
        });
      }

      if (!patchProfileRes.ok) {
        throw new Error("Failed to persist extracted data to profile");
      }

      setShowExtractedData(false);
      setHasUnsavedChanges(false);
      dispatch(updateUserName(updatedName));
      await fetchProfileData();
      toast.success("Profile successfully updated with extracted resume data!");
    } catch (err: any) {
      console.error("Apply extracted data error:", err);
      toast.error(err.message || "Failed to save extracted data to profile");
    } finally {
      setIsApplyingData(false);
    }
  };

  const saveProfileData = async () => {
    if (!user || !currentUserId || !token) return;

    if (profileData.linkedinProfile) {
      const isValidLinkedIn = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-]+\/?$/.test(profileData.linkedinProfile.trim());
      if (!isValidLinkedIn) {
        toast.error("Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/yourname)");
        return;
      }
    }

    if (profileData.goals) {
      const words = profileData.goals.trim().split(/\s+/).filter(Boolean).length;
      if (words < 25) {
        toast.error("Career goals must be at least 25 words.");
        return;
      }
    }

    try {
      // Update base user
      const response = await fetch(`${API_URL}/users/${currentUserId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone ? profileData.phone.replace(/\s+/g, "") : "",
          goals: profileData.goals,
          tech_stack: profileData.skills.join(","),
          experience:
            profileData.experience.length > 0
              ? JSON.stringify(profileData.experience)
              : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user data");
      }

      // Update / create profile
      let profileResponse = await fetch(`${API_URL}/users/${currentUserId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone ? profileData.phone.replace(/\s+/g, "") : "",
          location: profileData.location,
          designation: profileData.designation,
          linkedin_url: profileData.linkedinProfile,
          skills: profileData.skills,
          experience: profileData.experience,
          education: profileData.education,
          career_goals: profileData.goals,
        }),
      });

      if (profileResponse.status === 404) {
        profileResponse = await fetch(`${API_URL}/users/${currentUserId}/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: currentUserId,
            name: profileData.name,
            email: profileData.email,
            phone: profileData.phone
              ? profileData.phone.replace(/\s+/g, "")
              : "",
            location: profileData.location,
            designation: profileData.designation,
            linkedin_url: profileData.linkedinProfile,
            skills: profileData.skills,
            experience: profileData.experience,
            education: profileData.education,
            career_goals: profileData.goals,
          }),
        });
      }

      if (!profileResponse.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("Profile updated successfully!");
      setHasUnsavedChanges(false);
      dispatch(updateUserName(profileData.name));
      await fetchProfileData();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to update profile");
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      await saveProfileData();
    } catch {
      // toast already handled
    }
  };

  const handleResumeRemove = () => {
    setUploadedResume(null);
    toast.success("Resume removed");
  };

  // ---------- UI ----------
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F8F0E6] text-[#2B211C] flex flex-col font-sans selection:bg-[#FFF0E6] selection:text-[#E85D04]">
        <Navbar />

        <div className="flex">
          <Sidebar userType="learner" />

          <main className="flex-1 md:ml-64 ml-0 p-4 sm:p-6 md:p-8 pt-6 pb-24 md:pb-12 max-w-none min-w-0 page-enter">
            {isLoadingProfile ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center space-x-2 text-[#70645C]">
                  <Loader2 className="h-6 w-6 animate-spin text-[#E85D04]" />
                  <span>Loading profile data...</span>
                </div>
              </div>
            ) : (
              <div className="w-full">
                {/* TOP PROGRESS BAR */}
                <ProfileCompletionBar
                  percent={completion.percent}
                  completed={completion.completed}
                  total={completion.total}
                />

                {/* Page header */}
                <div
                  className={`mb-8 mt-2 md:mt-4 transition-all duration-700 flex justify-between items-center ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  }`}
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-[#E85D04] font-bold mb-1">
                      Candidate Dossier
                    </p>
                    <h1 className="font-serif-display text-3xl md:text-4xl font-normal text-[#2B211C] mb-2 tracking-tight">
                      Executive Candidate Profile
                    </h1>
                    <p className="text-[#70645C] text-sm md:text-base">
                      Curate your technical dossier, production accomplishments, and career credentials for calibrated AI evaluations and partner discovery.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden md:inline-flex px-3 py-1 rounded-full text-xs border border-[#E8D9CC] bg-[#FFFFFF] text-[#E85D04] font-semibold shadow-xs">
                      {completion.percent}% Complete
                    </span>

                    {!editHeader ? (
                      <button
                        onClick={() => setEditHeader(true)}
                        className="h-10 w-10 flex items-center justify-center rounded-xl border border-[#E8D9CC] bg-[#FFFFFF] hover:bg-[#FFF7EF] text-[#2B211C] hover:text-[#E85D04] hover:border-[#E85D04] transition-colors shadow-xs"
                        aria-label="Edit profile header"
                      >
                        <Pencil size={18} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={async () => {
                            await handleSave();
                            setEditHeader(false);
                          }}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] font-bold transition-all shadow-xs"
                          aria-label="Save profile header"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => setEditHeader(false)}
                          className="h-10 w-10 flex items-center justify-center rounded-xl border border-[#E8D9CC] bg-[#FFFFFF] hover:bg-[#FFF7EF] text-[#70645C] hover:text-[#2B211C] transition-colors shadow-xs"
                          aria-label="Cancel editing header"
                        >
                          <X size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>                {/* Editable Extracted Resume Review Modal */}
                {showExtractedData && editableExtracted && (
                  <div className="fixed inset-0 bg-[#2B211C]/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-2xl border border-[#E8D9CC] max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl text-[#2B211C]">
                      <div className="flex items-center justify-between pb-4 border-b border-[#E8D9CC] mb-6">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h3 className="text-xl font-bold text-[#2B211C]">
                              Review Extracted Resume Data
                            </h3>
                          </div>
                          <p className="text-xs text-[#70645C] mt-1">
                            Verify or edit details detected by AI before confirming autofill into your profile.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowExtractedData(false)}
                          className="p-1.5 rounded-lg text-[#70645C] hover:text-[#2B211C] hover:bg-[#FFF7EF] transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="space-y-6 mb-6">
                        {/* Personal & Contact Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider text-[#70645C]">
                                Full Name
                              </label>
                              {editableExtracted.name ? (
                                <span className="text-[10px] text-[#E85D04] bg-[#FFF0E6] px-1.5 py-0.5 rounded border border-[#E8D9CC] font-mono font-semibold">Detected</span>
                              ) : (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono font-semibold">Missing</span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={editableExtracted.name || ""}
                              onChange={(e) =>
                                setEditableExtracted((prev) => prev ? { ...prev, name: e.target.value } : null)
                              }
                              placeholder="e.g. Alex Morgan"
                              className="w-full bg-[#FFFCF8] border border-[#E8D9CC] focus:border-[#E85D04] text-[#2B211C] text-sm rounded-xl px-3 py-2 outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider text-[#70645C]">
                                Email
                              </label>
                              {editableExtracted.email ? (
                                <span className="text-[10px] text-[#E85D04] bg-[#FFF0E6] px-1.5 py-0.5 rounded border border-[#E8D9CC] font-mono font-semibold">Detected</span>
                              ) : (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono font-semibold">Missing</span>
                              )}
                            </div>
                            <input
                              type="email"
                              value={editableExtracted.email || ""}
                              onChange={(e) =>
                                setEditableExtracted((prev) => prev ? { ...prev, email: e.target.value } : null)
                              }
                              placeholder="alex@example.com"
                              className="w-full bg-[#FFFCF8] border border-[#E8D9CC] focus:border-[#E85D04] text-[#2B211C] text-sm rounded-xl px-3 py-2 outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider text-[#70645C]">
                                Phone
                              </label>
                              {editableExtracted.phone ? (
                                <span className="text-[10px] text-[#E85D04] bg-[#FFF0E6] px-1.5 py-0.5 rounded border border-[#E8D9CC] font-mono font-semibold">Detected</span>
                              ) : (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono font-semibold">Missing</span>
                              )}
                            </div>
                            <input
                              type="tel"
                              value={editableExtracted.phone || ""}
                              onChange={(e) =>
                                setEditableExtracted((prev) => prev ? { ...prev, phone: e.target.value } : null)
                              }
                              placeholder="+1 (555) 000-0000"
                              className="w-full bg-[#FFFCF8] border border-[#E8D9CC] focus:border-[#E85D04] text-[#2B211C] text-sm rounded-xl px-3 py-2 outline-none transition-colors"
                            />
                          </div>
                        </div>

                        {/* Summary */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#70645C]">
                              Professional Summary / Career Goals
                            </label>
                            {editableExtracted.summary ? (
                              <span className="text-[10px] text-[#E85D04] bg-[#FFF0E6] px-1.5 py-0.5 rounded border border-[#E8D9CC] font-mono font-semibold">Detected</span>
                            ) : (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono font-semibold">Missing</span>
                            )}
                          </div>
                          <textarea
                            rows={3}
                            value={editableExtracted.summary || ""}
                            onChange={(e) =>
                              setEditableExtracted((prev) => prev ? { ...prev, summary: e.target.value } : null)
                            }
                            placeholder="Brief summary of experience, goals, and core domain expertise..."
                            className="w-full bg-[#FFFCF8] border border-[#E8D9CC] focus:border-[#E85D04] text-[#2B211C] text-sm rounded-xl px-3 py-2 outline-none transition-colors"
                          />
                        </div>

                        {/* Skills Tag Editor */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#70645C]">
                              Skills ({editableExtracted.skills?.length || 0})
                            </label>
                            {editableExtracted.skills && editableExtracted.skills.length > 0 ? (
                              <span className="text-[10px] text-[#E85D04] bg-[#FFF0E6] px-1.5 py-0.5 rounded border border-[#E8D9CC] font-mono font-semibold">Detected</span>
                            ) : (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono font-semibold">No skills found</span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 p-3 bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl mb-2.5 min-h-[48px]">
                            {editableExtracted.skills && editableExtracted.skills.length > 0 ? (
                              editableExtracted.skills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FFF0E6] border border-[#E8D9CC] text-[#2B211C]"
                                >
                                  {skill}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditableExtracted((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              skills: prev.skills?.filter((_, i) => i !== idx),
                                            }
                                          : null
                                      )
                                    }
                                    className="hover:text-rose-600"
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-[#70645C] italic">No skills extracted yet. Add below.</p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newSkillTag}
                              onChange={(e) => setNewSkillTag(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && newSkillTag.trim()) {
                                  e.preventDefault();
                                  setEditableExtracted((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          skills: [...(prev.skills || []), newSkillTag.trim()],
                                        }
                                      : null
                                  );
                                  setNewSkillTag("");
                                }
                              }}
                              placeholder="Type a skill and press Enter or Add..."
                              className="flex-1 bg-[#FFFCF8] border border-[#E8D9CC] focus:border-[#E85D04] text-[#2B211C] text-xs rounded-xl px-3 py-2 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newSkillTag.trim()) {
                                  setEditableExtracted((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          skills: [...(prev.skills || []), newSkillTag.trim()],
                                        }
                                      : null
                                  );
                                  setNewSkillTag("");
                                }
                              }}
                              className="px-4 py-2 bg-[#FFF0E6] hover:bg-[#FFE6D5] border border-[#E8D9CC] text-xs text-[#E85D04] font-semibold rounded-xl transition-colors"
                            >
                              Add Skill
                            </button>
                          </div>
                        </div>

                        {/* Experience */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#70645C]">
                              Experience ({editableExtracted.experience?.length || 0})
                            </label>
                            {editableExtracted.experience && editableExtracted.experience.length > 0 ? (
                              <span className="text-[10px] text-[#E85D04] bg-[#FFF0E6] px-1.5 py-0.5 rounded border border-[#E8D9CC] font-mono font-semibold">Detected</span>
                            ) : (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono font-semibold">None detected</span>
                            )}
                          </div>

                          <div className="space-y-3">
                            {editableExtracted.experience?.map((exp, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    value={exp.title}
                                    onChange={(e) => {
                                      const updated = [...(editableExtracted.experience || [])];
                                      updated[idx] = { ...updated[idx], title: e.target.value };
                                      setEditableExtracted((prev) => prev ? { ...prev, experience: updated } : null);
                                    }}
                                    placeholder="Title"
                                    className="font-semibold text-[#2B211C] bg-transparent border-b border-[#E8D9CC] focus:border-[#E85D04] outline-none flex-1 py-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditableExtracted((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              experience: prev.experience?.filter((_, i) => i !== idx),
                                            }
                                          : null
                                      );
                                    }}
                                    className="text-rose-600 hover:text-rose-700 p-1"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    value={exp.company}
                                    onChange={(e) => {
                                      const updated = [...(editableExtracted.experience || [])];
                                      updated[idx] = { ...updated[idx], company: e.target.value };
                                      setEditableExtracted((prev) => prev ? { ...prev, experience: updated } : null);
                                    }}
                                    placeholder="Company"
                                    className="text-[#70645C] bg-[#FFFFFF] rounded-lg px-2.5 py-1.5 border border-[#E8D9CC] outline-none"
                                  />
                                  <input
                                    type="text"
                                    value={exp.duration}
                                    onChange={(e) => {
                                      const updated = [...(editableExtracted.experience || [])];
                                      updated[idx] = { ...updated[idx], duration: e.target.value };
                                      setEditableExtracted((prev) => prev ? { ...prev, experience: updated } : null);
                                    }}
                                    placeholder="Duration"
                                    className="text-[#70645C] bg-[#FFFFFF] rounded-lg px-2.5 py-1.5 border border-[#E8D9CC] outline-none"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Education */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#70645C]">
                              Education ({editableExtracted.education?.length || 0})
                            </label>
                            {editableExtracted.education && editableExtracted.education.length > 0 ? (
                              <span className="text-[10px] text-[#E85D04] bg-[#FFF0E6] px-1.5 py-0.5 rounded border border-[#E8D9CC] font-mono font-semibold">Detected</span>
                            ) : (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono font-semibold">None detected</span>
                            )}
                          </div>

                          <div className="space-y-3">
                            {editableExtracted.education?.map((edu, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    value={edu.degree}
                                    onChange={(e) => {
                                      const updated = [...(editableExtracted.education || [])];
                                      updated[idx] = { ...updated[idx], degree: e.target.value };
                                      setEditableExtracted((prev) => prev ? { ...prev, education: updated } : null);
                                    }}
                                    placeholder="Degree / Qualification"
                                    className="font-semibold text-[#2B211C] bg-transparent border-b border-[#E8D9CC] focus:border-[#E85D04] outline-none flex-1 py-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditableExtracted((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              education: prev.education?.filter((_, i) => i !== idx),
                                            }
                                          : null
                                      );
                                    }}
                                    className="text-rose-600 hover:text-rose-700 p-1"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    value={edu.institution}
                                    onChange={(e) => {
                                      const updated = [...(editableExtracted.education || [])];
                                      updated[idx] = { ...updated[idx], institution: e.target.value };
                                      setEditableExtracted((prev) => prev ? { ...prev, education: updated } : null);
                                    }}
                                    placeholder="Institution"
                                    className="text-[#70645C] bg-[#FFFFFF] rounded-lg px-2.5 py-1.5 border border-[#E8D9CC] outline-none"
                                  />
                                  <input
                                    type="text"
                                    value={edu.year}
                                    onChange={(e) => {
                                      const updated = [...(editableExtracted.education || [])];
                                      updated[idx] = { ...updated[idx], year: e.target.value };
                                      setEditableExtracted((prev) => prev ? { ...prev, education: updated } : null);
                                    }}
                                    placeholder="Year"
                                    className="text-[#70645C] bg-[#FFFFFF] rounded-lg px-2.5 py-1.5 border border-[#E8D9CC] outline-none"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Projects */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#70645C]">
                              Projects ({editableExtracted.projects?.length || 0})
                            </label>
                            {editableExtracted.projects && editableExtracted.projects.length > 0 ? (
                              <span className="text-[10px] text-[#E85D04] bg-[#FFF0E6] px-1.5 py-0.5 rounded border border-[#E8D9CC] font-mono font-semibold">Detected</span>
                            ) : (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono font-semibold">None detected</span>
                            )}
                          </div>
                          <div className="space-y-3">
                            {editableExtracted.projects?.map((proj, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    value={proj.title}
                                    onChange={(e) => {
                                      const updated = [...(editableExtracted.projects || [])];
                                      updated[idx] = { ...updated[idx], title: e.target.value };
                                      setEditableExtracted((prev) => prev ? { ...prev, projects: updated } : null);
                                    }}
                                    placeholder="Project Title"
                                    className="font-semibold text-[#2B211C] bg-transparent border-b border-[#E8D9CC] focus:border-[#E85D04] outline-none flex-1 py-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditableExtracted((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              projects: prev.projects?.filter((_, i) => i !== idx),
                                            }
                                          : null
                                      );
                                    }}
                                    className="text-rose-600 hover:text-rose-700 p-1"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <textarea
                                  rows={2}
                                  value={proj.description}
                                  onChange={(e) => {
                                    const updated = [...(editableExtracted.projects || [])];
                                    updated[idx] = { ...updated[idx], description: e.target.value };
                                    setEditableExtracted((prev) => prev ? { ...prev, projects: updated } : null);
                                  }}
                                  placeholder="Project Description"
                                  className="w-full text-[#70645C] bg-[#FFFFFF] rounded-lg px-2.5 py-1.5 border border-[#E8D9CC] outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Certifications */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#70645C]">
                              Certifications ({editableExtracted.certifications?.length || 0})
                            </label>
                            {editableExtracted.certifications && editableExtracted.certifications.length > 0 ? (
                              <span className="text-[10px] text-[#E85D04] bg-[#FFF0E6] px-1.5 py-0.5 rounded border border-[#E8D9CC] font-mono font-semibold">Detected</span>
                            ) : (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono font-semibold">None detected</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 p-3 bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl min-h-[44px]">
                            {editableExtracted.certifications && editableExtracted.certifications.length > 0 ? (
                              editableExtracted.certifications.map((cert, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FFF0E6] border border-[#E8D9CC] text-[#2B211C]"
                                >
                                  {cert}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditableExtracted((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              certifications: prev.certifications?.filter((_, i) => i !== idx),
                                            }
                                          : null
                                      )
                                    }
                                    className="hover:text-rose-600"
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-[#70645C] italic">No certifications detected.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Modal Actions */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#E8D9CC]">
                        <button
                          type="button"
                          onClick={handleApplyExtractedData}
                          disabled={isApplyingData}
                          className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] font-bold text-sm transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          {isApplyingData ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              <span>Applying & Saving Profile...</span>
                            </>
                          ) : (
                            <>
                              <Check size={16} />
                              <span>Apply Extracted Info to Profile</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowExtractedData(false)}
                          className="w-full sm:w-auto py-2.5 px-5 rounded-xl border border-[#E8D9CC] bg-[#FFFCF8] hover:bg-[#FFF0E6] text-[#70645C] text-sm font-medium transition-colors"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-8">
                  {/* Profile Header Card */}
                  <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-2xl border border-[#E8D9CC] shadow-xs">

                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                      {/* Profile Image & Controls */}
                      <div className="flex flex-col items-center sm:items-start gap-3 shrink-0">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="relative group cursor-pointer"
                          title={user?.profile_image ? "Click to change photo" : "Click to upload photo"}
                        >
                          <div className="rounded-full p-[3px] bg-gradient-to-tr from-[#E85D04] via-[#E85D04] to-transparent transition-transform duration-200 group-hover:scale-[1.02]">
                            {user?.profile_image ? (
                              <img
                                src={getFullAvatarUrl(user.profile_image)}
                                alt="Profile"
                                className="w-[120px] h-[120px] rounded-full border-4 border-[#FFFFFF] object-cover shadow-sm bg-[#FFFCF8]"
                              />
                            ) : (
                              <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-[#E85D04] to-[#E85D04] text-[#2B211C] flex items-center justify-center text-4xl font-black border-4 border-[#FFFFFF] shadow-sm select-none">
                                {((editHeader ? profileData.name : user?.name) || "U").charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 rounded-full bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold gap-1">
                            <Camera size={20} className="text-white" />
                            <span className="text-[11px] font-bold">{user?.profile_image ? "Change" : "Upload"}</span>
                          </div>

                          {/* Camera Badge Icon Button */}
                          <button
                            type="button"
                            aria-label={user?.profile_image ? "Change photo" : "Upload photo"}
                            className="absolute bottom-1 right-1 w-9 h-9 bg-[#E85D04] hover:bg-[#E85D04] rounded-full flex items-center justify-center transition-all shadow-md text-[#2B211C] border-2 border-[#FFFFFF] hover:scale-110 active:scale-95"
                          >
                            <Camera size={16} />
                          </button>
                        </div>

                        {/* Action buttons below avatar */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingPhoto || isDeletingPhoto}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 bg-[#FFF0E6] text-[#E85D04] border border-[#E8D9CC] hover:bg-[#FFE5D2] cursor-pointer"
                          >
                            <Camera size={13} />
                            <span>{user?.profile_image ? "Change Photo" : "Upload Photo"}</span>
                          </button>

                          {user?.profile_image && (
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              disabled={isUploadingPhoto || isDeletingPhoto}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 border border-[#E8D9CC] hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer"
                              title="Remove photo"
                            >
                              {isDeletingPhoto ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                              <span>Remove</span>
                            </button>
                          )}
                        </div>

                        {/* Hidden file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={isUploadingPhoto || isDeletingPhoto}
                        />
                      </div>

                      {/* Profile Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <h2 className="text-2xl md:text-3xl font-semibold text-[#2B211C]">
                              {(editHeader ? profileData.name : user?.name) || "Your Name"}
                            </h2>
                            <p className="text-[#70645C] mt-1">
                              {profileData.designation || "Designation not set"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center text-[#70645C] gap-2">
                            <Mail size={18} className="text-[#E85D04]" />
                            <span className="truncate">
                              {profileData.email || "email@example.com"}
                            </span>
                          </div>

                          <div className="flex items-center text-[#70645C] gap-2">
                            <Phone size={18} className="text-[#E85D04]" />
                            <span>{profileData.phone || "Phone not set"}</span>
                          </div>

                          <div className="flex items-center text-[#70645C] gap-2">
                            <MapPin size={18} className="text-[#E85D04]" />
                            <span>{profileData.location || "Location not set"}</span>
                          </div>
                        </div>

                        {profileData.linkedinProfile && (
                          <div className="flex items-center text-[#70645C] gap-2 text-sm">
                            <Linkedin size={18} className="text-[#E85D04]" />
                            <a
                              href={profileData.linkedinProfile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#E85D04] hover:underline flex items-center gap-1 font-medium"
                            >
                              LinkedIn Profile <ExternalLink size={14} />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Header edit form */}
                    {editHeader && (
                      <div className="mt-8 pt-6 border-t border-[#E8D9CC]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-medium text-[#70645C] uppercase tracking-wide mb-2">
                              Full Name
                            </label>
                            <Input
                              value={profileData.name}
                              onChange={(e) => handleInputChange("name", e.target.value)}
                              placeholder="full name..."
                              className="w-full bg-[#FFFCF8] border border-[#E8D9CC] focus:border-[#E85D04] rounded-xl py-3 px-4 text-[#2B211C]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[#70645C] uppercase tracking-wide mb-2">
                              Designation
                            </label>
                            <Input
                              value={profileData.designation}
                              onChange={(e) =>
                                handleInputChange("designation", e.target.value)
                              }
                              placeholder="e.g., Frontend Developer"
                              className="w-full bg-[#FFFCF8] border border-[#E8D9CC] focus:border-[#E85D04] rounded-xl py-3 px-4 text-[#2B211C]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[#70645C] uppercase tracking-wide mb-2">
                              Phone Number
                            </label>
                            <Input
                              value={profileData.phone}
                              onChange={(e) => handleInputChange("phone", e.target.value)}
                              placeholder="phone number..."
                              className="w-full bg-[#FFFCF8] border border-[#E8D9CC] focus:border-[#E85D04] rounded-xl py-3 px-4 text-[#2B211C]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[#70645C] uppercase tracking-wide mb-2">
                              Location
                            </label>
                            <Input
                              value={profileData.location}
                              onChange={(e) =>
                                handleInputChange("location", e.target.value)
                              }
                              placeholder="location..."
                              className="w-full bg-[#FFFCF8] border border-[#E8D9CC] focus:border-[#E85D04] rounded-xl py-3 px-4 text-[#2B211C]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[#70645C] uppercase tracking-wide mb-2">
                              LinkedIn Profile
                            </label>
                            <Input
                              value={profileData.linkedinProfile}
                              onChange={(e) =>
                                handleInputChange("linkedinProfile", e.target.value)
                              }
                              placeholder="https://linkedin.com/in/username"
                              className="w-full bg-[#FFFCF8] border border-[#E8D9CC] focus:border-[#E85D04] rounded-xl py-3 px-4 text-[#2B211C]"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 7 Profile Navigation Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E8D9CC] my-6">
                    {[
                      { id: "info", label: "Professional Info" },
                      { id: "resume", label: "Resume" },
                      { id: "skills", label: "Skills" },
                      { id: "experience", label: "Experience" },
                      { id: "education", label: "Education" },
                      { id: "certifications", label: "Certifications" },
                      { id: "projects", label: "Projects" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                          activeTab === tab.id
                            ? "bg-gradient-to-r from-[#E85D04] to-[#E85D04] text-[#2B211C] font-bold shadow-xs"
                            : "bg-[#FFFFFF] text-[#70645C] hover:text-[#2B211C] border border-[#E8D9CC]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>                    {/* Resume Upload Section */}
                  <div className={`bg-[#FFFFFF] p-6 rounded-2xl border border-[#E8D9CC] shadow-xs ${activeTab !== "resume" && activeTab !== "info" ? "hidden" : "block"}`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#FFF0E6] flex items-center justify-center text-[#E85D04]">
                          <FileText size={22} />
                        </div>
                        <div>
                          <h3 className="text-lg md:text-xl font-semibold text-[#2B211C]">
                            Candidate CV &amp; Structural Ingestion
                          </h3>
                          <p className="text-[#70645C] text-xs md:text-sm">
                            Automated extraction of architectural scope, professional tenure, and technical competencies.
                          </p>
                        </div>
                      </div>
                    </div>

                    {uploadedResume && (
                      <div className="bg-[#FFFCF8] rounded-xl p-4 border border-[#E8D9CC] mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-200">
                            <FileText size={20} />
                          </div>
                          <div>
                            <div className="font-medium text-[#2B211C] text-sm">
                              {uploadedResume.filename}
                            </div>
                            <div className="text-xs text-[#70645C]">
                              Verified on {uploadedResume.uploadDate}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={uploadedResume.url.startsWith("http") ? uploadedResume.url : `${API_URL}${uploadedResume.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-[#2B211C] border border-[#E8D9CC] hover:bg-[#FFF7EF] transition-colors shadow-xs"
                          >
                            <Download size={14} />
                            Download
                          </a>
                          <button
                            onClick={handleResumeRemove}
                            className="text-rose-500 hover:text-rose-600 p-1"
                            aria-label="Remove resume"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Animated Upload Pipeline State Display */}
                    {uploadStage !== "idle" && (
                      <div className="mb-4 p-4 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-[#E85D04] font-semibold uppercase">
                            Candidate Dossier Pipeline
                          </span>
                          <span className="text-[#70645C] capitalize">{uploadStage}...</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                          {[
                            { id: "uploading", label: "01 Uploading" },
                            { id: "processing", label: "02 Ingestion" },
                            { id: "extracting", label: "03 AI Synthesis" },
                            { id: "completed", label: "04 Verified" },
                          ].map((stage) => {
                            const stageKeys = ["uploading", "processing", "extracting", "completed"];
                            const currentIdx = stageKeys.indexOf(uploadStage);
                            const thisIdx = stageKeys.indexOf(stage.id);
                            const isDone = currentIdx >= thisIdx;

                            return (
                              <div
                                key={stage.id}
                                className={`py-1.5 px-2 rounded-xl border transition-all ${
                                  isDone
                                    ? "bg-[#FFF0E6] text-[#E85D04] border-[#E8D9CC] font-bold"
                                    : "bg-white text-[#70645C] border-[#E8D9CC]"
                                }`}
                              >
                                {stage.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Upload Error & Retry */}
                    {uploadError && (
                      <div className="mb-4 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <X size={16} className="text-rose-400 shrink-0" />
                          <span>{uploadError}</span>
                        </div>
                        <label className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 rounded-lg font-medium cursor-pointer transition-colors shrink-0">
                          Retry
                          <input
                            type="file"
                            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleResumeUpload}
                            className="hidden"
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    )}

                    {/* Drag and Drop Box */}
                    <div className="border-2 border-dashed border-[#E8D9CC] hover:border-[#E85D04] transition-colors rounded-2xl p-8 text-center bg-[#FFFCF8]">
                      <FileText size={40} className="text-[#E85D04] mx-auto mb-3" />
                      <h4 className="text-base font-semibold text-[#2B211C] mb-1">
                        Upload Resume / CV Document
                      </h4>
                      <p className="text-[#70645C] text-xs mb-4 max-w-sm mx-auto">
                        Supports PDF and DOCX formats up to 10MB. AI extracts professional history, education, and core skills with an interactive review before saving.
                      </p>

                      <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] shadow-md shadow-orange-500/20 cursor-pointer transition-all active:scale-95">
                        {isUploading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Processing Document ({uploadStage})...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            <span>Select PDF or DOCX</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleResumeUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E8D9CC] shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#FFF0E6] flex items-center justify-center text-[#E85D04]">
                          <Settings size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg md:text-xl font-semibold text-[#2B211C]">Skills</h3>
                          <p className="text-[#70645C] text-xs md:text-sm">
                            Highlight tools, languages, and frameworks you’re confident with.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {editSkills && !showSkillInput && (
                          <button
                            onClick={() => setShowSkillInput(true)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#2B211C] border border-[#E8D9CC] hover:bg-[#FFF7EF] shadow-xs min-h-[38px]"
                          >
                            <Plus size={14} />
                            Add Skill
                          </button>
                        )}

                        {!editSkills ? (
                          <button
                            onClick={() => setEditSkills(true)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-[#2B211C] border border-[#E8D9CC] hover:bg-[#FFF7EF] shadow-xs min-h-[38px]"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={async () => {
                                await handleSave();
                                setEditSkills(false);
                                setShowSkillInput(false);
                              }}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] shadow-xs min-h-[38px]"
                            >
                              <Check size={14} />
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditSkills(false);
                                setShowSkillInput(false);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-[#70645C] border border-[#E8D9CC] hover:bg-[#FFF7EF] min-h-[38px]"
                            >
                              <X size={14} />
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Inline Add Skill Input Form (Task 1) */}
                    {editSkills && showSkillInput && (
                      <div className="mb-4 p-3 bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl flex items-center gap-2">
                        <input
                          type="text"
                          value={newSkillText}
                          onChange={(e) => setNewSkillText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newSkillText.trim()) {
                              e.preventDefault();
                              handleSkillAdd(newSkillText.trim());
                              setNewSkillText("");
                              setShowSkillInput(false);
                            }
                          }}
                          placeholder="e.g., TypeScript, Next.js, Docker..."
                          className="flex-1 bg-white border border-[#E8D9CC] rounded-lg px-3 py-1.5 text-xs text-[#2B211C] placeholder-[#70645C] focus:outline-none focus:border-[#E85D04]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newSkillText.trim()) {
                              handleSkillAdd(newSkillText.trim());
                              setNewSkillText("");
                              setShowSkillInput(false);
                            }
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-[#E85D04] to-[#E85D04] text-[#2B211C] text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewSkillText("");
                            setShowSkillInput(false);
                          }}
                          className="px-2.5 py-1.5 text-xs text-[#70645C] hover:text-[#2B211C] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {profileData.skills.length > 0 ? (
                        profileData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3.5 py-1.5 bg-[#FFFCF8] text-[#2B211C] border border-[#E8D9CC] rounded-full text-xs md:text-sm font-medium flex items-center gap-2"
                          >
                            {skill}
                            {editSkills && (
                              <button
                                onClick={() => handleSkillRemove(skill)}
                                className="text-red-500 hover:text-red-600"
                                aria-label="Remove skill"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </span>
                        ))
                      ) : (
                        <div className="text-center py-8 w-full">
                          <Settings size={40} className="text-[#70645C] mx-auto mb-3" />
                          <p className="text-[#70645C] mb-2 text-sm">No skills added yet.</p>
                          {editSkills && (
                            <button
                              onClick={() => {
                                const skill = prompt("Enter a skill:");
                                if (skill) handleSkillAdd(skill);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-[#2B211C] border border-[#E8D9CC] hover:bg-[#FFF7EF]"
                            >
                              Add Your First Skill
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Experience Section */}
                  <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E8D9CC] shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#FFF0E6] flex items-center justify-center text-[#E85D04]">
                          <Briefcase size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg md:text-xl font-semibold text-[#2B211C]">Experience</h3>
                          <p className="text-[#70645C] text-xs md:text-sm">
                            Share the roles where you applied your skills in real projects.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleExperienceAdd}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-[#2B211C] border border-[#E8D9CC] hover:bg-[#FFF7EF] shadow-xs"
                      >
                        <Plus size={14} />
                        Add Experience
                      </button>
                    </div>

                    <div className="space-y-4">
                      {profileData.experience.length > 0 ? (
                        profileData.experience.map((exp, index) => (
                          <div
                            key={index}
                            className="bg-[#FFFCF8] rounded-xl p-4 border border-[#E8D9CC] relative overflow-hidden"
                          >
                            <div className="absolute left-0 top-0 h-full w-[3px] bg-[#E85D04]" />

                            <div className="pl-4">
                              {editingExperienceIndex === index ? (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-sm text-[#2B211C]">
                                      Experience {index + 1}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleExperienceRemove(index)}
                                        className="text-red-500 hover:text-red-600"
                                        aria-label="Delete experience"
                                      >
                                        <Trash2 size={16} />
                                      </button>

                                      <button
                                        onClick={async () => {
                                          await handleSave();
                                          setEditingExperienceIndex(null);
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] shadow-xs"
                                      >
                                        <Check size={14} />
                                        Save
                                      </button>

                                      <button
                                        onClick={() => setEditingExperienceIndex(null)}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-white text-[#70645C] border border-[#E8D9CC] hover:bg-[#FFF7EF]"
                                      >
                                        <X size={14} />
                                        Cancel
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs font-semibold text-[#70645C] mb-1">Job Title</label>
                                      <Input
                                        value={exp.title}
                                        onChange={(e) =>
                                          handleExperienceUpdate(index, "title", e.target.value)
                                        }
                                        placeholder="e.g., Senior Frontend Engineer"
                                        className="bg-white border-[#E8D9CC] rounded-xl text-[#2B211C] placeholder-[#70645C] focus:border-[#E85D04]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-[#70645C] mb-1">Company</label>
                                      <Input
                                        value={exp.company}
                                        onChange={(e) =>
                                          handleExperienceUpdate(index, "company", e.target.value)
                                        }
                                        placeholder="e.g., Acme Corp"
                                        className="bg-white border-[#E8D9CC] rounded-xl text-[#2B211C] placeholder-[#70645C] focus:border-[#E85D04]"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-semibold text-[#70645C] mb-1">Duration</label>
                                      <Input
                                        value={exp.duration}
                                        onChange={(e) =>
                                          handleExperienceUpdate(index, "duration", e.target.value)
                                        }
                                        placeholder="e.g., Jan 2022 - Present"
                                        className="bg-white border-[#E8D9CC] rounded-xl text-[#2B211C] placeholder-[#70645C] focus:border-[#E85D04]"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-semibold text-[#70645C] mb-1">Key Responsibilities & Impact</label>
                                    <textarea
                                      value={exp.description}
                                      onChange={(e) =>
                                        handleExperienceUpdate(index, "description", e.target.value)
                                      }
                                      placeholder="e.g., Led architecture migration to Next.js, improved Core Web Vitals by 40%, and mentored junior engineers..."
                                      rows={3}
                                      className="w-full bg-white border border-[#E8D9CC] rounded-xl py-3 px-4 text-[#2B211C] placeholder-[#70645C] resize-none text-sm focus:outline-none focus:border-[#E85D04]"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 mb-1">
                                    <h4 className="font-semibold text-base text-[#2B211C]">
                                      {exp.title || "Job Title"}
                                    </h4>
                                    <span className="text-xs text-[#70645C] font-mono">
                                      {exp.duration || "Duration not set"}
                                    </span>
                                  </div>

                                  <p className="text-[#E85D04] font-medium text-sm mb-2">
                                    {exp.company || "Company"}
                                  </p>

                                  <p className="text-[#70645C] text-sm leading-relaxed">
                                    {exp.description ||
                                      "Add a short description about what you worked on and your impact."}
                                  </p>

                                  <div className="mt-3">
                                    <button
                                      onClick={() => setEditingExperienceIndex(index)}
                                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-white text-[#2B211C] border border-[#E8D9CC] hover:bg-[#FFF7EF] shadow-xs"
                                    >
                                      <Pencil size={14} />
                                      Edit
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Briefcase size={40} className="text-[#70645C] mx-auto mb-3" />
                          <p className="text-[#70645C] mb-3 text-sm">No experience added yet.</p>
                          <button
                            onClick={handleExperienceAdd}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-[#2B211C] border border-[#E8D9CC] hover:bg-[#FFF7EF]"
                          >
                            Add Your First Experience
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Education Section */}
                  <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E8D9CC] shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#FFF0E6] flex items-center justify-center text-[#E85D04]">
                          <GraduationCap size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg md:text-xl font-semibold text-[#2B211C]">Education</h3>
                          <p className="text-[#70645C] text-xs md:text-sm">
                            Show where you studied and what you completed.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleEducationAdd}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-[#2B211C] border border-[#E8D9CC] hover:bg-[#FFF7EF] shadow-xs"
                      >
                        <Plus size={14} />
                        Add Education
                      </button>
                    </div>

                    <div className="space-y-4">
                      {profileData.education.length > 0 ? (
                        profileData.education.map((edu, index) => (
                          <div
                            key={index}
                            className="bg-[#FFFCF8] rounded-xl p-4 border border-[#E8D9CC] relative overflow-hidden"
                          >
                            <div className="absolute left-0 top-0 h-full w-[3px] bg-[#E85D04]" />

                            <div className="pl-4">
                              {editingEducationIndex === index ? (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-sm text-[#2B211C]">
                                      Education {index + 1}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleEducationRemove(index)}
                                        className="text-red-500 hover:text-red-600"
                                        aria-label="Delete education"
                                      >
                                        <Trash2 size={16} />
                                      </button>

                                      <button
                                        onClick={async () => {
                                          await handleSave();
                                          setEditingEducationIndex(null);
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] shadow-xs"
                                      >
                                        <Check size={14} />
                                        Save
                                      </button>

                                      <button
                                        onClick={() => setEditingEducationIndex(null)}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-white text-[#70645C] border border-[#E8D9CC] hover:bg-[#FFF7EF]"
                                      >
                                        <X size={14} />
                                        Cancel
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs font-semibold text-[#70645C] mb-1">Degree / Certification</label>
                                      <Input
                                        value={edu.degree}
                                        onChange={(e) =>
                                          handleEducationUpdate(index, "degree", e.target.value)
                                        }
                                        placeholder="e.g., Bachelor of Technology in Computer Science"
                                        className="bg-white border-[#E8D9CC] rounded-xl text-[#2B211C] placeholder-[#70645C] focus:border-[#E85D04]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-[#70645C] mb-1">Institution Name</label>
                                      <Input
                                        value={edu.institution}
                                        onChange={(e) =>
                                          handleEducationUpdate(index, "institution", e.target.value)
                                        }
                                        placeholder="e.g., National Institute of Technology"
                                        className="bg-white border-[#E8D9CC] rounded-xl text-[#2B211C] placeholder-[#70645C] focus:border-[#E85D04]"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-semibold text-[#70645C] mb-1">Graduation Year / Period</label>
                                      <Input
                                        value={edu.year}
                                        onChange={(e) =>
                                          handleEducationUpdate(index, "year", e.target.value)
                                        }
                                        placeholder="e.g., 2018 - 2022"
                                        className="bg-white border-[#E8D9CC] rounded-xl text-[#2B211C] placeholder-[#70645C] focus:border-[#E85D04]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 mb-1">
                                    <h4 className="font-semibold text-base text-[#2B211C]">
                                      {edu.degree || "Degree"}
                                    </h4>
                                    <span className="text-xs text-[#70645C] font-mono">
                                      {edu.year || "Year not set"}
                                    </span>
                                  </div>

                                  <p className="text-[#E85D04] font-medium text-sm">
                                    {edu.institution || "Institution"}
                                  </p>

                                  <div className="mt-3">
                                    <button
                                      onClick={() => setEditingEducationIndex(index)}
                                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-white text-[#2B211C] border border-[#E8D9CC] hover:bg-[#FFF7EF] shadow-xs"
                                    >
                                      <Pencil size={14} />
                                      Edit
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <GraduationCap size={40} className="text-[#70645C] mx-auto mb-3" />
                          <p className="text-[#70645C] mb-3 text-sm">No education added yet.</p>
                          <button
                            onClick={handleEducationAdd}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-[#2B211C] border border-[#E8D9CC] hover:bg-[#FFF7EF]"
                          >
                            Add Your Education
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Career Goals Section */}
                  <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E8D9CC] shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#FFF0E6] flex items-center justify-center text-[#E85D04]">
                          <Target size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg md:text-xl font-semibold text-[#2B211C]">Career Goals</h3>
                          <p className="text-[#70645C] text-xs md:text-sm">
                            Tell us where you want to go so we can match the right opportunities.
                          </p>
                        </div>
                      </div>

                      {(() => {
                        const count = (profileData.goals || "").trim() ? (profileData.goals || "").trim().split(/\s+/).filter(Boolean).length : 0;
                        const isGoalsValid = count >= 25;
                        return !editGoals ? (
                          <button
                            onClick={() => setEditGoals(true)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-[#2B211C] border border-[#E8D9CC] hover:bg-[#FFF7EF] shadow-xs min-h-[38px]"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              disabled={!isGoalsValid}
                              onClick={async () => {
                                if (!isGoalsValid) {
                                  toast.error("Career goals must be at least 25 words.");
                                  return;
                                }
                                await handleSave();
                                setEditGoals(false);
                              }}
                              className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold min-h-[38px] transition-all ${
                                isGoalsValid
                                  ? "bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] shadow-xs cursor-pointer"
                                  : "bg-[#FFF0E6] text-[#70645C] cursor-not-allowed opacity-60"
                              }`}
                            >
                              <Check size={14} />
                              Save
                            </button>
                            <button
                              onClick={() => setEditGoals(false)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-[#70645C] border border-[#E8D9CC] hover:bg-[#FFF7EF] min-h-[38px]"
                            >
                              <X size={14} />
                              Cancel
                            </button>
                          </div>
                        );
                      })()}
                    </div>

                    {editGoals ? (
                      <div className="space-y-3">
                        <textarea
                          value={profileData.goals}
                          onChange={(e) => handleInputChange("goals", e.target.value)}
                          placeholder="Describe your career aspirations, target roles, preferred engineering domains, and what you want to achieve next (minimum 25 words)..."
                          rows={4}
                          className="w-full bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl py-3 px-4 text-[#2B211C] placeholder-[#70645C] resize-none text-sm focus:outline-none focus:border-[#E85D04]"
                        />
                        {(() => {
                          const count = (profileData.goals || "").trim() ? (profileData.goals || "").trim().split(/\s+/).filter(Boolean).length : 0;
                          const isValid = count >= 25;
                          return (
                            <div className="flex items-center justify-between text-xs px-1">
                              <span className={`font-mono font-medium ${isValid ? "text-[#E85D04]" : "text-[#70645C]"}`}>
                                {count} / 25 words minimum {isValid ? "✓ (Ready to save)" : `(${25 - count} words remaining)`}
                              </span>
                              {!isValid && count > 0 && (
                                <span className="text-amber-600 font-medium">
                                  Please write at least 25 words
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : profileData.goals ? (
                      <div className="bg-[#FFFCF8] rounded-xl p-4 border border-[#E8D9CC]">
                        <p className="text-[#70645C] leading-relaxed text-sm md:text-base">
                          {profileData.goals}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Target size={40} className="text-[#70645C] mx-auto mb-3" />
                        <p className="text-[#70645C] mb-2 text-sm">
                          No career goals set yet.
                        </p>
                        <p className="text-[#70645C] text-xs">
                          Click the edit button above to describe your goals and preferred roles.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Profile Stats */}
                  <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E8D9CC] shadow-xs">
                    <h3 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2 text-[#2B211C]">
                      <Award size={22} className="text-[#E85D04]" />
                      Profile Statistics
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#FFFCF8] p-4 rounded-xl text-center border border-[#E8D9CC]">
                        <div className="text-[#E85D04] text-2xl font-bold mb-1 font-mono">
                          {completion.percent}%
                        </div>
                        <div className="text-xs text-[#70645C]">Profile Completion</div>
                      </div>

                      <div className="bg-[#FFFCF8] p-4 rounded-xl text-center border border-[#E8D9CC]">
                        <div className="text-[#E85D04] text-2xl font-bold mb-1 font-mono">
                          {profileData.skills.length}
                        </div>
                        <div className="text-xs text-[#70645C]">Skills</div>
                      </div>

                      <div className="bg-[#FFFCF8] p-4 rounded-xl text-center border border-[#E8D9CC]">
                        <div className="text-[#E85D04] text-2xl font-bold mb-1 font-mono">
                          {profileData.experience.length}
                        </div>
                        <div className="text-xs text-[#70645C]">Experience</div>
                      </div>

                      <div className="bg-[#FFFCF8] p-4 rounded-xl text-center border border-[#E8D9CC]">
                        <div className="text-[#E85D04] text-2xl font-bold mb-1 font-mono">
                          {profileData.education.length}
                        </div>
                        <div className="text-xs text-[#70645C]">Education</div>
                      </div>
                    </div>

                    {hasUnsavedChanges && (
                      <div className="mt-4 text-xs text-[#E85D04] font-medium">
                        You have unsaved changes. Don’t forget to save sections after editing.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Profile Picture Upload & Preview Modal */}
        {isPhotoModalOpen && selectedImageFile && imagePreviewUrl && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-[#FFFFFF] border border-[#E8D9CC] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#E8D9CC] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-[#FFF0E6] text-[#E85D04] border border-[#E8D9CC]">
                    <Camera size={18} />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-[#2B211C]">
                      {user?.profile_image ? "Change Profile Photo" : "Upload Profile Photo"}
                    </h3>
                    <p className="text-xs text-[#70645C]">Preview your photo before saving</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  disabled={isUploadingPhoto}
                  className="p-1.5 rounded-lg text-[#70645C] hover:text-[#2B211C] hover:bg-[#FFF0E6] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Preview Body */}
              <div className="flex flex-col items-center justify-center py-2 space-y-4">
                <div className="rounded-full p-1 bg-gradient-to-tr from-[#E85D04] to-[#E85D04] shadow-md">
                  <img
                    src={imagePreviewUrl}
                    alt="Avatar Preview"
                    className="w-[140px] h-[140px] rounded-full object-cover border-4 border-[#FFFFFF] bg-[#FFFCF8]"
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-[#2B211C] truncate max-w-[280px]">
                    {selectedImageFile.name}
                  </p>
                  <p className="text-xs text-[#70645C] font-mono">
                    {(selectedImageFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedImageFile.type || "image"}
                  </p>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8D9CC]">
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  disabled={isUploadingPhoto}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#70645C] bg-[#FFFCF8] border border-[#E8D9CC] hover:text-[#2B211C] hover:bg-[#FFF0E6] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  disabled={isUploadingPhoto}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D95304] text-[#2B211C] shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-[#2B211C]" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} className="text-[#2B211C]" />
                      <span>Confirm & Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
