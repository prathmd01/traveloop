"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(() => import("./trip-leaflet-map"), { ssr: false });

export type { MapStop } from "./trip-leaflet-map";

export function TripMap(props: React.ComponentProps<typeof Inner>) {
  return <Inner {...props} />;
}
