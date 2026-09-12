import { ProviderLogo } from "@/components/provider-logo";

export function ProviderChip({ provider, size = 36 }: { provider: string; size?: number }) {
  return (
    <div
      className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-xs border border-line"
      style={{ width: size, height: size }}
    >
      <ProviderLogo provider={provider} size={size - 12} />
    </div>
  );
}
