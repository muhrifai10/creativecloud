export const PROVIDER_META: Record<
  string,
  { label: string; color: string; initial: string; kind: "oauth" | "credentials" }
> = {
  google_drive: { label: "Google Drive", color: "#0F9D58", initial: "G", kind: "oauth" },
  dropbox: { label: "Dropbox", color: "#0061FE", initial: "D", kind: "oauth" },
  onedrive: { label: "OneDrive", color: "#0078D4", initial: "M", kind: "oauth" },
  mega: { label: "MEGA", color: "#D9272E", initial: "E", kind: "credentials" },
  pcloud: { label: "pCloud", color: "#00A3E0", initial: "P", kind: "credentials" },
};

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log2(bytes) / 10), units.length - 1);
  const value = bytes / 2 ** (10 * i);
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}
