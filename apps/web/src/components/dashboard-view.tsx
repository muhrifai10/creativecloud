"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ArrowRight,
  Folder,
  UploadCloud,
} from "lucide-react";
import { StorageCard } from "@/components/storage-card";
import { formatBytes, PROVIDER_META } from "@/lib/providers-meta";
import { useSummary } from "@/lib/use-summary";
import { FileKindIcon } from "@/components/file-kind-icon";
import { useQuery } from "@tanstack/react-query";
import { API, getJson } from "@/lib/api";
import { ActionsMenu } from "@/components/actions-menu";
import { RenameDialog, ConfirmDeleteDialog, ShareDialog } from "@/components/file-dialogs";
import { SendToDialog } from "@/components/send-to-dialog";
import { useDashboardTheme } from "@/components/dashboard-theme-provider";
import type { BrowseItem } from "@/components/explorer";

function SkeletonCard({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border p-5 ${
        isDark ? "border-white/10 bg-[#0D0F14]" : "border-line bg-card"
      }`}
    >
      <div className="flex justify-between">
        <div className={`h-10 w-10 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
        <div className={`h-12 w-12 rounded-full ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
      </div>
      <div className={`mt-4 h-3 w-16 rounded ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
      <div className={`mt-2 h-4 w-28 rounded ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
      <div className={`mt-4 h-1.5 w-full rounded ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
    </div>
  );
}

export function DashboardView({ userName: _userName = "User" }: { userName?: string }) {
  const { data, isLoading, isError, error } = useSummary();
  const router = useRouter();
  const { isDark } = useDashboardTheme();

  const [renameTarget, setRenameTarget] = useState<BrowseItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrowseItem | null>(null);
  const [sendTarget, setSendTarget] = useState<BrowseItem | null>(null);
  const [shareTarget, setShareTarget] = useState<BrowseItem | null>(null);

  const { data: recentFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ["dashboard-recent-files"],
    queryFn: async (): Promise<BrowseItem[]> => {
      try {
        const r = await getJson<{ items: (BrowseItem & { accountId: string; provider: string })[] }>(
          `${API.search}?query=&limit=8`
        );
        return r.items || [];
      } catch {
        return [];
      }
    },
  });

  const downloadFile = useCallback((item: BrowseItem) => {
    const usp = new URLSearchParams({ accountId: item.accountId, fileId: item.id });
    window.location.href = `/api/files/stream?${usp}`;
  }, []);

  const openFolder = useCallback((item: BrowseItem) => {
    const usp = new URLSearchParams();
    usp.set("account", item.accountId);
    usp.set("folder", item.id);
    router.push(`/explorer?${usp}`);
  }, [router]);

  const accounts = data?.accounts ?? [];
  const accountLabels = accounts.map((a) => ({
    id: a.id,
    provider: a.provider,
    label: a.accountEmail || a.provider,
  }));

  const totalUsed = data?.totals.usedBytes ?? 0;
  const totalCapacity = data?.totals.totalBytes ?? 0;
  const totalFree = data?.totals.freeBytes ?? 0;

  // Segment proportions for Tailgrids multi-color storage bar
  const pctUsed = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;
  const docPct = Math.max(2, Math.round(pctUsed * 0.35));
  const imgPct = Math.max(2, Math.round(pctUsed * 0.25));
  const vidPct = Math.max(2, Math.round(pctUsed * 0.25));
  const audPct = Math.max(1, Math.round(pctUsed * 0.15));
  const freePct = Math.max(0, 100 - (docPct + imgPct + vidPct + audPct));

  return (
    <div className={`space-y-7 transition-colors duration-200 ${isDark ? "text-white" : "text-[#151B27]"}`}>
      {/* 1. Tailgrids Signature "Total Storage" Multi-Color Segmented Bar Card */}
      <div
        className={`rounded-2xl border p-6 sm:p-7 shadow-xs transition-colors duration-200 ${
          isDark ? "border-white/10 bg-[#0D0F14] shadow-xl" : "border-line bg-card shadow-2xs"
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h3
              className={`text-xs font-bold uppercase tracking-wider font-mono ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              TOTAL STORAGE
            </h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-3xl sm:text-4xl font-bold tabular-nums">
                {data ? formatBytes(totalUsed) : "0 GB"}
              </span>
              <span className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-muted"}`}>used</span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>From </span>
            <span className="font-mono text-sm font-bold tabular-nums">
              {data ? formatBytes(totalCapacity) : "0 GB"}
            </span>
          </div>
        </div>

        {/* Multi-Color Segmented Progress Bar */}
        <div
          className={`mt-5 flex h-3 w-full overflow-hidden rounded-full p-0.5 ${
            isDark ? "bg-white/10" : "bg-slate-100"
          }`}
        >
          {totalUsed > 0 ? (
            <>
              <div
                title="Document"
                style={{ width: `${docPct}%` }}
                className="h-full rounded-l-full bg-[#3758F9] transition-all duration-500"
              />
              <div
                title="Image"
                style={{ width: `${imgPct}%` }}
                className="h-full bg-[#8B5CF6] transition-all duration-500"
              />
              <div
                title="Video"
                style={{ width: `${vidPct}%` }}
                className="h-full bg-[#F59E0B] transition-all duration-500"
              />
              <div
                title="Audio"
                style={{ width: `${audPct}%` }}
                className="h-full bg-[#10B981] transition-all duration-500"
              />
              <div
                title="Free Space"
                style={{ width: `${freePct}%` }}
                className={`h-full rounded-r-full ${isDark ? "bg-white/20" : "bg-slate-200"}`}
              />
            </>
          ) : (
            <div className={`h-full w-full rounded-full ${isDark ? "bg-white/15" : "bg-slate-200"}`} />
          )}
        </div>

        {/* Legend Row under Bar */}
        <div
          className={`mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3758F9]" />
            <span>Document</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8B5CF6]" />
            <span>Image</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
            <span>Video</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
            <span>Audio</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isDark ? "bg-white/30" : "bg-slate-300"}`} />
            <span className={isDark ? "text-slate-400" : "text-slate-500"}>
              Free Space ({data ? formatBytes(totalFree) : "0 GB"})
            </span>
          </div>
        </div>
      </div>

      {/* 2. Cloud Storage Providers Section (Placed directly after Total Storage) */}
      <section>
        <div className="mb-3.5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Penyimpanan Cloud Terhubung</h3>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-muted"}`}>
              Kapasitas dan status real-time tiap cloud provider
            </p>
          </div>
          <Link
            href="/accounts"
            className={`group flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition shadow-2xs ${
              isDark
                ? "border-white/10 bg-white/5 text-slate-300 hover:border-primary/40 hover:text-white"
                : "border-line bg-card text-slate-600 hover:border-primary/30 hover:text-primary"
            }`}
          >
            <span>Kelola Akun</span>
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} isDark={isDark} />
            ))}
          </div>
        ) : isError ? (
          <div
            className={`rounded-2xl border p-6 text-center text-xs ${
              isDark ? "border-rose-500/20 bg-rose-500/10 text-rose-400" : "border-rose-100 bg-rose-50/50 text-rose-600"
            }`}
          >
            {(error as Error).message}
          </div>
        ) : accounts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {accounts.map((acc, index) => (
              <StorageCard key={acc.id} account={acc} isHighlighted={index === 0} />
            ))}
          </div>
        ) : (
          <div
            className={`rounded-2xl border border-dashed p-10 text-center ${
              isDark ? "border-white/10 bg-[#0D0F14]/60" : "border-line bg-card/60"
            }`}
          >
            <div
              className={`mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${
                isDark ? "border-blue-500/20 bg-blue-500/10 text-blue-400" : "border-blue-100 bg-blue-50 text-primary"
              }`}
            >
              <UploadCloud size={22} />
            </div>
            <p className="mt-3 text-sm font-bold">Belum ada akun cloud terhubung</p>
            <p className={`mt-1 text-xs max-w-sm mx-auto ${isDark ? "text-slate-400" : "text-muted"}`}>
              Hubungkan akun Google Drive, MEGA, Dropbox, OneDrive, atau pCloud untuk mulai mengelola berkas.
            </p>
            <Link
              href="/accounts"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-600"
            >
              <Plus size={15} />
              <span>Hubungkan Cloud Pertama</span>
            </Link>
          </div>
        )}
      </section>

      {/* 3. Tailgrids "Recent Files" Horizontal Cards Grid */}
      <section>
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="text-base font-bold">Recent files</h3>
          <Link
            href="/explorer"
            className={`text-xs font-semibold hover:underline ${isDark ? "text-blue-400" : "text-primary"}`}
          >
            View All
          </Link>
        </div>

        {filesLoading ? (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`animate-pulse rounded-2xl border p-4 ${
                  isDark ? "border-white/10 bg-[#0D0F14]" : "border-line bg-card"
                }`}
              >
                <div className={`h-10 w-10 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                <div className={`mt-3 h-3 w-3/4 rounded ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                <div className={`mt-2 h-2 w-1/2 rounded ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
              </div>
            ))}
          </div>
        ) : recentFiles.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {recentFiles.slice(0, 4).map((file) => {
              return (
                <div
                  key={`${file.accountId}:${file.id}`}
                  className={`card-hover group relative flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all ${
                    isDark
                      ? "border-white/10 bg-[#0D0F14] hover:border-primary/40 shadow-xl"
                      : "border-line bg-card hover:border-primary/30 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <button
                      type="button"
                      onClick={() => (file.isFolder ? openFolder(file) : downloadFile(file))}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                        isDark
                          ? "border-white/10 bg-white/5 group-hover:bg-white/10"
                          : "border-line bg-slate-50 group-hover:bg-white"
                      }`}
                    >
                      <FileKindIcon kind={file.kind} size={22} />
                    </button>
                    <ActionsMenu
                      item={file}
                      onOpen={() => file.isFolder && openFolder(file)}
                      onDownload={() => downloadFile(file)}
                      onRename={() => setRenameTarget(file)}
                      onDelete={() => setDeleteTarget(file)}
                      onSend={() => setSendTarget(file)}
                      onShare={() => setShareTarget(file)}
                    />
                  </div>

                  <div className="mt-3.5">
                    <p
                      title={file.name}
                      onClick={() => (file.isFolder ? openFolder(file) : downloadFile(file))}
                      className={`cursor-pointer truncate text-xs font-bold transition ${
                        isDark ? "text-white hover:text-blue-400" : "text-ink hover:text-primary"
                      }`}
                    >
                      {file.name}
                    </p>
                    <p
                      className={`mt-1 font-mono text-[11px] tabular-nums ${
                        isDark ? "text-slate-400" : "text-muted"
                      }`}
                    >
                      {formatBytes(file.sizeBytes)} • {file.modifiedAt ? "Recently" : "-"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className={`rounded-2xl border border-dashed p-8 text-center text-xs ${
              isDark ? "border-white/10 bg-[#0D0F14]/60 text-slate-400" : "border-line bg-card/60 text-muted"
            }`}
          >
            Belum ada berkas terindeks. Klik Upload File di atas untuk mulai.
          </div>
        )}
      </section>

      {/* 3. Tailgrids "Folder" Grid */}
      {data && data.recentFolders.length > 0 && (
        <section>
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="text-base font-bold">Folder</h3>
            <Link
              href="/explorer"
              className={`text-xs font-semibold hover:underline ${isDark ? "text-blue-400" : "text-primary"}`}
            >
              All Folders
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {data.recentFolders.slice(0, 4).map((f) => (
              <Link
                key={f.id}
                href={`/explorer?account=${f.accountId}&folder=${encodeURIComponent(f.providerFileId)}`}
                className={`card-hover group flex items-center gap-3.5 rounded-2xl border p-4 shadow-xs transition-all ${
                  isDark
                    ? "border-white/10 bg-[#0D0F14] hover:border-primary/40 shadow-xl"
                    : "border-line bg-card hover:border-primary/30 shadow-2xs"
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-amber-500 ${
                    isDark ? "border-amber-500/20 bg-amber-500/10" : "border-amber-100 bg-amber-50"
                  }`}
                >
                  <Folder size={22} fill="#F59E0B" className="opacity-90" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-xs font-bold transition ${
                      isDark ? "text-white group-hover:text-blue-400" : "text-ink group-hover:text-primary"
                    }`}
                  >
                    {f.name}
                  </p>
                  <p className={`mt-0.5 text-[11px] font-medium ${isDark ? "text-slate-400" : "text-muted"}`}>
                    {PROVIDER_META[f.provider]?.label ?? f.provider}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. Detailed Files Table */}
      <section>
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="text-base font-bold">Semua Berkas Terkini</h3>
          <Link
            href="/explorer"
            className={`flex items-center gap-1 text-xs font-semibold hover:underline ${
              isDark ? "text-blue-400" : "text-primary"
            }`}
          >
            <span>Buka File Manager</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div
          className={`overflow-hidden rounded-2xl border shadow-xs transition-colors duration-200 ${
            isDark ? "border-white/10 bg-[#0D0F14] shadow-xl" : "border-line bg-card shadow-2xs"
          }`}
        >
          {filesLoading ? (
            <div className={`divide-y p-4 space-y-3 ${isDark ? "divide-white/5" : "divide-line"}`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 pt-3">
                  <div className={`h-8 w-8 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                  <div className={`h-4 flex-1 rounded ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                  <div className={`h-4 w-20 rounded ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                </div>
              ))}
            </div>
          ) : recentFiles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isDark ? "border-white/10 bg-white/[0.02] text-slate-400" : "border-line bg-slate-50/70 text-slate-500"
                    }`}
                  >
                    <th className="px-5 py-3.5">Name</th>
                    <th className="hidden px-4 py-3.5 sm:table-cell">File Item</th>
                    <th className="hidden px-4 py-3.5 md:table-cell">Last Modified</th>
                    <th className="hidden px-4 py-3.5 lg:table-cell">File Size</th>
                    <th className="hidden px-4 py-3.5 sm:table-cell">Provider</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-line"}`}>
                  {recentFiles.map((file) => {
                    const meta = PROVIDER_META[file.provider];
                    return (
                      <tr
                        key={`${file.accountId}:${file.id}`}
                        className={`group transition-colors ${
                          isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => (file.isFolder ? openFolder(file) : downloadFile(file))}
                            className="flex items-center gap-3 text-left focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
                          >
                            <div
                              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                                isDark
                                  ? "border-white/10 bg-white/5 group-hover:bg-white/10"
                                  : "border-line bg-slate-50 group-hover:bg-white"
                              }`}
                            >
                              <FileKindIcon kind={file.kind} size={18} />
                            </div>
                            <span
                              className={`truncate text-xs sm:text-sm font-semibold max-w-[170px] sm:max-w-[240px] ${
                                isDark ? "text-white" : "text-[#151B27]"
                              }`}
                            >
                              {file.name}
                            </span>
                          </button>
                        </td>
                        <td className={`hidden px-4 py-3.5 text-xs sm:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {file.isFolder ? "Folder" : "1 item"}
                        </td>
                        <td
                          className={`hidden px-4 py-3.5 text-xs font-mono tabular-nums md:table-cell ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {file.modifiedAt
                            ? new Date(file.modifiedAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td
                          className={`hidden px-4 py-3.5 font-mono text-xs tabular-nums lg:table-cell ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {file.isFolder ? "-" : formatBytes(file.sizeBytes)}
                        </td>
                        <td className="hidden px-4 py-3.5 sm:table-cell">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: meta?.color ?? "#3758F9" }}
                            />
                            {meta?.label ?? file.provider}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <ActionsMenu
                            item={file}
                            onOpen={() => file.isFolder && openFolder(file)}
                            onDownload={() => downloadFile(file)}
                            onRename={() => setRenameTarget(file)}
                            onDelete={() => setDeleteTarget(file)}
                            onSend={() => setSendTarget(file)}
                            onShare={() => setShareTarget(file)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Folder size={26} className={`mx-auto ${isDark ? "text-slate-600" : "text-slate-300"}`} />
              <p className="mt-2 text-sm font-semibold">Belum ada berkas terindeks</p>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-muted"}`}>
                Buka File Manager untuk menjelajah atau mengunggah berkas.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Action Dialogs */}
      {renameTarget && (
        <RenameDialog item={renameTarget} onClose={() => setRenameTarget(null)} />
      )}
      {deleteTarget && (
        <ConfirmDeleteDialog item={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
      {sendTarget && (
        <SendToDialog item={sendTarget} accounts={accountLabels} onClose={() => setSendTarget(null)} />
      )}
      {shareTarget && (
        <ShareDialog item={shareTarget} onClose={() => setShareTarget(null)} />
      )}
    </div>
  );
}
