"use client";

import * as React from "react";
import type { TripWithRelations } from "@/types";

type TripWorkspaceContextValue = {
  trip: TripWithRelations;
  refresh: () => Promise<void>;
};

const TripWorkspaceContext = React.createContext<TripWorkspaceContextValue | undefined>(undefined);

export function TripWorkspaceProvider({
  trip,
  refresh,
  children,
}: {
  trip: TripWithRelations;
  refresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ trip, refresh }), [trip, refresh]);
  return <TripWorkspaceContext.Provider value={value}>{children}</TripWorkspaceContext.Provider>;
}

export function useTripWorkspace() {
  const ctx = React.useContext(TripWorkspaceContext);
  if (!ctx) throw new Error("useTripWorkspace must be used inside a trip workspace");
  return ctx;
}
