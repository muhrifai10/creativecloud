"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, CheckCircle2, AlertCircle, UploadCloud, Check } from "lucide-react";
import { formatBytes } from "@/lib/providers-meta";
import { useDashboardTheme } from "@/components/dashboard-theme-provider";

interface Job {
  id: string;
  name: string;
  size: number;
  loaded: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

function uploadOne(file: File, accountId: string, folderId: string, onProgress: (loaded: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const usp = new URLSearchParams({ accountId, folderId, filename: file.name });
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/files/upload?${usp}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(e.loaded);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          reject(new Error(res.error || `Gagal (${xhr.status})`));
        } catch {
          reject(new Error(`Gagal (${xhr.status})`));
        }
      }
    };
    xhr.onerror = () => reject(new Error("Koneksi gagal atau terputus"));
    xhr.send(file);
  });
}

export function UploadPanel({ accountId, folderId, onClose }: { accountId: string; folderId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { isDark } = useDashboardTheme();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function patch(id: string, p: Partial<Job>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...p } : j)));
  }

  const allDone = jobs.length > 0 && jobs.every((j) => j.status === "done");

  useEffect(() => {
    if (allDone) {
      const t = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [allDone, onClose]);

  async function start(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    const created: Job[] = list.map((f) => ({
      id: `${Date.now()}-${f.name}`,
      name: f.name,
      size: f.size,
      loaded: 0,
      status: "uploading",
    }));
    setJobs((prev) => [...prev, ...created]);
    let hasSuccess = false;
    for (let i = 0; i < list.length; i++) {
      const job = created[i]!;
      const file = list[i]!;
      try {
        await uploadOne(file, accountId, folderId, (loaded) => patch(job.id, { loaded }));
        patch(job.id, { status: "done", loaded: file.size });
        hasSuccess = true;
      } catch (e) {
        patch(job.id, { status: "error", error: e instanceof Error ? e.message : "Gagal upload" });
      }
    }
    if (hasSuccess) {
      qc.invalidateQueries({ queryKey: ["browse"] });
      qc.invalidateQueries({ queryKey: ["search"] });
      qc.invalidateQueries({ queryKey: ["dashboard-recent-files"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    }
  }

  return (
    <div
      className={`fixed inset-x-4 sm:inset-x-auto sm:right-6 bottom-6 z-40 w-auto sm:w-96 rounded-3xl border p-5 shadow-2xl transition-all duration-200 ${
        isDark ? "border-white/10 bg-[#0D0F14] text-white" : "border-line bg-card text-ink"
      }`}
    >
      {/* Header Modal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UploadCloud size={16} />
          </span>
          <div>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-ink"}`}>Unggah Berkas</p>
            <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-muted"}`}>Cloud Storage</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className={`rounded-xl p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-ink"}`}
        >
          <X size={16} />
        </button>
      </div>

      {/* Success Alert Banner */}
      {allDone && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 animate-fade-in-up">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span className="font-semibold truncate">Upload selesai dan tersinkron!</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
          >
            Selesai
          </button>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); start(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
          drag
            ? "border-primary/50 bg-primary/10"
            : isDark
            ? "border-white/10 hover:bg-white/5"
            : "border-line hover:bg-slate-50"
        }`}
      >
        <UploadCloud size={22} className="text-primary" />
        <p className={`mt-1.5 text-sm font-semibold ${isDark ? "text-white" : "text-ink"}`}>Seret berkas ke sini</p>
        <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-muted"}`}>atau klik untuk memilih file</p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && start(e.target.files)} />
      </div>

      {/* Upload Progress List */}
      {jobs.length > 0 && (
        <ul className="mt-3 max-h-52 space-y-2.5 overflow-y-auto pr-1">
          {jobs.map((j) => (
            <li key={j.id} className={`rounded-xl border p-2.5 ${isDark ? "border-white/10 bg-white/5" : "border-line bg-slate-50"}`}>
              <div className="flex items-center gap-2 text-xs">
                {j.status === "done" ? (
                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check size={10} strokeWidth={3} />
                  </span>
                ) : j.status === "error" ? (
                  <AlertCircle size={14} className="shrink-0 text-rose-500" />
                ) : (
                  <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-primary" />
                )}
                <span className={`min-w-0 flex-1 truncate font-medium ${isDark ? "text-white" : "text-ink"}`}>{j.name}</span>
                <span className={`shrink-0 font-mono text-[11px] tabular-nums ${isDark ? "text-slate-400" : "text-muted"}`}>
                  {formatBytes(j.loaded)} / {formatBytes(j.size)}
                </span>
              </div>
              <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    j.status === "error" ? "bg-rose-500" : j.status === "done" ? "bg-emerald-500" : "bg-primary"
                  }`}
                  style={{ width: `${j.size ? Math.min((j.loaded / j.size) * 100, 100) : 0}%` }}
                />
              </div>
              {j.error && <p className="mt-1 text-[11px] font-medium text-rose-500">{j.error}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
