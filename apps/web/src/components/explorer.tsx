"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowDownUp,
  CheckSquare,
  LayoutGrid,
  List as ListIcon,
  FolderPlus,
  Upload,
  ChevronRight,
  HardDrive,
  AlertTriangle,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { FileKindIcon } from "@/components/file-kind-icon";
import { PROVIDER_META, formatBytes } from "@/lib/providers-meta";
import { API, getJson } from "@/lib/api";
import { ActionsMenu } from "@/components/actions-menu";
import { RenameDialog, NewFolderDialog, ConfirmDeleteDialog, ShareDialog } from "@/components/file-dialogs";
import { SendToDialog } from "@/components/send-to-dialog";
import { UploadPanel } from "@/components/upload-panel";
import { useDashboardTheme } from "@/components/dashboard-theme-provider";

export interface BrowseItem {
  id: string;
  name: string;
  sizeBytes: number;
  isFolder: boolean;
  kind: import("@nexusdrive/core/file-kind").FileKind;
  modifiedAt: string | null;
  parentId: string | null;
  accountId: string;
  provider: string;
}

function useBrowse(): { items: BrowseItem[]; loading: boolean; error: string | null } {
  const params = useSearchParams();
  const accountId = params.get("account");
  const folder = params.get("folder") ?? "root";
  const q = params.get("q");
  const cat = params.get("cat");
  const isCategory = Boolean(cat) && !q && !accountId;

  const key = q || isCategory
    ? ["search", q ?? "", cat, accountId]
    : ["browse", accountId ?? "none", folder];

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: async (): Promise<BrowseItem[]> => {
      if (q || isCategory) {
        const usp = new URLSearchParams();
        if (q) usp.set("query", q);
        if (cat) usp.set("kind", cat);
        if (accountId) usp.set("accountId", accountId);
        const r = await getJson<{ items: (Omit<BrowseItem, "accountId" | "provider"> & { accountId: string; provider: string })[] }>(
          `${API.search}?${usp}`,
        );
        return r.items;
      }
      if (!accountId) return [];
      const usp = new URLSearchParams({ accountId, folderId: folder });
      const r = await getJson<{ provider: string; items: Omit<BrowseItem, "accountId" | "provider">[] }>(`${API.browse}?${usp}`);
      return r.items.map((it) => ({ ...it, accountId, provider: r.provider ?? "" }));
    },
    enabled: Boolean(q || accountId || params.get("cat")),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  return { items: data ?? [], loading: isLoading, error: error ? (error as Error).message : null };
}

