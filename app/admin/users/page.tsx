"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  CheckCircle,
  Eye,
  Shield,
  UserX,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Video,
  X,
  FileSpreadsheet,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { adminFetch, getAdminToken } from "@/lib/adminApi";
import {
  ADMIN_BTN_DANGER,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_PRIMARY,
  ADMIN_ICON_BTN,
  ADMIN_INNER_TILE_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_SELECT_CLASS,
  ADMIN_SURFACE_CLASS,
  ADMIN_TABLE_WRAP,
  ADMIN_TBODY,
  ADMIN_THEAD,
  AdminModal,
  AdminModalCloseButton,
  AdminPageHeader,
  AdminPagination,
  AdminStatusBadge,
  AdminTableRowMotion,
} from "@/components/admin/AdminRedSunUI";
import { DashboardPageTransition } from "@/components/ui/DashboardMotion";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [statusModalUser, setStatusModalUser] = useState<any | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [roleModalUser, setRoleModalUser] = useState<any | null>(null);
  const [newRole, setNewRole] = useState("user");
  const [roleReason, setRoleReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Permanent Delete Modal state
  const [deleteModalUser, setDeleteModalUser] = useState<any | null>(null);
  const [deleteSummaryLoading, setDeleteSummaryLoading] = useState(false);
  const [deleteSummaryData, setDeleteSummaryData] = useState<any | null>(null);
  const [confirmPhraseInput, setConfirmPhraseInput] = useState("");
  const [deleteReasonInput, setDeleteReasonInput] = useState("");
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(
    null
  );

  // Delete User Interviews Modal state
  const [deleteInterviewsModalUser, setDeleteInterviewsModalUser] = useState<
    any | null
  >(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search.trim()) params.append("search", search.trim());
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await adminFetch(`/api/admin/users?${params.toString()}`);
      if (res.success) {
        setUsers(res.users || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleExportCSV = () => {
    const token = getAdminToken();
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const exportUrl = `${API_BASE}/api/admin/users/export/csv`;

    fetch(exportUrl, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to export users CSV");
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `topplaced_users_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert("Export failed: " + err.message));
  };

  const openUserDetail = async (user: any) => {
    setSelectedUser(user);
    setUserDetailLoading(true);
    try {
      const uid = user.id || user._id;
      const res = await adminFetch(`/api/admin/users/${uid}`);
      if (res.success) {
        setSelectedUser({
          ...res.user,
          interviews: res.interviews,
          auditLogs: res.auditLogs,
        });
      }
    } catch (err: any) {
      console.error("Error loading user detail:", err);
    } finally {
      setUserDetailLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusModalUser) return;
    try {
      setActionLoading(true);
      const uid = statusModalUser.id || statusModalUser._id;
      const targetStatus = statusModalUser.isActive === false;
      await adminFetch(`/api/admin/users/${uid}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          isActive: targetStatus,
          reason: statusReason.trim() || undefined,
        }),
      });
      setStatusModalUser(null);
      setStatusReason("");
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update account status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!roleModalUser) return;
    try {
      setActionLoading(true);
      const uid = roleModalUser.id || roleModalUser._id;
      await adminFetch(`/api/admin/users/${uid}/role`, {
        method: "PATCH",
        body: JSON.stringify({
          role: newRole,
          reason: roleReason.trim() || undefined,
        }),
      });
      setRoleModalUser(null);
      setRoleReason("");
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = async (user: any) => {
    setDeleteModalUser(user);
    setDeleteSummaryLoading(true);
    setDeleteSummaryData(null);
    setConfirmPhraseInput("");
    setDeleteReasonInput("");
    try {
      const uid = user.id || user._id;
      const res = await adminFetch(`/api/admin/users/${uid}/delete-summary`);
      setDeleteSummaryData(res);
    } catch (err: any) {
      alert("Failed to inspect deletion dependencies: " + err.message);
      setDeleteModalUser(null);
    } finally {
      setDeleteSummaryLoading(false);
    }
  };

  const executeDeleteUserPermanently = async () => {
    if (!deleteModalUser) return;
    try {
      setActionLoading(true);
      const uid = deleteModalUser.id || deleteModalUser._id;
      const res = await adminFetch(`/api/admin/users/${uid}`, {
        method: "DELETE",
        body: JSON.stringify({
          confirmationPhrase: confirmPhraseInput.trim(),
          reason: deleteReasonInput.trim() || "Administrative user purge",
        }),
      });
      if (res.success) {
        setDeleteModalUser(null);
        setSelectedUser(null);
        setDeleteSuccessMessage(
          `User ${res.deletedUser?.email} and all cascading data (${res.details?.interviews} interviews, ${res.details?.recordings} recordings) permanently deleted.`
        );
        setTimeout(() => setDeleteSuccessMessage(null), 7000);
        fetchUsers();
      }
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const executeDeleteAllUserInterviews = async () => {
    if (!deleteInterviewsModalUser) return;
    try {
      setActionLoading(true);
      const uid = deleteInterviewsModalUser.id || deleteInterviewsModalUser._id;
      const res = await adminFetch(`/api/admin/users/${uid}/interviews`, {
        method: "DELETE",
      });
      if (res.success) {
        setDeleteInterviewsModalUser(null);
        if (selectedUser) setSelectedUser(null);
        alert(
          `Successfully purged ${res.deletedInterviews} interviews and ${res.deletedRecordings} recording files for this user.`
        );
        fetchUsers();
      }
    } catch (err: any) {
      alert("Failed to delete user interviews: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardPageTransition className="space-y-6">
      <AdminPageHeader
        title="User"
        highlight="Management"
        subtitle={`Search, inspect, and manage permissions for all ${total} registered platform candidates, mentors, and administrators.`}
        actions={
          <>
            <button
              type="button"
              onClick={handleExportCSV}
              className={ADMIN_BTN_GHOST}
            >
              <FileSpreadsheet size={15} className="text-[#E85D04]" />
              <span>Export Users CSV</span>
            </button>
            <button
              type="button"
              onClick={fetchUsers}
              className={ADMIN_BTN_GHOST}
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin text-[#E85D04]" : ""}
              />
              <span>Refresh</span>
            </button>
          </>
        }
      />

      {deleteSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle size={18} className="shrink-0 text-emerald-400" />
          <span>{deleteSuccessMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div
        className={`${ADMIN_SURFACE_CLASS} p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between`}
      >
        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full md:w-96"
        >
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70645C]"
          />
          <input
            type="text"
            placeholder="Search by candidate name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${ADMIN_INPUT_CLASS} pl-10`}
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className={ADMIN_SELECT_CLASS}
          >
            <option value="">All Roles</option>
            <option value="user">Candidate / User</option>
            <option value="mentor">Mentor</option>
            <option value="admin">Administrator</option>
            <option value="superadmin">Super Admin</option>
          </select>

          <select
            aria-label="Filter by account status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={ADMIN_SELECT_CLASS}
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className={ADMIN_TABLE_WRAP}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#70645C] min-w-[780px]">
            <thead className={ADMIN_THEAD}>
              <tr>
                <th className="px-4 py-3.5 font-semibold">User</th>
                <th className="px-4 py-3.5 font-semibold">Role</th>
                <th className="px-4 py-3.5 font-semibold">Plan</th>
                <th className="px-4 py-3.5 font-semibold">Interviews</th>
                <th className="px-4 py-3.5 font-semibold">Registered</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={ADMIN_TBODY}>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#70645C]">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-[#E85D04] border-t-transparent rounded-full mb-2" />
                    <div>Loading users database...</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#70645C]">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const initials = (u.fullName || u.email || "U")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const isActive = u.isActive !== false;
                  const roleStr = (u.role || "user").toLowerCase();

                  return (
                    <AdminTableRowMotion
                      key={u.id || u._id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#FFFCF8] border border-[#E85D04]/25 text-xs font-bold text-[#E85D04] flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-[#2B211C]">
                              {u.fullName || "Unnamed User"}
                            </div>
                            <div className="text-xs text-[#70645C]">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <AdminStatusBadge
                          tone={
                            roleStr === "admin" || roleStr === "superadmin"
                              ? "solar"
                              : roleStr === "mentor"
                              ? "sky"
                              : "neutral"
                          }
                          className="uppercase tracking-wider"
                        >
                          {roleStr}
                        </AdminStatusBadge>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold text-emerald-400 capitalize">
                          {u.planType || (u.hasPaidPlan ? "Pro" : "Free")}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        <div className="text-[#2B211C] font-semibold font-mono">
                          {u.interviewStats?.completed ?? 0} completed
                        </div>
                        <div className="text-[#70645C] font-mono">
                          {u.interviewStats?.total ?? 0} total
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-[#70645C] font-mono">
                        {u.created_at || u.createdAt
                          ? new Date(
                              u.created_at || u.createdAt
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>

                      <td className="px-4 py-3.5">
                        <AdminStatusBadge
                          tone={isActive ? "emerald" : "rose"}
                          dot
                        >
                          {isActive ? "Active" : "Deactivated"}
                        </AdminStatusBadge>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openUserDetail(u)}
                            aria-label="View Full Profile & History"
                            title="View Full Profile & History"
                            className={ADMIN_ICON_BTN}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setRoleModalUser(u);
                              setNewRole(u.role || "user");
                            }}
                            aria-label="Modify User Role"
                            title="Modify User Role"
                            className={`${ADMIN_ICON_BTN} hover:!text-[#E85D04] hover:!border-[#E85D04]/45`}
                          >
                            <Shield size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setStatusModalUser(u)}
                            aria-label={
                              isActive ? "Deactivate Account" : "Activate Account"
                            }
                            title={
                              isActive ? "Deactivate Account" : "Activate Account"
                            }
                            className={`${ADMIN_ICON_BTN} ${
                              isActive
                                ? "hover:!text-amber-300 hover:!border-amber-500/40"
                                : "hover:!text-emerald-300 hover:!border-emerald-500/40"
                            }`}
                          >
                            {isActive ? (
                              <UserX size={15} />
                            ) : (
                              <UserCheck size={15} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteInterviewsModalUser(u)}
                            aria-label="Purge All User Interviews"
                            title="Purge All User Interviews"
                            className={`${ADMIN_ICON_BTN} hover:!text-[#E85D04] hover:!border-[#E85D04]/45`}
                          >
                            <RotateCcw size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(u)}
                            aria-label="Permanently Delete User & All Data"
                            title="Permanently Delete User & All Data"
                            className={`${ADMIN_ICON_BTN} hover:!text-rose-300 hover:!border-rose-500/45`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </AdminTableRowMotion>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          itemLabel="users"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      </div>

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <AdminModal onClose={() => setSelectedUser(null)} maxWidth="max-w-2xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8D9CC] pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#E85D04]/15 border border-[#E85D04]/35 text-[#E85D04] font-bold flex items-center justify-center shrink-0">
                  {(selectedUser.fullName || selectedUser.email || "U")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-[#2B211C] truncate">
                    {selectedUser.fullName || "User Detail"}
                  </h3>
                  <p className="text-xs text-[#70645C] truncate">
                    {selectedUser.email}
                  </p>
                </div>
              </div>
              <AdminModalCloseButton onClick={() => setSelectedUser(null)} />
            </div>

            {userDetailLoading ? (
              <div className="py-12 text-center text-[#70645C]">
                Loading full account telemetry...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className={`${ADMIN_INNER_TILE_CLASS} p-3`}>
                    <div className="text-[#70645C]">Role</div>
                    <div className="text-[#2B211C] font-semibold uppercase mt-0.5 font-mono">
                      {selectedUser.role || "user"}
                    </div>
                  </div>
                  <div className={`${ADMIN_INNER_TILE_CLASS} p-3`}>
                    <div className="text-[#70645C]">Status</div>
                    <div
                      className={`font-semibold mt-0.5 ${
                        selectedUser.isActive !== false
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {selectedUser.isActive !== false ? "Active" : "Deactivated"}
                    </div>
                  </div>
                  <div className={`${ADMIN_INNER_TILE_CLASS} p-3`}>
                    <div className="text-[#70645C]">Plan</div>
                    <div className="text-[#2B211C] font-semibold capitalize mt-0.5">
                      {selectedUser.planType || "Pro"}
                    </div>
                  </div>
                  <div className={`${ADMIN_INNER_TILE_CLASS} p-3`}>
                    <div className="text-[#70645C]">Credits Balance</div>
                    <div className="text-[#2B211C] font-semibold mt-0.5 font-mono">
                      {selectedUser.interviewCredits ?? 100}
                    </div>
                  </div>
                  <div className={`${ADMIN_INNER_TILE_CLASS} p-3`}>
                    <div className="text-[#70645C]">Free Used</div>
                    <div className="text-[#2B211C] font-semibold mt-0.5 font-mono">
                      {selectedUser.freeInterviewsUsed ?? 0} /{" "}
                      {selectedUser.freeInterviewsLimit ?? 10}
                    </div>
                  </div>
                  <div className={`${ADMIN_INNER_TILE_CLASS} p-3`}>
                    <div className="text-[#70645C]">Phone</div>
                    <div className="text-[#2B211C] font-semibold mt-0.5 font-mono">
                      {selectedUser.phone || "Not set"}
                    </div>
                  </div>
                </div>

                {/* Candidate Interview History */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#70645C] mb-3 flex items-center gap-2">
                    <Video size={14} className="text-[#E85D04]" />
                    <span>
                      Interview Sessions ({selectedUser.interviews?.length || 0})
                    </span>
                  </h4>
                  {selectedUser.interviews &&
                  selectedUser.interviews.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedUser.interviews.map((inv: any) => (
                        <div
                          key={inv.id || inv._id}
                          className={`${ADMIN_INNER_TILE_CLASS} p-3 flex items-center justify-between text-xs`}
                        >
                          <div>
                            <div className="font-semibold text-[#2B211C]">
                              {inv.category || "Mock Interview"}
                            </div>
                            <div className="text-[#70645C] text-[11px] font-mono">
                              {new Date(
                                inv.createdAt || inv.created_at || Date.now()
                              ).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <AdminStatusBadge
                              tone={
                                inv.status === "completed" ? "emerald" : "amber"
                              }
                              className="uppercase"
                            >
                              {inv.status || "pending"}
                            </AdminStatusBadge>
                            {inv.score !== undefined && (
                              <div className="text-[#E85D04] font-bold mt-1 font-mono">
                                Score: {inv.score}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#70645C]">
                      No interview sessions recorded yet.
                    </p>
                  )}
                </div>

                {/* Administrative Danger Zone */}
                <div className="p-4 rounded-xl bg-rose-500/[0.08] border border-rose-500/25 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    <span>Super Admin Controls</span>
                  </h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setDeleteInterviewsModalUser(selectedUser)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#E85D04]/15 border border-[#E85D04]/35 text-[#E85D04] hover:bg-[#E85D04]/25 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Delete All Interviews
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteModal(selectedUser)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-300 hover:bg-rose-500/25 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Delete User Permanently
                    </button>
                  </div>
                </div>

                {/* Audit Logs */}
                {selectedUser.auditLogs &&
                  selectedUser.auditLogs.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#70645C] mb-2">
                        Recent Administrative Changes
                      </h4>
                      <div className="space-y-1.5 text-xs text-[#70645C] max-h-32 overflow-y-auto">
                        {selectedUser.auditLogs.map((log: any) => (
                          <div
                            key={log.id || log._id}
                            className={`${ADMIN_INNER_TILE_CLASS} p-2.5`}
                          >
                            <span className="text-[#E85D04] font-semibold font-mono">
                              {log.action}
                            </span>{" "}
                            by {log.adminEmail} on{" "}
                            <span className="font-mono">
                              {new Date(log.timestamp).toLocaleDateString()}
                            </span>
                            {log.details?.reason && (
                              <span className="italic block text-[#70645C] mt-0.5">
                                &ldquo;{log.details.reason}&rdquo;
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {/* ACTIVATE / DEACTIVATE MODAL */}
      {statusModalUser && (
        <AdminModal
          onClose={() => setStatusModalUser(null)}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#2B211C]">
              {statusModalUser.isActive === false
                ? "Activate User Account"
                : "Deactivate User Account"}
            </h3>
            <p className="text-xs text-[#70645C] leading-relaxed">
              {statusModalUser.isActive === false
                ? `Restore platform and interview access for ${statusModalUser.email}?`
                : `Deactivating will block ${statusModalUser.email} from signing in or requesting interview tokens.`}
            </p>

            <div>
              <label className="text-xs font-medium text-[#70645C] block mb-1.5">
                Administrative Reason (Required for Audit Trail)
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="e.g. Terms violation, requested deactivation, compliance check..."
                className={`${ADMIN_INPUT_CLASS} !text-xs`}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className={ADMIN_BTN_GHOST}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className={
                  statusModalUser.isActive === false
                    ? "min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                    : ADMIN_BTN_DANGER
                }
              >
                {actionLoading ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ROLE MODAL */}
      {roleModalUser && (
        <AdminModal
          onClose={() => setRoleModalUser(null)}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#2B211C]">
              Update Role for {roleModalUser.email}
            </h3>

            <div>
              <label className="text-xs font-medium text-[#70645C] block mb-1.5">
                Select Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className={`${ADMIN_SELECT_CLASS} w-full`}
              >
                <option value="user">Candidate / Standard User</option>
                <option value="mentor">Mentor</option>
                <option value="admin">Administrator</option>
                <option value="superadmin">Super Administrator</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#70645C] block mb-1.5">
                Reason for Role Change
              </label>
              <input
                type="text"
                value={roleReason}
                onChange={(e) => setRoleReason(e.target.value)}
                placeholder="e.g. Promoted to panel mentor, authorized staff..."
                className={`${ADMIN_INPUT_CLASS} !text-xs`}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className={ADMIN_BTN_GHOST}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={actionLoading}
                className={ADMIN_BTN_PRIMARY}
              >
                {actionLoading ? "Updating..." : "Save Role"}
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* PERMANENT USER DELETE PRE-FLIGHT MODAL */}
      {deleteModalUser && (
        <AdminModal
          onClose={() => setDeleteModalUser(null)}
          maxWidth="max-w-xl"
          danger
        >
          <div className="space-y-5 text-left">
            <div className="flex items-start justify-between border-b border-[#E8D9CC] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#2B211C]">
                    Permanently Delete User Account
                  </h3>
                  <p className="text-xs text-rose-400">
                    Irreversible Action &bull; Complete Cascading Purge
                  </p>
                </div>
              </div>
              <AdminModalCloseButton onClick={() => setDeleteModalUser(null)} />
            </div>

            {deleteSummaryLoading ? (
              <div className="py-12 text-center text-[#70645C] space-y-2">
                <div className="inline-block animate-spin w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full" />
                <div>Scanning database &amp; media storage dependencies...</div>
              </div>
            ) : deleteSummaryData?.canDelete === false ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-rose-500/12 border border-rose-500/30 text-rose-200 text-xs leading-relaxed">
                  <strong className="block text-rose-300 font-bold mb-1">
                    Deletion Blocked by Safeguard:
                  </strong>
                  {deleteSummaryData.reason}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteModalUser(null)}
                    className={ADMIN_BTN_GHOST}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#70645C] leading-relaxed">
                  You are about to permanently delete{" "}
                  <strong className="text-[#2B211C]">
                    {deleteModalUser.email}
                  </strong>
                  . This will completely wipe the account and all associated resources across the database and storage disks.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className={`${ADMIN_INNER_TILE_CLASS} p-3`}>
                    <div className="text-[#70645C]">Interviews</div>
                    <div className="text-[#2B211C] font-bold text-sm mt-0.5 font-mono">
                      {deleteSummaryData?.counts?.interviews ?? 0} sessions
                    </div>
                  </div>
                  <div className={`${ADMIN_INNER_TILE_CLASS} p-3`}>
                    <div className="text-[#70645C]">Recordings Media</div>
                    <div className="text-[#2B211C] font-bold text-sm mt-0.5 font-mono">
                      {deleteSummaryData?.counts?.recordings ?? 0} files (
                      {deleteSummaryData?.counts?.recordingsSizeMB ?? 0} MB)
                    </div>
                  </div>
                  <div className={`${ADMIN_INNER_TILE_CLASS} p-3`}>
                    <div className="text-[#70645C]">Resumes</div>
                    <div className="text-[#2B211C] font-bold text-sm mt-0.5 font-mono">
                      {deleteSummaryData?.counts?.resumes ?? 0} files
                    </div>
                  </div>
                  <div className={`${ADMIN_INNER_TILE_CLASS} p-3`}>
                    <div className="text-[#70645C]">Q&amp;A Answers</div>
                    <div className="text-[#2B211C] font-bold text-sm mt-0.5 font-mono">
                      {deleteSummaryData?.counts?.questionAnswers ?? 0} answers
                    </div>
                  </div>
                  <div className={`${ADMIN_INNER_TILE_CLASS} p-3`}>
                    <div className="text-[#70645C]">Proctoring Logs</div>
                    <div className="text-[#2B211C] font-bold text-sm mt-0.5 font-mono">
                      {deleteSummaryData?.counts?.proctoringLogs ?? 0} events
                    </div>
                  </div>
                  <div className={`${ADMIN_INNER_TILE_CLASS} p-3`}>
                    <div className="text-[#70645C]">Achievements</div>
                    <div className="text-[#2B211C] font-bold text-sm mt-0.5 font-mono">
                      {deleteSummaryData?.counts?.achievements ?? 0} records
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#70645C] block mb-1.5">
                    Administrative Reason for Permanent Purge
                  </label>
                  <input
                    type="text"
                    value={deleteReasonInput}
                    onChange={(e) => setDeleteReasonInput(e.target.value)}
                    placeholder="e.g. Candidate GDPR right-to-be-forgotten request, duplicate test account..."
                    className={`${ADMIN_INPUT_CLASS} !text-xs focus:!border-rose-500`}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                  <div className="text-xs font-bold text-rose-200">
                    To confirm deletion, type{" "}
                    <span className="text-[#2B211C] bg-[#2B211C]/10 px-1.5 py-0.5 rounded font-mono">
                      DELETE USER
                    </span>{" "}
                    below:
                  </div>
                  <input
                    type="text"
                    value={confirmPhraseInput}
                    onChange={(e) => setConfirmPhraseInput(e.target.value)}
                    placeholder="Type DELETE USER"
                    className={`${ADMIN_INPUT_CLASS} !text-xs font-mono !border-rose-500/45 focus:!border-rose-400`}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteModalUser(null)}
                    className={ADMIN_BTN_GHOST}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeDeleteUserPermanently}
                    disabled={
                      actionLoading ||
                      (confirmPhraseInput.trim() !== "DELETE USER" &&
                        confirmPhraseInput.trim() !== deleteModalUser.email)
                    }
                    className={ADMIN_BTN_DANGER}
                  >
                    {actionLoading
                      ? "Purging All Records..."
                      : "Permanently Delete User"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {/* DELETE USER INTERVIEWS MODAL */}
      {deleteInterviewsModalUser && (
        <AdminModal
          onClose={() => setDeleteInterviewsModalUser(null)}
          maxWidth="max-w-md"
          danger
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E85D04]/15 border border-[#E85D04]/35 text-[#E85D04] flex items-center justify-center shrink-0">
                <RotateCcw size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2B211C]">
                  Delete All Interviews for User
                </h3>
                <p className="text-xs text-[#70645C]">
                  {deleteInterviewsModalUser.email}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#70645C] leading-relaxed">
              This will permanently delete all interview sessions, evaluation reports, Q&amp;A transcripts, and physical recording media belonging to this user.
              <strong className="block text-emerald-400 mt-1">
                The user&apos;s account, profile, and login credentials will remain intact.
              </strong>
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteInterviewsModalUser(null)}
                className={ADMIN_BTN_GHOST}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteAllUserInterviews}
                disabled={actionLoading}
                className={ADMIN_BTN_PRIMARY}
              >
                {actionLoading ? "Deleting Interviews..." : "Confirm Purge"}
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </DashboardPageTransition>
  );
}
