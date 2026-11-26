"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HardDrive,
  Clock,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Database,
  Info,
  Calendar,
  X,
  CheckSquare,
  Search,
} from "lucide-react";
import { adminFetch } from "@/lib/adminApi";
import { formatRoleName, formatCandidateName } from "@/utils/formatters";

interface RecordingStatusInfo {
  label: string;
  className: string;
  dotClassName: string;
  isDownloadable: boolean;
  disabledReason: string | null;
}

function getRecordingStatusDisplay(rec: any): RecordingStatusInfo {
  const isPurged = Boolean(rec.isDeleted || rec.recordingStatus === "purged" || rec.status === "deleted");
  const isExpired = Boolean(
    rec.isExpired ||
      (rec.remainingDays <= 0 &&
        rec.remainingHours <= 0 &&
        rec.expiresAt &&
        new Date(rec.expiresAt).getTime() <= Date.now())
  );

  const rawStatus = String(rec.status || rec.recordingStatus || "").toLowerCase().trim();
  const rawRecStatus = String(rec.recordingStatus || "").toLowerCase().trim();
  const sizeBytes = Number(rec.sizeBytes ?? rec.fileSize ?? 0);
  const isZeroBytes = sizeBytes <= 0;
  const hasPhysicalFile = rec.fileExists === true && !isZeroBytes;

  if (isPurged) {
    return {
      label: "Purged",
      className: "bg-gray-100 text-[#64748B] border border-gray-300",
      dotClassName: "bg-gray-400",
      isDownloadable: false,
      disabledReason: "Recording has been permanently purged from storage.",
    };
  }

  if (isExpired) {
    return {
      label: "Expired",
      className: "bg-red-50 text-red-600 border border-red-200",
      dotClassName: "bg-red-500",
      isDownloadable: false,
      disabledReason: "Recording expired past the strict 10-day retention window.",
    };
  }

  // 1. Completed + physical file exists + not expired -> Active
  if ((rawRecStatus === "active" || rawStatus === "completed" || rawStatus === "ready") && hasPhysicalFile) {
    const isExpiringSoon = (rec.remainingDays ?? 10) < 2;
    return {
      label: isExpiringSoon ? "Active (Expiring Soon)" : "Active",
      className: isExpiringSoon
        ? "bg-amber-50 text-amber-700 border border-amber-200"
        : "bg-emerald-50 text-emerald-700 border border-emerald-200",
      dotClassName: isExpiringSoon ? "bg-amber-500" : "bg-emerald-500",
      isDownloadable: true,
      disabledReason: null,
    };
  }

  // 2. Completed + file missing -> Missing Media
  if (
    rawRecStatus === "missing" ||
    ((rawStatus === "completed" || rawStatus === "ready") && !hasPhysicalFile && rawRecStatus !== "incomplete")
  ) {
    return {
      label: "Missing Media",
      className: "bg-rose-50 text-rose-700 border border-rose-200",
      dotClassName: "bg-rose-500",
      isDownloadable: false,
      disabledReason: "Recording was marked completed, but physical media file is missing from storage.",
    };
  }

  // 3. Uploading / zero bytes / abandoned -> Incomplete
  return {
    label: "Incomplete",
    className: "bg-slate-100 text-slate-600 border border-slate-300",
    dotClassName: "bg-slate-400",
    isDownloadable: false,
    disabledReason: "Session was abandoned or recording upload was never completed.",
  };
}

