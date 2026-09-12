"use client";

import { useQuery } from "@tanstack/react-query";
import { API, getJson, type SummaryDTO } from "@/lib/api";

export function useSummary() {
  return useQuery({
    queryKey: ["summary"],
    queryFn: () => getJson<SummaryDTO>(API.summary),
  });
}