export function Explorer({ accounts }: { accounts: { id: string; provider: string; label: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const { isDark } = useDashboardTheme();
  const { items, loading, error } = useBrowse();
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [view, setView] = useState<"list" | "grid">("list");
  const [renameTarget, setRenameTarget] = useState<BrowseItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrowseItem | null>(null);
  const [newFolder, setNewFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendTarget, setSendTarget] = useState<BrowseItem | null>(null);
  const [shareTarget, setShareTarget] = useState<BrowseItem | null>(null);
  const accountParam = params.get("account");
  const qParam = params.get("q");
  const catParam = params.get("cat");
  const hasResultView = Boolean(accountParam || qParam || catParam);

  const openFolder = useCallback(
    (item: BrowseItem) => {
      const usp = new URLSearchParams();
      usp.set("account", item.accountId);
      usp.set("folder", item.id);
      router.push(`/explorer?${usp}`);
    },
    [router],
  );

  const breadcrumb = useMemo(() => {
    const folder = params.get("folder") ?? "root";
    const acc = accounts.find((a) => a.id === accountParam);
    const trail: { label: string; onClick?: () => void }[] = [{ label: "All Storage", onClick: () => router.push("/explorer") }];
    if (acc) trail.push({ label: acc.label, onClick: () => router.push(`/explorer?account=${acc.id}`) });
    if (folder !== "root" && acc) trail.push({ label: "Berkas Saat Ini" });
    return trail;
  }, [accountParam, params, accounts, router]);

  const columns = useMemo<ColumnDef<BrowseItem>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <button
            type="button"
            aria-label="Pilih semua"
            onClick={table.getToggleAllRowsSelectedHandler()}
            className="text-slate-300 transition hover:text-ink rounded-lg"
          >
            <CheckSquare size={16} />
          </button>
        ),
        cell: ({ row }) => (
          <button
            type="button"
            aria-label="Pilih baris"
            onClick={row.getToggleSelectedHandler()}
            className={`rounded-lg transition ${row.getIsSelected() ? "text-primary" : "text-slate-300 hover:text-slate-500"}`}
          >
            <CheckSquare size={16} />
          </button>
        ),
        size: 40,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => row.original.isFolder && openFolder(row.original)}
            className="flex min-w-0 items-center gap-3 rounded-xl text-left focus-visible:ring-2 focus-visible:ring-primary/40 group"
          >
            <div
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                isDark
                  ? "border-white/10 bg-white/5 group-hover:bg-white/10"
                  : "border-line bg-slate-50 group-hover:bg-white"
              }`}
            >
              <FileKindIcon kind={row.original.kind} size={18} />
            </div>
            <span
              className={`truncate text-xs sm:text-sm font-semibold transition ${
                isDark ? "text-white group-hover:text-blue-400" : "text-[#151B27] group-hover:text-primary"
              }`}
            >
              {row.original.name}
            </span>
          </button>
        ),
      },
      {
        accessorKey: "isFolder",
        header: "File Item",
        cell: ({ row }) => (
          <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {row.original.isFolder ? "Folder" : "1 item"}
          </span>
        ),
      },
      {
        accessorKey: "modifiedAt",
        header: "Last Modified",
        cell: ({ getValue }) => (
          <span
            className={`whitespace-nowrap font-mono text-xs tabular-nums ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {getValue<string | null>()
              ? new Date(getValue<string>()!).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "-"}
          </span>
        ),
      },
      {
        accessorKey: "sizeBytes",
        header: "File Size",
        cell: ({ getValue }) => (
          <span
            className={`whitespace-nowrap font-mono text-xs tabular-nums ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {getValue<number>() ? formatBytes(getValue<number>()) : "-"}
          </span>
        ),
      },
      {
        id: "provider",
        header: "Provider",
        cell: ({ row }) => {
          const meta = PROVIDER_META[row.original.provider];
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta?.color ?? "#3758F9" }} />
              {meta?.label ?? row.original.provider}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ActionsMenu
            item={row.original}
            onOpen={() => row.original.isFolder && openFolder(row.original)}
            onDownload={() => downloadFile(row.original)}
            onRename={() => setRenameTarget(row.original)}
            onDelete={() => setDeleteTarget(row.original)}
            onSend={() => setSendTarget(row.original)}
            onShare={() => setShareTarget(row.original)}
          />
        ),
      },
    ],
    [openFolder, isDark],
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (r) => `${r.accountId}:${r.id}`,
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className={`space-y-6 transition-colors duration-200 ${isDark ? "text-white" : "text-[#151B27]"}`}>
      {/* Top Header */}
      <div>
        <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl ${isDark ? "text-white" : "text-[#151B27]"}`}>
          File Manager
        </h1>
        <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Jelajah, cari, dan kelola seluruh file lintas penyedia cloud Anda.
        </p>
      </div>

      {/* Toolbar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 shadow-xs transition-colors duration-200 ${
          isDark ? "border-white/10 bg-[#0D0F14] text-white shadow-xl" : "border-line bg-card text-ink shadow-2xs"
        }`}
      >
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={14} className={isDark ? "text-slate-500" : "text-slate-300"} aria-hidden />}
              {b.onClick ? (
                <button
                  type="button"
                  onClick={b.onClick}
                  className={`font-medium transition ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-ink"}`}
                >
                  {b.label}
                </button>
              ) : (
                <span className={`font-bold ${isDark ? "text-white" : "text-ink"}`}>{b.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="sr-only" htmlFor="acct">
            Pilih akun
          </label>
          <select
            id="acct"
            value={accountParam ?? ""}
            onChange={(e) => {
              const usp = new URLSearchParams();
              if (e.target.value) usp.set("account", e.target.value);
              router.push(`/explorer?${usp}`);
            }}
            className={`rounded-xl border px-3.5 py-2 text-xs font-semibold outline-none transition ${
              isDark
                ? "border-white/10 bg-white/5 text-white focus:border-primary/50"
                : "border-line bg-slate-50 text-ink focus:border-primary/40"
            }`}
          >
            <option value="" disabled className={isDark ? "bg-[#0D0F14] text-white" : "bg-white text-ink"}>
              Pilih Cloud Provider
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id} className={isDark ? "bg-[#0D0F14] text-white" : "bg-white text-ink"}>
                {a.label}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div
            className={`flex overflow-hidden rounded-xl border p-0.5 ${
              isDark ? "border-white/10 bg-white/5" : "border-line bg-slate-50"
            }`}
          >
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={`rounded-lg p-2 transition-all ${
                view === "list"
                  ? isDark
                    ? "bg-white/10 text-primary font-bold shadow-xs"
                    : "bg-white text-primary font-bold shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-400 hover:text-ink"
              }`}
              aria-label="Tampilan daftar"
            >
              <ListIcon size={16} />
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
              className={`rounded-lg p-2 transition-all ${
                view === "grid"
                  ? isDark
                    ? "bg-white/10 text-primary font-bold shadow-xs"
                    : "bg-white text-primary font-bold shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-400 hover:text-ink"
              }`}
              aria-label="Tampilan kisi"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {accountParam && (
            <>
              <button
                type="button"
                onClick={() => setNewFolder(true)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition shadow-xs ${
                  isDark
                    ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    : "border-line bg-card text-slate-700 hover:bg-slate-50"
                }`}
              >
                <FolderPlus size={15} />
                <span>Folder Baru</span>
              </button>
              <button
                type="button"
                onClick={() => setUploading(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-600 active:scale-95"
              >
                <Upload size={15} />
                <span>Unggah</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Query Banner */}
      {qParam && (
        <div className={`flex items-center gap-2 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          <Search size={15} className="text-primary" />
          <span>
            Hasil pencarian untuk &quot;<strong className={isDark ? "text-white" : "text-ink"}>{qParam}</strong>&quot;
          </span>
        </div>
      )}
      {catParam && !qParam && (
        <div className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          Kategori aktif: <strong className={`capitalize ${isDark ? "text-white" : "text-ink"}`}>{catParam}</strong>
        </div>
      )}

      {error && (
        <p
          className={`flex items-center gap-2 rounded-2xl border p-4 text-sm ${
            isDark
              ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
              : "border-rose-100 bg-rose-50/50 text-rose-600"
          }`}
        >
          <AlertTriangle size={16} /> {error}
        </p>
      )}

      {selectedCount > 0 && (
        <p className={`text-xs font-semibold ${isDark ? "text-blue-400" : "text-primary"}`}>
          {selectedCount} item dipilih
        </p>
      )}

      {/* Empty States */}
      {!hasResultView && accounts.length > 0 && (
        <div
          className={`rounded-2xl border border-dashed p-12 text-center transition-colors ${
            isDark ? "border-white/10 bg-[#0D0F14]/60" : "border-line bg-card/60"
          }`}
        >
          <HardDrive size={28} className={`mx-auto ${isDark ? "text-slate-600" : "text-slate-300"}`} />
          <p className={`mt-3 text-base font-bold ${isDark ? "text-white" : "text-ink"}`}>
            Pilih akun cloud untuk mulai menjelajah
          </p>
          <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-muted"}`}>
            Gunakan pemilih cloud di atas atau cari nama berkas melalui pencarian global.
          </p>
        </div>
      )}

      {accounts.length === 0 && (
        <div
          className={`rounded-2xl border border-dashed p-12 text-center transition-colors ${
            isDark ? "border-white/10 bg-[#0D0F14]/60" : "border-line bg-card/60"
          }`}
        >
          <p className={`text-base font-bold ${isDark ? "text-white" : "text-ink"}`}>
            Belum ada akun cloud terhubung
          </p>
          <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-muted"}`}>
            Buka menu Akun Cloud untuk menyambungkan Google Drive, MEGA, atau penyedia lainnya.
          </p>
        </div>
      )}

      {/* File Table / Grid */}
      {hasResultView &&
        (loading ? (
          <TableSkeleton view={view} />
        ) : view === "grid" ? (
          <GridView items={items} onOpen={openFolder} />
        ) : (
          <div
            className={`overflow-hidden rounded-2xl border shadow-xs transition-colors duration-200 ${
              isDark ? "border-white/10 bg-[#0D0F14] shadow-xl" : "border-line bg-card shadow-2xs"
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isDark ? "border-white/10 bg-white/[0.02] text-slate-400" : "border-line bg-slate-50/70 text-slate-500"
                    }`}
                  >
                    {table.getHeaderGroups().map((hg) =>
                      hg.headers.map((h) => (
                        <th
                          key={h.id}
                          className="px-5 py-3.5"
                        >
                          {h.isPlaceholder ? null : h.column.getCanSort() ? (
                            <button
                              type="button"
                              className={`inline-flex items-center gap-1.5 ${isDark ? "hover:text-white" : "hover:text-ink"}`}
                              onClick={h.column.getToggleSortingHandler()}
                            >
                              {flexRender(h.column.columnDef.header, h.getContext())}
                              <ArrowDownUp
                                size={12}
                                className={h.column.getIsSorted() ? "text-primary" : "opacity-40"}
                              />
                            </button>
                          ) : (
                            flexRender(h.column.columnDef.header, h.getContext())
                          )}
                        </th>
                      )),
                    )}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-line"}`}>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className={`px-5 py-16 text-center text-sm ${isDark ? "text-slate-400" : "text-muted"}`}>
                        Folder ini kosong.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className={`group transition-colors ${
                          isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50/80"
                        } ${row.getIsSelected() ? (isDark ? "bg-primary/15" : "bg-primary/5") : ""}`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-5 py-3.5">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      {/* Action Dialogs */}
      {uploading && accountParam && (
        <UploadPanel
          accountId={accountParam}
          folderId={params.get("folder") ?? "root"}
          onClose={() => setUploading(false)}
        />
      )}
      {renameTarget && (
        <RenameDialog item={renameTarget} onClose={() => setRenameTarget(null)} />
      )}
      {deleteTarget && (
        <ConfirmDeleteDialog item={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
      {newFolder && accountParam && (
        <NewFolderDialog
          accountId={accountParam}
          folderId={params.get("folder") ?? "root"}
          onClose={() => setNewFolder(false)}
        />
      )}
      {sendTarget && (
        <SendToDialog item={sendTarget} accounts={accounts} onClose={() => setSendTarget(null)} />
      )}
      {shareTarget && (
        <ShareDialog item={shareTarget} onClose={() => setShareTarget(null)} />
      )}
    </div>
  );
}

function downloadFile(item: BrowseItem) {
  const usp = new URLSearchParams({ accountId: item.accountId, fileId: item.id });
  window.location.href = `/api/files/stream?${usp}`;
}

function TableSkeleton({ view }: { view: "list" | "grid" }) {
  if (view === "grid") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-[#0D0F14] p-4">
            <div className="h-10 w-10 rounded-xl bg-white/5" />
            <div className="mt-3 h-3 w-3/4 rounded bg-white/5" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0D0F14]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 border-b border-white/5 px-5 py-3.5">
          <div className="h-4 w-4 rounded bg-white/5" />
          <div className="h-9 w-9 rounded-xl bg-white/5" />
          <div className="h-3 flex-1 rounded bg-white/5" />
          <div className="h-3 w-16 rounded bg-white/5" />
          <div className="h-3 w-20 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function GridView({ items, onOpen }: { items: BrowseItem[]; onOpen: (i: BrowseItem) => void }) {
  if (items.length === 0) return <p className="mt-8 text-center text-sm text-slate-400">Folder kosong.</p>;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it) => (
        <button
          key={`${it.accountId}:${it.id}`}
          type="button"
          onClick={() => it.isFolder && onOpen(it)}
          className="card-hover group rounded-2xl border border-white/10 bg-[#0D0F14] p-4 text-left shadow-xl transition-all hover:border-primary/40"
        >
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 group-hover:bg-white/10">
            <FileKindIcon kind={it.kind} size={20} />
          </div>
          <p className="mt-3 truncate text-sm font-semibold text-white group-hover:text-blue-400 transition">{it.name}</p>
          <p className="mt-0.5 font-mono text-xs text-slate-400 tabular-nums">
            {it.isFolder ? "Folder" : formatBytes(it.sizeBytes)}
          </p>
        </button>
      ))}
    </div>
  );
}
