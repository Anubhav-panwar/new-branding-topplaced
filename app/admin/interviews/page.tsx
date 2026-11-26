"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Video,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Trash2,
  CheckSquare,
  Square,
  AlertCircle,
  ShieldAlert,
  Smartphone,
  Users,
  UserX,
  VideoOff,
  ShieldCheck,
} from "lucide-react";
import { adminFetch, getAdminToken, getApiBaseUrl } from "@/lib/adminApi";
import { formatRoleName, formatCandidateName } from "@/utils/formatters";

export default function InterviewsManagementPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<any | null>(null);
  const [reviewActionLoading, setReviewActionLoading] = useState(false);

  const handleUpdateProctoringReview = async (sid: string, newStatus: string, notes: string = "") => {
    try {
      setReviewActionLoading(true);
      const res = await adminFetch(`/api/admin/interviews/${sid}/proctoring/review`, {
        method: "POST",
        body: JSON.stringify({ reviewStatus: newStatus, notes }),
      });
      if (res.success) {
        if (selectedInterview) {
          setSelectedInterview((prev: any) => ({
            ...prev,
            proctoringInsights: {
              ...(prev.proctoringInsights || {}),
              reviewStatus: newStatus,
              reviewerNotes: notes,
            },
          }));
        }
        fetchInterviews();
      }
    } catch (err: any) {
      alert("Failed to update proctoring review status: " + err.message);
    } finally {
      setReviewActionLoading(false);
    }
  };
  const [deleteActionLoading, setDeleteActionLoading] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  // Detail Modal
  const [selectedInterview, setSelectedInterview] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [downloadingToken, setDownloadingToken] = useState<string | null>(null);

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter) params.append("status", statusFilter);
      if (categoryFilter) params.append("category", categoryFilter);

      const res = await adminFetch(`/api/admin/interviews?${params.toString()}`);
      if (res.success) {
        setInterviews(res.interviews || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        // Clear selection on page reload
        setSelectedIds([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load interviews");
      setInterviews([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInterviews();
  };

  const handleExportCSV = () => {
    const token = getAdminToken();
    const API_BASE = getApiBaseUrl().replace(/\/$/, "");
    const exportUrl = `${API_BASE}/api/admin/interviews/export/csv${
      statusFilter ? `?status=${statusFilter}` : ""
    }`;

    fetch(exportUrl, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to export interviews CSV");
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `topplaced_interviews_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert("Failed to export CSV: " + err.message));
  };

  const openInterviewDetail = async (inv: any) => {
    setSelectedInterview(inv);
    setDetailLoading(true);
    try {
      const sid = inv.id || inv._id || inv.sessionId;
      const res = await adminFetch(`/api/admin/interviews/${sid}`);
      if (res.success) {
        setSelectedInterview(res.interview);
      }
    } catch (err) {
      console.error("Detail error:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const resolveMediaUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const apiBase = getApiBaseUrl().replace(/\/$/, "");
    return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleDownloadRecording = async (sessionId: string) => {
    try {
      setDownloadingToken(sessionId);
      const res = await adminFetch(`/api/admin/recordings/${sessionId}/download-token`, {
        method: "POST",
      });
      if (res.success && res.downloadToken) {
        const API_BASE = getApiBaseUrl().replace(/\/$/, "");
        window.open(
          `${API_BASE}/api/admin/recordings/${sessionId}/download?token=${res.downloadToken}`,
          "_blank"
        );
      }
    } catch (err: any) {
      alert(err.message || "Failed to initiate authorized recording download");
    } finally {
      setDownloadingToken(null);
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === interviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(
        interviews.map((inv) => String(inv.id || inv._id || inv.sessionId))
      );
    }
  };

  const toggleSelectOne = (sid: string) => {
    if (selectedIds.includes(sid)) {
      setSelectedIds(selectedIds.filter((id) => id !== sid));
    } else {
      setSelectedIds([...selectedIds, sid]);
    }
  };

  // Single delete execution
  const executeSingleDelete = async () => {
    if (!singleDeleteTarget) return;
    const sid = singleDeleteTarget.id || singleDeleteTarget._id || singleDeleteTarget.sessionId;
    try {
      setDeleteActionLoading(true);
      const res = await adminFetch(`/api/admin/interviews/${sid}`, {
        method: "DELETE",
      });
      if (res.success) {
        setSingleDeleteTarget(null);
        if (selectedInterview) setSelectedInterview(null);
        setDeleteSuccessMsg(`Interview ${sid} permanently deleted.`);
        setTimeout(() => setDeleteSuccessMsg(null), 6000);
        fetchInterviews();
      }
    } catch (err: any) {
      alert("Failed to delete interview: " + err.message);
    } finally {
      setDeleteActionLoading(false);
    }
  };

  // Bulk delete execution
  const executeBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setDeleteActionLoading(true);
      const res = await adminFetch(`/api/admin/interviews/bulk-delete`, {
        method: "POST",
        body: JSON.stringify({
          sessionIds: selectedIds,
          reason: "Super Admin bulk interview purge",
        }),
      });
      if (res.success) {
        setBulkDeleteModalOpen(false);
        setSelectedIds([]);
        setDeleteSuccessMsg(
          `Successfully purged ${res.deletedCount} interviews and unlinked ${res.deletedRecordings} recording files.`
        );
        setTimeout(() => setDeleteSuccessMsg(null), 7000);
        fetchInterviews();
      }
    } catch (err: any) {
      alert("Bulk delete failed: " + err.message);
    } finally {
      setDeleteActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Interview Management</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Browse and inspect all {error ? "(error loading count)" : total} mock interview sessions, questions, scores, and recording availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#F8FAFF] border border-[#E5E7EB] hover:border-indigo-300 text-[#111827] rounded-xl text-xs font-semibold hover:text-[#4F46E5] transition-colors"
          >
            <FileSpreadsheet size={15} className="text-[#4F46E5]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchInterviews}
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
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="shrink-0" />
            <div>
              <div className="font-semibold">Unable to fetch interview records</div>
              <div className="text-xs text-red-300/80 mt-0.5">{error}</div>
            </div>
          </div>
          <button
            onClick={fetchInterviews}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-xs font-semibold transition-colors shrink-0"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Bulk Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2 text-[#111827] font-semibold">
            <CheckSquare size={16} className="text-red-400" />
            <span>{selectedIds.length} interview(s) selected across current view</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-white/5"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-[#111827] font-bold transition-colors"
            >
              <Trash2 size={14} />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search category, track, or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F8FAFF] border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2 text-sm text-[#111827] placeholder-gray-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#F8FAFF] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In-Progress</option>
            <option value="pending">Pending</option>
            <option value="abandoned">Abandoned</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#F8FAFF] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20"
          >
            <option value="">All Tracks</option>
            <option value="Technical Systems & Architecture">Technical Systems</option>
            <option value="Full Stack Development">Full Stack</option>
            <option value="Backend Engineering">Backend</option>
            <option value="Frontend Engineering">Frontend</option>
            <option value="System Design">System Design</option>
          </select>
        </div>
      </div>

      {/* Interviews Table */}
      <div className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#334155]">
            <thead className="bg-[#F8FAFF] text-xs uppercase tracking-wider text-[#334155] font-semibold border-b border-[#E5E7EB]">
              <tr>
                <th className="px-4 py-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={interviews.length > 0 && selectedIds.length === interviews.length}
                    onChange={toggleSelectAll}
                    className="rounded border-[#E5E7EB] bg-white text-[#4F46E5] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 font-semibold">Track / Category</th>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Score</th>
                <th className="px-6 py-4 font-semibold">10-Day Retention</th>
                <th className="px-6 py-4 font-semibold">Proctoring</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-[#64748B]">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-[#00FFB2] border-t-transparent rounded-full mb-2"></div>
                    <div>Loading interview logs...</div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="inline-flex p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-3">
                      <AlertCircle size={24} />
                    </div>
                    <div className="text-[#111827] font-medium mb-1">Failed to Load Interviews</div>
                    <div className="text-xs text-[#64748B] mb-4 max-w-md mx-auto">{error}</div>
                    <button
                      onClick={fetchInterviews}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F8FAFF] border border-[#E5E7EB] hover:border-indigo-300 text-xs text-[#111827] font-semibold hover:text-[#4F46E5] transition-colors"
                    >
                      <RefreshCw size={14} />
                      <span>Retry Connection</span>
                    </button>
                  </td>
                </tr>
              ) : interviews.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-[#64748B]">
                    <div className="text-[#64748B] font-medium">No interviews found matching current filters.</div>
                    {(search || statusFilter || categoryFilter) && (
                      <button
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("");
                          setCategoryFilter("");
                          setPage(1);
                        }}
                        className="mt-2 text-xs text-[#4F46E5] hover:underline"
                      >
                        Clear all filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                interviews.map((inv) => {
                  const sid = String(inv.id || inv._id || inv.sessionId);
                  const rec = inv.recording;
                  const isRecAvailable = rec && !rec.isExpired;
                  const isChecked = selectedIds.includes(sid);

                  return (
                    <tr
                      key={sid}
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

                      {/* Track / Category */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#111827]">
                          {formatRoleName(inv.roleFormatted || inv.role || inv.category || "Mock Interview")}
                        </div>
                        <div className="text-xs text-[#64748B]">
                          {formatRoleName(inv.categoryFormatted || inv.category || inv.level || "General")}
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-6 py-4 text-xs">
                        <div className="font-semibold text-[#111827]">
                          {formatCandidateName(inv.candidateName, inv.candidateEmail, inv.userId ? `Candidate (${inv.userId.slice(0, 8)})` : "Candidate")}
                        </div>
                        {inv.candidateEmail ? (
                          <div className="text-[11px] text-[#64748B] truncate max-w-[150px]">{inv.candidateEmail}</div>
                        ) : (
                          <div className="text-[11px] font-mono text-[#64748B]">{inv.userId ? `${inv.userId.slice(0, 10)}...` : "Candidate"}</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                            inv.status === "completed" || inv.status === "done"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : inv.status === "in-progress" || inv.status === "active"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {inv.status || "pending"}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="px-6 py-4">
                        {inv.score !== undefined && inv.score !== null ? (
                          <div className="flex items-center gap-1.5 font-bold text-[#111827]">
                            <Award size={14} className="text-[#4F46E5]" />
                            <span>{inv.score}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#64748B]">Pending</span>
                        )}
                      </td>

                      {/* 10-Day Retention Badge */}
                      <td className="px-6 py-4 text-xs">
                        {isRecAvailable ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-500/10 text-[#4F46E5] border border-teal-500/30 font-medium w-fit">
                              <Clock size={11} />
                              Available
                            </span>
                            {rec?.durationFormatted && (
                              <span className="text-[10px] text-[#64748B] font-mono">
                                {rec.durationFormatted}
                              </span>
                            )}
                          </div>
                        ) : rec?.status === "uploading" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium animate-pulse">
                            <RefreshCw size={11} className="animate-spin" />
                            Uploading
                          </span>
                        ) : rec?.status === "partial" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-medium">
                            <AlertCircle size={11} />
                            Incomplete
                          </span>
                        ) : rec?.isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30">
                            Expired (10d)
                          </span>
                        ) : (
                          <span className="text-[#64748B]">No media</span>
                        )}
                      </td>

                      {/* Proctoring */}
                      <td className="px-6 py-4">
                        {inv.proctoringInsights?.mobilePhoneDetections > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            <Smartphone size={12} />
                            <span>Phone ({inv.proctoringInsights.mobilePhoneDetections})</span>
                          </span>
                        ) : inv.proctoringInsights?.totalAlerts > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <AlertTriangle size={12} />
                            <span>{inv.proctoringInsights.totalAlerts} Alert{inv.proctoringInsights.totalAlerts > 1 ? "s" : ""}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck size={12} />
                            <span>Clean</span>
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-[#64748B]">
                        {inv.createdAt || inv.created_at
                          ? new Date(inv.createdAt || inv.created_at).toLocaleDateString()
                          : "N/A"}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isRecAvailable && (
                            <button
                              onClick={() => handleDownloadRecording(sid)}
                              disabled={downloadingToken === sid}
                              aria-label="Download Media Recording (10-Day Policy)"
                              title="Download Media Recording (10-Day Policy)"
                              className="min-h-[38px] min-w-[38px] p-2 text-[#334155] hover:text-[#4F46E5] hover:bg-[#1E293B] rounded-lg transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
                            >
                              <Download size={15} className={downloadingToken === sid ? "animate-pulse motion-reduce:animate-none" : ""} />
                            </button>
                          )}
                          <button
                            onClick={() => openInterviewDetail(inv)}
                            aria-label="View Session Details"
                            title="View Session Details"
                            className="min-h-[38px] min-w-[38px] p-2 text-[#334155] hover:text-[#111827] hover:bg-[#1E293B] rounded-lg transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setSingleDeleteTarget(inv)}
                            aria-label="Delete Interview Permanently"
                            title="Delete Interview Permanently"
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
            <span className="font-bold text-[#111827]">{totalPages}</span> ({total} interviews total)
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

      {/* DETAIL MODAL */}
      {selectedInterview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#111827]">
                  {selectedInterview.category || "Mock Interview"}
                </h3>
                <p className="text-xs text-[#64748B]">
                  Session ID: {selectedInterview.id || selectedInterview._id || selectedInterview.sessionId}
                </p>
              </div>
              <button
                onClick={() => setSelectedInterview(null)}
                className="p-1 text-[#64748B] hover:text-[#111827] rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-[#64748B]">Loading full interview session data...</div>
            ) : (
              <div className="space-y-6 text-sm">
                {/* Status & Scores */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#F8FAFF] border border-[#E5E7EB]">
                    <div className="text-[#64748B]">Status</div>
                    <div className="text-[#111827] font-semibold uppercase mt-0.5">
                      {selectedInterview.status || "pending"}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFF] border border-[#E5E7EB]">
                    <div className="text-[#64748B]">Score</div>
                    <div className="text-[#4F46E5] font-extrabold text-base mt-0.5">
                      {selectedInterview.score ?? "N/A"}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFF] border border-[#E5E7EB]">
                    <div className="text-[#64748B]">Duration</div>
                    <div className="text-[#111827] font-semibold mt-0.5">
                      {selectedInterview.duration ? `${Math.round(selectedInterview.duration / 60)} min` : "N/A"}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFF] border border-[#E5E7EB]">
                    <div className="text-[#64748B]">User ID</div>
                    <div className="text-[#111827] font-mono truncate mt-0.5">
                      {selectedInterview.userId || "Anonymous"}
                    </div>
                  </div>
                </div>

                {/* AI Proctoring & Integrity Telemetry (Phase 7) */}
                <div className="p-4 rounded-xl bg-[#F8FAFF] border border-[#E5E7EB] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert size={18} className="text-[#4F46E5]" />
                      <div>
                        <div className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                          AI Proctoring &amp; Real-Time Audit
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          Automated computer vision detection &amp; session surveillance telemetry
                        </div>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          selectedInterview.proctoringInsights?.reviewStatus === "flagged"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                            : selectedInterview.proctoringInsights?.reviewStatus === "reviewed"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        }`}
                      >
                        {selectedInterview.proctoringInsights?.reviewStatus || "Pending Review"}
                      </span>
                    </div>
                  </div>

                  {/* Proctoring Counters Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB]">
                      <div className="text-[11px] text-[#64748B] flex items-center gap-1">
                        <AlertTriangle size={12} className="text-amber-400" />
                        <span>Total Alerts</span>
                      </div>
                      <div className="text-sm font-bold text-[#111827] mt-1">
                        {selectedInterview.proctoringInsights?.totalAlerts ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB]">
                      <div className="text-[11px] text-[#64748B] flex items-center gap-1">
                        <Smartphone size={12} className="text-rose-400" />
                        <span>Mobile Phone</span>
                      </div>
                      <div
                        className={`text-sm font-bold mt-1 ${
                          (selectedInterview.proctoringInsights?.mobilePhoneDetections ?? 0) > 0
                            ? "text-rose-400 font-mono"
                            : "text-[#334155]"
                        }`}
                      >
                        {selectedInterview.proctoringInsights?.mobilePhoneDetections ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB]">
                      <div className="text-[11px] text-[#64748B] flex items-center gap-1">
                        <Users size={12} className="text-blue-400" />
                        <span>Multi-Person</span>
                      </div>
                      <div className="text-sm font-bold text-[#111827] mt-1">
                        {selectedInterview.proctoringInsights?.multiplePersonDetections ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB]">
                      <div className="text-[11px] text-[#64748B] flex items-center gap-1">
                        <UserX size={12} className="text-orange-400" />
                        <span>Face Away</span>
                      </div>
                      <div className="text-sm font-bold text-[#111827] mt-1">
                        {selectedInterview.proctoringInsights?.faceAbsenceEvents ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB]">
                      <div className="text-[11px] text-[#64748B] flex items-center gap-1">
                        <VideoOff size={12} className="text-rose-400" />
                        <span>Camera Drops</span>
                      </div>
                      <div className="text-sm font-bold text-[#111827] mt-1">
                        {selectedInterview.proctoringInsights?.cameraInterruptions ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* Review Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5E7EB]/70 text-xs">
                    <span className="text-[#64748B] text-[11px]">
                      Reviewer Actions:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={reviewActionLoading}
                        onClick={() =>
                          handleUpdateProctoringReview(
                            String(selectedInterview.id || selectedInterview._id || selectedInterview.sessionId),
                            "reviewed",
                            "Verified compliant session by Super Admin"
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-[11px] border border-emerald-500/30 transition-colors"
                      >
                        Approve Compliance
                      </button>
                      <button
                        disabled={reviewActionLoading}
                        onClick={() =>
                          handleUpdateProctoringReview(
                            String(selectedInterview.id || selectedInterview._id || selectedInterview.sessionId),
                            "flagged",
                            "Flagged for manual academic integrity audit"
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-[11px] border border-rose-500/30 transition-colors"
                      >
                        Flag Suspicious
                      </button>
                      <button
                        disabled={reviewActionLoading}
                        onClick={() =>
                          handleUpdateProctoringReview(
                            String(selectedInterview.id || selectedInterview._id || selectedInterview.sessionId),
                            "dismissed",
                            "Infractions dismissed as non-malicious"
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-[#334155] text-[11px] border border-gray-600 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>

                  {/* Events Timeline Log */}
                  {selectedInterview.proctoringInsights?.events &&
                    selectedInterview.proctoringInsights.events.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB]/70">
                        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                          Incident History Log ({selectedInterview.proctoringInsights.events.length})
                        </div>
                        <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                          {selectedInterview.proctoringInsights.events.map((ev: any, idx: number) => {
                            const isPhone =
                              String(ev.eventType || ev.event_type || "").toUpperCase().includes("PHONE") ||
                              String(ev.eventType || ev.event_type || "").toUpperCase().includes("DEVICE");
                            return (
                              <div
                                key={idx}
                                className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
                                  isPhone
                                    ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
                                    : "bg-white border-[#E5E7EB] text-[#334155]"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isPhone ? (
                                    <Smartphone size={14} className="text-rose-400 shrink-0" />
                                  ) : (
                                    <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                                  )}
                                  <div>
                                    <div className="font-semibold text-[#111827]">
                                      {ev.message || ev.eventType || ev.event_type}
                                    </div>
                                    <div className="text-[10px] text-[#64748B] flex flex-wrap items-center gap-2 mt-0.5">
                                      <span>{ev.timestamp ? new Date(ev.timestamp).toLocaleString() : "N/A"}</span>
                                      {ev.metadata?.position && (
                                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono text-[9px]">
                                          {ev.metadata.position}
                                        </span>
                                      )}
                                      {ev.metadata?.frontendWarningTime && (
                                        <span className="text-[9px] text-amber-300/80">
                                          Alerted: {new Date(ev.metadata.frontendWarningTime).toLocaleTimeString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono text-[11px] text-emerald-400">
                                    {ev.confidence ? `${Math.round(ev.confidence * 100)}% conf` : "Confirmed"}
                                  </div>
                                  <div className="text-[10px] uppercase font-bold text-[#64748B]">
                                    {ev.status || "confirmed"}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>

                {/* Media Recording 10-day retention & Video Player Card */}
                <div className="p-4 rounded-xl bg-[#F8FAFF] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Video size={18} className="text-[#4F46E5]" />
                      <div>
                        <div className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                          Full Session Media Recording
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          Automated 10-day retention media capture & streaming playback
                        </div>
                      </div>
                    </div>
                    {(() => {
                      const rec = selectedInterview.recording;
                      if (!rec) {
                        return (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-500/10 text-[#64748B] border border-gray-500/20">
                            No Media Uploaded
                          </span>
                        );
                      }
                      if (rec.isExpired) {
                        return (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                            Expired (&gt; 10 Days)
                          </span>
                        );
                      }
                      if (rec.status === "uploading") {
                        return (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            Uploading Chunks
                          </span>
                        );
                      }
                      if (rec.status === "partial") {
                        return (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            Incomplete / Missing Chunks
                          </span>
                        );
                      }
                      if (rec.status === "completed" || rec.fileSize || rec.sizeBytes) {
                        return (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Completed & Active
                          </span>
                        );
                      }
                      return (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-500/10 text-[#64748B] border border-gray-500/20">
                          No Media Uploaded
                        </span>
                      );
                    })()}
                  </div>

                  {selectedInterview.recording ? (
                    <div className="space-y-3 pt-2 border-t border-[#E5E7EB]/60">
                      {/* Video Player */}
                      {!selectedInterview.recording.isExpired && selectedInterview.recording.status !== "uploading" && (selectedInterview.recording.streamUrl || selectedInterview.recording.downloadUrl) ? (
                        <div className="rounded-lg overflow-hidden border border-[#E5E7EB] bg-black">
                          <div className="px-3 py-1.5 bg-white border-b border-[#E5E7EB] flex items-center justify-between text-[11px]">
                            <span className="text-[#334155] font-medium flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFB2]"></span>
                              Composited Screen + Candidate Video (Option A)
                            </span>
                            <span className="text-[#4F46E5] text-[10px] font-mono">1280x720 • 25fps</span>
                          </div>
                          <video
                            controls
                            preload="metadata"
                            className="w-full max-h-64 object-contain rounded-b-lg"
                            src={resolveMediaUrl(selectedInterview.recording.streamUrl || selectedInterview.recording.downloadUrl)}
                          >
                            Your browser does not support HTML5 video playback.
                          </video>
                        </div>
                      ) : null}

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-white border border-[#E5E7EB]">
                          <div className="text-[10px] text-[#64748B]">File Size</div>
                          <div className="font-semibold text-[#111827] mt-0.5">
                            {selectedInterview.recording.fileSizeFormatted ||
                              `${Math.round(((selectedInterview.recording.sizeBytes || selectedInterview.recording.fileSize || 0) / (1024 * 1024)) * 100) / 100} MB`}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-[#E5E7EB]">
                          <div className="text-[10px] text-[#64748B]">Duration</div>
                          <div className="font-semibold text-[#111827] mt-0.5">
                            {selectedInterview.recording.durationFormatted ||
                              (selectedInterview.recording.duration
                                ? `${Math.round(selectedInterview.recording.duration)}s`
                                : "N/A")}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-[#E5E7EB]">
                          <div className="text-[10px] text-[#64748B]">MIME / Format</div>
                          <div className="font-semibold text-[#111827] mt-0.5 font-mono text-[11px]">
                            {selectedInterview.recording.mimeType || "video/webm"}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-[#E5E7EB]">
                          <div className="text-[10px] text-[#64748B]">10-Day Expiration</div>
                          <div className="font-semibold text-amber-400 mt-0.5 text-[11px]">
                            {selectedInterview.recording.expiresAt
                              ? new Date(selectedInterview.recording.expiresAt).toLocaleDateString()
                              : "10 Days"}
                          </div>
                        </div>
                      </div>

                      {/* Download Action */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[11px] text-[#64748B] font-mono truncate max-w-xs">
                          {selectedInterview.recording.filename || "interview_session_recording.webm"}
                        </div>
                        <button
                          onClick={() =>
                            handleDownloadRecording(
                              selectedInterview.id || selectedInterview._id || selectedInterview.sessionId
                            )
                          }
                          disabled={downloadingToken === (selectedInterview.id || selectedInterview._id || selectedInterview.sessionId)}
                          className="px-3 py-1.5 rounded-lg bg-[#00FFB2] text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-[#00E5A0] transition-colors"
                        >
                          <Download size={13} className={downloadingToken === (selectedInterview.id || selectedInterview._id || selectedInterview.sessionId) ? "animate-pulse motion-reduce:animate-none" : ""} />
                          <span>Download Media (Authorized)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-white border border-[#E5E7EB] text-xs text-[#64748B] flex items-center gap-2.5">
                      <VideoOff size={16} className="text-gray-500 shrink-0" />
                      <div>
                        No physical recording media is linked with this session. This may occur if candidate permissions were restricted or if the session was completed prior to retention archiving.
                      </div>
                    </div>
                  )}
                </div>

                {/* Danger zone inside modal */}
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-red-400">Permanently Delete This Interview</div>
                    <div className="text-[11px] text-[#64748B]">Purges session scores, Q&A, and disk recording media. Candidate account is preserved.</div>
                  </div>
                  <button
                    onClick={() => {
                      setSingleDeleteTarget(selectedInterview);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-[#111827] font-semibold text-xs"
                  >
                    Delete
                  </button>
                </div>

                {/* Questions & Feedback */}
                {selectedInterview.questions && selectedInterview.questions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
                      Interview Questions ({selectedInterview.questions.length})
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedInterview.questions.map((q: any, i: number) => (
                        <div key={i} className="p-3 rounded-xl bg-[#F8FAFF] border border-[#E5E7EB] space-y-1">
                          <div className="text-xs font-semibold text-[#111827]">Q{i + 1}: {q.question || q.title}</div>
                          {q.answer && (
                            <div className="text-xs text-[#334155] italic bg-white p-2 rounded-lg border border-[#E5E7EB]/60">
                              {q.answer}
                            </div>
                          )}
                          {q.feedback && (
                            <div className="text-[11px] text-[#4F46E5]">Feedback: {q.feedback}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SINGLE DELETE CONFIRMATION MODAL */}
      {singleDeleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-red-500/30 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111827]">Delete Interview Session</h3>
                <p className="text-xs text-[#64748B] font-mono">
                  {singleDeleteTarget.id || singleDeleteTarget._id || singleDeleteTarget.sessionId}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#334155] leading-relaxed">
              Are you sure you want to delete this interview?
              All associated transcripts, evaluations, question-answers, proctoring events, and physical media files will be permanently purged.
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
                {deleteActionLoading ? "Deleting..." : "Permanently Delete"}
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
                  <h3 className="text-lg font-bold text-[#111827]">Bulk Delete {selectedIds.length} Interviews</h3>
                  <p className="text-xs text-red-400">Irreversible Action</p>
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
              You are about to permanently delete <strong className="text-[#111827]">{selectedIds.length}</strong> selected interview sessions.
              This will remove all associated database records, answers, and purge physical recording files on disk.
            </p>

            <div className="p-3 rounded-xl bg-[#F8FAFF] border border-[#E5E7EB] text-xs text-[#64748B] space-y-1">
              <div>• Candidate accounts and unrelated records are safely preserved.</div>
              <div>• Physical video/audio media will be unlinked from storage.</div>
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
                {deleteActionLoading ? "Purging Interviews..." : `Confirm Delete (${selectedIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