export default function RecordingManagementPage() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupReport, setCleanupReport] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingSession, setDownloadingSession] = useState<string | null>(null);

  // Selection & Deletion State
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<any | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [deleteActionLoading, setDeleteActionLoading] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  const filteredRecordings = recordings.filter((rec: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const sid = String(rec.sessionId || "").toLowerCase();
    const cName = String(rec.candidateName || "").toLowerCase();
    const cEmail = String(rec.candidateEmail || "").toLowerCase();
    const role = String(rec.role || rec.interviewCategory || "").toLowerCase();
    return sid.includes(term) || cName.includes(term) || cEmail.includes(term) || role.includes(term);
  });

  const fetchRecordings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status_filter: statusFilter,
      });

      const res = await adminFetch(`/api/admin/recordings?${params.toString()}`);
      if (res.success) {
        setRecordings(res.recordings || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        if (res.storageStats) setStorageStats(res.storageStats);
        setSelectedSessionIds([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load recording registry");
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const handleTriggerCleanup = async () => {
    const confirmCleanup = window.confirm(
      "Execute strict 10-day retention cleanup? This will permanently delete physical media files older than 10 days and update database records. Non-recording files and resumes will not be touched."
    );
    if (!confirmCleanup) return;

    try {
      setCleanupLoading(true);
      const res = await adminFetch("/api/admin/recordings/cleanup/trigger", {
        method: "POST",
      });
      if (res.success) {
        setCleanupReport(res.report);
        fetchRecordings();
      }
    } catch (err: any) {
      alert("Retention cleanup error: " + err.message);
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleDownload = async (sessionId: string) => {
    try {
      setDownloadingSession(sessionId);
      const res = await adminFetch(`/api/admin/recordings/${sessionId}/download-token`, {
        method: "POST",
      });
      if (res.success && res.downloadToken) {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        window.open(
          `${API_BASE}/api/admin/recordings/${sessionId}/download?token=${res.downloadToken}`,
          "_blank"
        );
      }
    } catch (err: any) {
      alert(err.message || "Failed to generate download token");
    } finally {
      setDownloadingSession(null);
    }
  };

  // Selection toggles
  const toggleSelectAll = () => {
    if (selectedSessionIds.length === recordings.length) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(recordings.map((r) => r.sessionId));
    }
  };

  const toggleSelectOne = (sid: string) => {
    if (selectedSessionIds.includes(sid)) {
      setSelectedSessionIds(selectedSessionIds.filter((id) => id !== sid));
    } else {
      setSelectedSessionIds([...selectedSessionIds, sid]);
    }
  };

  // Single recording deletion
  const executeSingleDelete = async () => {
    if (!singleDeleteTarget) return;
    const sid = singleDeleteTarget.sessionId;
    try {
      setDeleteActionLoading(true);
      const res = await adminFetch(`/api/admin/recordings/${sid}`, {
        method: "DELETE",
      });
      if (res.success) {
        setSingleDeleteTarget(null);
        setDeleteSuccessMsg(`Recording for session ${sid} permanently deleted.`);
        setTimeout(() => setDeleteSuccessMsg(null), 6000);
        fetchRecordings();
      }
    } catch (err: any) {
      alert("Failed to delete recording: " + err.message);
    } finally {
      setDeleteActionLoading(false);
    }
  };

  // Bulk recording deletion
  const executeBulkDelete = async () => {
    if (selectedSessionIds.length === 0) return;
    try {
      setDeleteActionLoading(true);
      const res = await adminFetch(`/api/admin/recordings/bulk-delete`, {
        method: "POST",
        body: JSON.stringify({
          sessionIds: selectedSessionIds,
          reason: "Super Admin bulk recording deletion",
        }),
      });
      if (res.success) {
        setBulkDeleteModalOpen(false);
        setSelectedSessionIds([]);
        const freedMB = ((res.freedBytes || 0) / (1024 * 1024)).toFixed(2);
        setDeleteSuccessMsg(
          `Successfully purged ${res.deletedCount} recording files (${freedMB} MB reclaimed).`
        );
        setTimeout(() => setDeleteSuccessMsg(null), 7000);
        fetchRecordings();
      }
    } catch (err: any) {
      alert("Bulk delete failed: " + err.message);
    } finally {
      setDeleteActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Recording Retention Engine</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Enforcing strict 10-day storage lifecycle, short-lived signed tokens, and automated media purge.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerCleanup}
            disabled={cleanupLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Trash2 size={15} className={cleanupLoading ? "animate-spin" : ""} />
            <span>{cleanupLoading ? "Cleaning Up..." : "Trigger Retention Cleanup"}</span>
          </button>

          <button
            onClick={fetchRecordings}
            className="p-2 bg-white border border-[#E5E7EB] text-[#64748B] hover:text-[#111827] rounded-lg transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-[#4F46E5]" : ""} />
          </button>
        </div>
      </div>

      {deleteSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{deleteSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bulk Selection Bar */}
      {selectedSessionIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2 text-[#111827] font-semibold">
            <CheckSquare size={16} className="text-red-400" />
            <span>{selectedSessionIds.length} recording(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSessionIds([])}
              className="px-3 py-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-white/5"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-[#111827] font-bold transition-colors"
            >
              <Trash2 size={14} />
              <span>Delete Selected ({selectedSessionIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Retention Policy Highlight Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-indigo-50/60 border border-[#E5E7EB] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[#111827] font-bold text-sm">
            <Clock size={18} className="text-[#4F46E5]" />
            <span>Strict 10-Day Retention Policy Specification</span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-200 font-semibold">
            Immutable 10 Days
          </span>
        </div>
        <p className="text-xs text-[#64748B] leading-relaxed">
          Interview session audio and screen recordings are retained for exactly <strong className="text-[#111827]">10 days (240 hours)</strong> from the documented creation timestamp. Once expired, media is rejected with HTTP 410 Gone and physically purged by the automated distributed cleanup engine. Protected candidate resumes and static application assets are never pruned.
        </p>
      </div>

      {/* Storage Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB]">
          <div className="text-xs text-[#64748B]">Total Media Storage</div>
          <div className="text-2xl font-bold text-[#111827] mt-1">
            {storageStats?.totalMB !== undefined ? `${storageStats.totalMB} MB` : "0.0 MB"}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">Physical media on disk</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB]">
          <div className="text-xs text-[#64748B]">Active Media</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {storageStats?.activeRecordings ?? 0}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">Completed &amp; verified on disk</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB]">
          <div className="text-xs text-[#64748B]">Incomplete Sessions</div>
          <div className="text-2xl font-bold text-slate-500 mt-1">
            {storageStats?.incompleteRecordings ?? 0}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">Abandoned / zero bytes</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB]">
          <div className="text-xs text-[#64748B]">Expiring in &lt; 48 Hours</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {storageStats?.expiringSoonCount ?? 0}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">Immediate deletion queue</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB]">
          <div className="text-xs text-[#64748B]">Expired / Purged</div>
          <div className="text-2xl font-bold text-red-500 mt-1">
            {(storageStats?.expiredRecordings ?? storageStats?.pendingDeletionCount ?? 0) + (storageStats?.deletedRecordings ?? 0)}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">Exceeded 10 days</div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "all", label: "All Records" },
            { key: "active", label: "Active Media" },
            { key: "incomplete", label: "Incomplete Sessions" },
            { key: "missing", label: "Missing Media" },
            { key: "expired", label: "Expired / Purged" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === tab.key
                  ? "bg-[#EEF2FF] text-[#4F46E5] border border-indigo-200 font-semibold shadow-sm"
                  : "text-[#64748B] hover:text-[#111827] hover:bg-gray-50 border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by session, candidate..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFF] border border-[#E5E7EB] focus:border-indigo-300 focus:bg-white rounded-lg text-xs text-[#111827] placeholder-gray-400 focus:outline-none transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Recordings Table */}
      <div className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#334155]">
            <thead className="bg-[#F8FAFF] text-xs uppercase tracking-wider text-[#334155] font-semibold border-b border-[#E5E7EB]">
              <tr>
                <th className="px-4 py-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={recordings.length > 0 && selectedSessionIds.length === recordings.length}
                    onChange={toggleSelectAll}
                    className="rounded border-[#E5E7EB] bg-white text-[#4F46E5] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 font-semibold">Session ID</th>
                <th className="px-6 py-4 font-semibold">Candidate &amp; Role</th>
                <th className="px-6 py-4 font-semibold">File / Size</th>
                <th className="px-6 py-4 font-semibold">Created</th>
                <th className="px-6 py-4 font-semibold">10-Day Expiry Countdown</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#64748B]">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-[#00FFB2] border-t-transparent rounded-full mb-2"></div>
                    <div>Scanning recording storage records...</div>
                  </td>
                </tr>
              ) : filteredRecordings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#64748B]">
                    {searchTerm ? "No recordings match your search criteria." : "No recordings found in current lifecycle filter."}
                  </td>
                </tr>
              ) : (
                filteredRecordings.map((rec) => {
                  const sid = rec.sessionId;
                  const statusInfo = getRecordingStatusDisplay(rec);
                  const isExpired = rec.isExpired || rec.isDeleted || statusInfo.label === "Expired" || statusInfo.label === "Purged";
                  const remainingDays = rec.remainingDays ?? 0;
                  const remainingHours = rec.remainingHours ?? 0;
                  const isChecked = selectedSessionIds.includes(sid);

                  // Progress percentage (10 days total)
                  const progressPct = Math.min(100, Math.max(0, Math.round((remainingDays / 10) * 100)));

                  return (
                    <tr
                      key={rec.id || rec._id}
                      className={`hover:bg-[#F8FAFF]/50 transition-colors ${
                        isChecked ? "bg-red-500/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(sid)}
                          className="rounded border-[#E5E7EB] bg-white text-[#4F46E5] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Session ID */}
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-[#111827]">
                        {sid}
                      </td>

                      {/* Candidate & Role */}
                      <td className="px-6 py-4 text-xs">
                        <div className="font-semibold text-[#111827]">
                          {formatCandidateName(rec.candidateName, rec.candidateEmail, rec.userId ? `Candidate (${rec.userId.slice(0, 8)})` : "Candidate")}
                        </div>
                        <div className="text-[#64748B] flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-[#4F46E5]">{formatRoleName(rec.role || rec.interviewCategory)}</span>
                          {rec.candidateEmail && (
                            <>
                              <span>•</span>
                              <span className="text-[11px] truncate max-w-[140px]">{rec.candidateEmail}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* File / Size */}
                      <td className="px-6 py-4 text-xs">
                        <div className="font-medium text-[#111827]">{rec.filename || "recording.webm"}</div>
                        <div className="text-[#64748B]">{rec.fileSizeFormatted || `${rec.fileSize || rec.sizeBytes || 0} bytes`}</div>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4 text-xs text-[#64748B]">
                        {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : "N/A"}
                      </td>

                      {/* Remaining Countdown Bar */}
                      <td className="px-6 py-4">
                        {!isExpired ? (
                          <div className="space-y-1.5 min-w-[140px]">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#4F46E5]">
                                {remainingDays >= 1 ? `${remainingDays} days left` : `${remainingHours} hrs left`}
                              </span>
                              <span className="text-[10px] text-[#64748B]">{progressPct}%</span>
                            </div>
                            <div className="w-full bg-[#1E293B] h-1.5 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${progressPct}%` }}
                                className={`h-full rounded-full ${
                                  remainingDays < 2 ? "bg-amber-400" : "bg-[#00FFB2]"
                                }`}
                              ></div>
                            </div>
                            <div className="text-[10px] text-[#64748B]">
                              Expires: {new Date(rec.expiresAt).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-red-400 font-semibold flex items-center gap-1.5">
                            <XCircle size={14} />
                            <span>Expired (&gt; 10 days)</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold ${statusInfo.className}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClassName}`}></span>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {statusInfo.isDownloadable ? (
                            <button
                              onClick={() => handleDownload(sid)}
                              disabled={downloadingSession === sid}
                              aria-label="Download Recording"
                              title="Download verified recording media"
                              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#F8FAFF] border border-[#E5E7EB] hover:border-indigo-300 text-[#111827] hover:text-[#4F46E5] text-xs font-semibold flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
                            >
                              <Download size={14} className={downloadingSession === sid ? "animate-pulse motion-reduce:animate-none" : ""} />
                              <span>Link</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              aria-label="Download unavailable"
                              title={statusInfo.disabledReason || "Recording download is unavailable"}
                              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 text-xs font-medium flex items-center gap-1.5 cursor-not-allowed opacity-60"
                            >
                              <Download size={14} />
                              <span>Link</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSingleDeleteTarget(rec)}
                            aria-label="Delete Recording Media Permanently"
                            title="Delete Recording Media Permanently"
                            className="min-h-[38px] min-w-[38px] p-2 text-[#334155] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-[#F8FAFF] border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B]">
          <div>
            Showing Page <span className="font-bold text-[#111827]">{page}</span> of{" "}
            <span className="font-bold text-[#111827]">{totalPages}</span> ({total} recordings total)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 bg-white border border-[#E5E7EB] rounded-lg disabled:opacity-30 hover:border-gray-500 text-[#334155]"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 bg-white border border-[#E5E7EB] rounded-lg disabled:opacity-30 hover:border-gray-500 text-[#334155]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* SINGLE DELETE CONFIRMATION MODAL */}
      {singleDeleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-red-500/30 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111827]">Delete Recording Media</h3>
                <p className="text-xs text-[#64748B] font-mono">{singleDeleteTarget.sessionId}</p>
              </div>
            </div>

            <p className="text-xs text-[#334155] leading-relaxed">
              This will permanently delete the recording file from physical disk storage.
              Interview evaluation results, candidate answers, and scores will remain intact.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSingleDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs text-[#64748B] hover:text-[#111827]"
              >
                Cancel
              </button>
              <button
                onClick={executeSingleDelete}
                disabled={deleteActionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-[#111827]"
              >
                {deleteActionLoading ? "Deleting..." : "Delete Media"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-red-500/40 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E5E7EB] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111827]">
                    Bulk Delete {selectedSessionIds.length} Recordings
                  </h3>
                  <p className="text-xs text-red-400">Irreversible Disk Purge</p>
                </div>
              </div>
              <button
                onClick={() => setBulkDeleteModalOpen(false)}
                className="p-1 text-[#64748B] hover:text-[#111827] rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-[#334155] leading-relaxed">
              You are about to permanently delete physical recording files for{" "}
              <strong className="text-[#111827]">{selectedSessionIds.length}</strong> selected interview sessions.
            </p>

            <div className="p-3 rounded-xl bg-[#F8FAFF] border border-[#E5E7EB] text-xs text-[#64748B] space-y-1">
              <div>• Physical video/audio media files will be deleted from disk.</div>
              <div>• Interview scores, transcripts, and candidate accounts remain unaffected.</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-[#64748B] hover:text-[#111827]"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkDelete}
                disabled={deleteActionLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-[#111827] shadow-lg shadow-red-500/20"
              >
                {deleteActionLoading
                  ? "Purging Media..."
                  : `Confirm Media Purge (${selectedSessionIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEANUP REPORT DIALOG */}
      {cleanupReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2 text-[#111827] font-bold text-sm">
                <CheckCircle2 size={18} className="text-[#4F46E5]" />
                <span>Retention Cleanup Report</span>
              </div>
              <button
                onClick={() => setCleanupReport(null)}
                className="p-1 text-[#64748B] hover:text-[#111827] rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F8FAFF] border border-[#E5E7EB] flex justify-between">
                <span className="text-[#64748B]">Scanned Recordings</span>
                <span className="text-[#111827] font-bold">{cleanupReport.scanned ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFF] border border-[#E5E7EB] flex justify-between">
                <span className="text-[#64748B]">Purged Physical Files</span>
                <span className="text-emerald-400 font-bold">{cleanupReport.deleted ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFF] border border-[#E5E7EB] flex justify-between">
                <span className="text-[#64748B]">Orphaned Media Cleaned</span>
                <span className="text-[#111827] font-bold">{cleanupReport.orphansCleaned ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFF] border border-[#E5E7EB] flex justify-between">
                <span className="text-[#64748B]">Failed / Protected</span>
                <span className="text-[#111827] font-bold">{cleanupReport.failed ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFF] border border-[#E5E7EB] flex justify-between">
                <span className="text-[#64748B]">Execution Status</span>
                <span className="text-[#4F46E5] font-semibold uppercase">{cleanupReport.status || "success"}</span>
              </div>
            </div>

            <button
              onClick={() => setCleanupReport(null)}
              className="w-full py-2 bg-[#00FFB2] text-black font-bold text-xs rounded-xl hover:bg-[#00E5A0]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
