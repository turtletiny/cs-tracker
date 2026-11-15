import { useMemo } from "react";
import { useStore } from "../store";
import type { PillarState } from "../types";

/** Every pillar, in display order. */
export function usePillarList(): PillarState[] {
  const pillars = useStore((s) => s.pillars);
  const order = useStore((s) => s.pillarOrder);
  return useMemo(() => order.map((id) => pillars[id]).filter((p): p is PillarState => !!p), [pillars, order]);
}

/** Short name of a pillar, or null if it no longer exists. */
export function usePillarShort(id: string | null | undefined): string | null {
  return useStore((s) => (id ? (s.pillars[id]?.short ?? null) : null));
}
