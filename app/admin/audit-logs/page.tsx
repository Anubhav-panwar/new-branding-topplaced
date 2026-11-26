"use client";

import React, { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import {
  FileText,
  Filter,
  Clock,
  ShieldAlert,
  User as UserIcon,
  Eye,
  Activity,
  Terminal,
  RefreshCw,
} from "lucide-react";
import {
  AdminModal,
  AdminModalCloseButton,
  AdminPageHeader,
  AdminPagination,
  AdminStatusBadge,
  AdminTableRowMotion,
  ADMIN_BTN_GHOST,
  ADMIN_INNER_TILE_CLASS,
  ADMIN_SELECT_CLASS,
  ADMIN_SURFACE_CLASS,
  ADMIN_TABLE_WRAP,
  ADMIN_TBODY,
  ADMIN_THEAD,
} from "@/components/admin/AdminRedSunUI";
import { DashboardPageTransition } from "@/components/ui/DashboardMotion";

interface AuditLogRecord {
  _id: string;
  adminId?: string;
  adminName?: string;
  adminEmail?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  clientIp?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

const ACTION_TONES: Record<
  string,
  "solar" | "emerald" | "amber" | "rose" | "sky" | "neutral"
> = {
  ACTIVATE_USER: "emerald",
  DEACTIVATE_USER: "rose",
  UPDATE_USER_ROLE: "solar",
  TRIGGER_RETENTION_CLEANUP: "amber",
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const limit = 15;

  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (actionFilter) params.append("action", actionFilter);

      const res = await adminFetch<{
        success: boolean;
        logs: AuditLogRecord[];
        total: number;
        totalPages: number;
      }>(`/api/admin/audit-logs?${params.toString()}`);

      setLogs(Array.isArray(res?.logs) ? res.logs : []);
      setTotal(typeof res?.total === "number" ? res.total : 0);
      setTotalPages(typeof res?.totalPages === "number" ? res.totalPages : 1);
    } catch (err: any) {
      setError(err.message || "Failed to fetch system audit trail");
      setLogs([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const safeLogs = Array.isArray(logs) ? logs : [];

  return (
    <DashboardPageTransition className="space-y-6">
        <AdminPageHeader
          title="System"
          highlight="Audit Logs"
          subtitle="Immutable accountability ledger capturing critical administrative changes, role updates, user lifecycle events, and retention cleanups."
          badge={
            <AdminStatusBadge tone="solar" dot>
              Immutable Ledger
            </AdminStatusBadge>
          }
          actions={
            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className={ADMIN_BTN_GHOST}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span>Refresh Trail</span>
            </button>
          }
        />

        {/* Filter Bar */}
        <div
          className={`${ADMIN_SURFACE_CLASS} p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#70645C]">
              <Filter size={15} className="text-[#E85D04]" />
              <span>Filter Event Type:</span>
            </div>
            <select
              aria-label="Filter audit logs by action type"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className={ADMIN_SELECT_CLASS}
            >
              <option value="">All Security Events</option>
              <option value="ACTIVATE_USER">ACTIVATE_USER</option>
              <option value="DEACTIVATE_USER">DEACTIVATE_USER</option>
              <option value="UPDATE_USER_ROLE">UPDATE_USER_ROLE</option>
              <option value="TRIGGER_RETENTION_CLEANUP">
                TRIGGER_RETENTION_CLEANUP
              </option>
            </select>
          </div>
          <div className="text-xs text-[#70645C]">
            Logged Events:{" "}
            <span className="font-mono font-bold text-[#2B211C]">{total}</span>
          </div>
        </div>

        {/* Audit Table */}
        <div className={ADMIN_TABLE_WRAP}>
          {error ? (
            <div className="p-8 text-center text-rose-300 flex flex-col items-center gap-2 text-sm">
              <ShieldAlert size={24} />
              <p>{error}</p>
            </div>
          ) : loading ? (
            <div className="p-8 space-y-3">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl bg-white/[0.04] animate-pulse"
                />
              ))}
            </div>
          ) : safeLogs.length === 0 ? (
            <div className="p-12 text-center text-[#70645C] space-y-2">
              <FileText size={32} className="mx-auto text-[#70645C]" />
              <p className="text-sm font-semibold text-[#2B211C]">
                No audit records match your filter.
              </p>
              <p className="text-xs">
                Try switching the event filter to All Security Events.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={ADMIN_THEAD}>
                    <th className="py-3.5 px-6">Action</th>
                    <th className="py-3.5 px-6">Administrator</th>
                    <th className="py-3.5 px-6">Target</th>
                    <th className="py-3.5 px-6">Client IP</th>
                    <th className="py-3.5 px-6">Timestamp</th>
                    <th className="py-3.5 px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className={`${ADMIN_TBODY} text-sm`}>
                  {safeLogs.map((log) => (
                    <AdminTableRowMotion key={log._id}>
                      <td className="py-4 px-6">
                        <AdminStatusBadge
                          tone={ACTION_TONES[log.action] || "neutral"}
                          dot
                          className="font-mono uppercase"
                        >
                          {log.action}
                        </AdminStatusBadge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#FFFCF8] border border-[#E8D9CC] flex items-center justify-center shrink-0">
                            <UserIcon size={13} className="text-[#E85D04]" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-[#2B211C]">
                              {log.adminName || "Super Admin"}
                            </div>
                            <div className="text-[11px] text-[#70645C]">
                              {log.adminEmail || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs">
                        <span className="text-[#2B211C] font-semibold">
                          {log.targetType || "System"}
                        </span>
                        <span className="text-[#70645C] font-mono block text-[11px]">
                          {log.targetId || "N/A"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs font-mono text-[#70645C]">
                        {log.clientIp || "127.0.0.1"}
                      </td>
                      <td className="py-4 px-6 text-xs text-[#70645C] font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-[#70645C]" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          title="Inspect Event Payload"
                          aria-label={`Inspect audit payload for ${log.action}`}
                          className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-xl border border-[#E8D9CC] bg-[#FFFCF8]/70 text-[#70645C] hover:text-[#E85D04] hover:border-[#E85D04]/40 transition-colors cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </AdminTableRowMotion>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <AdminPagination
              page={page}
              totalPages={totalPages}
              totalItems={total}
              itemLabel="events"
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          )}
        </div>

        {/* Log Details Modal */}
        {selectedLog && (
          <AdminModal onClose={() => setSelectedLog(null)} maxWidth="max-w-lg">
            <div className="flex items-center justify-between mb-5 border-b border-[#E8D9CC] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E85D04]/15 border border-[#E85D04]/35 flex items-center justify-center">
                  <Terminal size={18} className="text-[#E85D04]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2B211C] flex items-center gap-2">
                    Audit Record Payload
                  </h3>
                  <p className="text-xs font-mono text-[#E85D04] mt-0.5">
                    {selectedLog.action}
                  </p>
                </div>
              </div>
              <AdminModalCloseButton onClick={() => setSelectedLog(null)} />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className={`${ADMIN_INNER_TILE_CLASS} p-3`}>
                  <div className="text-[#70645C] mb-1">Actor</div>
                  <div className="text-[#2B211C] font-semibold break-all">
                    {selectedLog.adminEmail || selectedLog.adminName || "System"}
                  </div>
                </div>
                <div className={`${ADMIN_INNER_TILE_CLASS} p-3`}>
                  <div className="text-[#70645C] mb-1">Client IP</div>
                  <div className="text-[#2B211C] font-mono">
                    {selectedLog.clientIp || "127.0.0.1"}
                  </div>
                </div>
              </div>

              <div className={`${ADMIN_INNER_TILE_CLASS} p-3 text-xs`}>
                <div className="text-[#70645C] mb-1 flex items-center gap-1.5">
                  <Activity size={12} className="text-[#E85D04]" />
                  <span>Recorded At</span>
                </div>
                <div className="text-[#2B211C] font-mono">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-[#70645C] mb-2">
                  Event Payload Details
                </div>
                <pre className="p-4 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] text-xs font-mono text-emerald-300 overflow-x-auto max-h-60 leading-relaxed">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E8D9CC] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className={ADMIN_BTN_GHOST}
              >
                Close Inspector
              </button>
            </div>
          </AdminModal>
        )}
      </DashboardPageTransition>
  );
}
