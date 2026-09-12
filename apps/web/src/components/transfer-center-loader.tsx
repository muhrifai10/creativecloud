"use client";

import dynamic from "next/dynamic";

const DynamicTransferCenter = dynamic(
  () => import("@/components/transfer-center").then((m) => m.TransferCenter),
  {
    ssr: false,
    loading: () => null,
  },
);

export function TransferCenterLoader() {
  return <DynamicTransferCenter />;
}