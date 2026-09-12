"use client";

import { useEffect, useState } from "react";
import { getJson } from "@/lib/api";

export interface TransferDTO {
  id: string;
  sourceFileName: string;
  sourceFileSize: number;
  status: string;
  progressPercentage: number;
  bytesTransferred: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  sourceProvider: string;
  targetProvider: string;
}

export const TRANSFERS_API = {
  list: "/api/transfers",
  active: "/api/transfers?active=1",
  create: "/api/transfers",
  cancel: "/api/transfers/cancel",
};

/** Poll daftar transfer; berhenti saat tidak ada yang aktif. */
export function useTransfers(activeOnly: boolean, intervalMs = 2000) {
  const url = activeOnly ? TRANSFERS_API.active : TRANSFERS_API.list;
  const [items, setItems] = useState<TransferDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      try {
        const r = await getJson<{ jobs: TransferDTO[] }>(url);
        if (!alive) return;
        setItems(r.jobs);
        setError(null);
        const hasActive = r.jobs.some((j) => j.status === "pending" || j.status === "processing");
        if (activeOnly && !hasActive) return;
        timer = setTimeout(tick, intervalMs);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Gagal memuat transfer.");
        timer = setTimeout(tick, intervalMs * 2);
      }
    }
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [url, activeOnly, intervalMs]);

  return { items, error };
}
