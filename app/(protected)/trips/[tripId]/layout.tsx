"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarRange, Map, NotebookPen, Package, PieChart, Share2 } from "lucide-react";
import { api, assetUrl } from "@/lib/api";
import type { TripWithRelations } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TripWorkspaceProvider } from "@/contexts/trip-context";

const tabs = [
  { href: (id: string) => `/trips/${id}/itinerary`, label: "Itinerary", icon: Map },
  { href: (id: string) => `/trips/${id}/budget`, label: "Budget", icon: PieChart },
  { href: (id: string) => `/trips/${id}/packing`, label: "Packing", icon: Package },
  { href: (id: string) => `/trips/${id}/notes`, label: "Journal", icon: NotebookPen },
  { href: (id: string) => `/trips/${id}/share`, label: "Share", icon: Share2 },
];

export default function TripWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ tripId: string }>();
  const pathname = usePathname();
  const tripId = params.tripId;
  const [trip, setTrip] = React.useState<TripWithRelations | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refreshTrip = React.useCallback(async () => {
    try {
      const res = await api<{ trip: TripWithRelations }>(`/trips/${tripId}`);
      setTrip(res.trip);
    } catch {
      /* keep existing */
    }
  }, [tripId]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ trip: TripWithRelations }>(`/trips/${tripId}`);
        if (!cancelled) setTrip(res.trip);
      } catch {
        if (!cancelled) setTrip(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8 text-center">
        <h2 className="font-display text-xl font-semibold">Trip not found</h2>
        <p className="mt-2 text-muted-foreground">It may have been deleted or you don&apos;t have access.</p>
        <Link href="/trips" className="mt-4 inline-block text-primary hover:underline">
          Back to trips
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border bg-white/90 p-6 shadow-sm"
      >
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `url(${trip.coverImage ? assetUrl(trip.coverImage) : "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&q=80"})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/70" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight">{trip.title}</h1>
              {trip.draft ? <Badge variant="outline">Draft</Badge> : null}
              <Badge variant="secondary" className="gap-1">
                <CalendarRange className="h-3 w-3" />
                {new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{trip.description}</p>
          </div>
          <Link href={`/trips/${trip.id}/edit`}>
            <button className="rounded-xl border bg-white/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur hover:bg-white">
              Edit trip
            </button>
          </Link>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-2 overflow-x-auto rounded-2xl border bg-white/70 p-2 backdrop-blur">
        {tabs.map((t) => {
          const href = t.href(tripId);
          const active = pathname.startsWith(href);
          const Icon = t.icon;
          return (
            <Link key={t.label} href={href}>
              <span
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>

      <TripWorkspaceProvider trip={trip} refresh={refreshTrip}>
        {children}
      </TripWorkspaceProvider>
    </div>
  );
}
