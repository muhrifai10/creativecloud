"use client";

export interface SummaryAccount {
  id: string;
  provider: string;
  accountEmail: string;
  accountName: string | null;
  status: string;
  totalBytes: number;
  usedBytes: number;
  lastSyncedAt: string | null;
}

export interface SummaryDTO {
  accounts: SummaryAccount[];
  totals: { totalBytes: number; usedBytes: number; freeBytes: number };
  stats: { connectedAccounts: number; fileCount: number; folderCount: number };
  kindCounts: { image: number; video: number; audio: number; document: number };
  recentFolders: { id: string; accountId: string; providerFileId: string; name: string; provider: string }[];
}

export const API = {
  summary: "/api/dashboard/summary",
  browse: "/api/files/browse",
  search: "/api/files/search",
};

export async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "content-type": "application/json" } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Gagal memuat data (${res.status}).`);
  }
  return res.json() as Promise<T>;
}
