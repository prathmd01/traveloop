"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import { CITY_CATALOG } from "@/lib/catalog/cities";
import type { TripWithRelations } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";

function money(n: unknown) {
  return formatMoney(Number(n || 0));
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [trips, setTrips] = React.useState<TripWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ trips: TripWithRelations[] }>("/trips");
        if (!cancelled) setTrips(res.trips);
      } catch {
        if (!cancelled) setTrips([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const recent = trips.slice(0, 4);
  const totalBudget = trips.reduce((s, t) => s + Number(t.budget || 0), 0);
  const upcoming = trips.filter((t) => new Date(t.startDate) >= new Date()).length;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Hello{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Your calm cockpit for trips, budgets, and beautifully organized itineraries.
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border bg-white/80 shadow-sm backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription>Total planned budget</CardDescription>
            <CardTitle className="font-display text-3xl">{money(totalBudget)}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4 text-primary" />
            Across {trips.length} trip{trips.length === 1 ? "" : "s"}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-white/80 shadow-sm backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription>Upcoming adventures</CardDescription>
            <CardTitle className="font-display text-3xl">{upcoming}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            Starting today or later
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-white/80 shadow-sm backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription>Smart assists</CardDescription>
            <CardTitle className="font-display text-xl">AI + maps</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Suggestions, maps, and weather layers inside each trip workspace.
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Recent trips</h2>
          <p className="text-sm text-muted-foreground">Pick up where you left off.</p>
        </div>
        <Link href="/trips/new">
          <Button className="rounded-xl shadow-sm">
            Plan new trip
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No trips yet"
          description="Create your first itinerary — stops, activities, and budgets sync automatically."
        >
          <Link href="/trips/new">
            <Button className="rounded-xl">Create a trip</Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recent.map((trip, idx) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link href={`/trips/${trip.id}/itinerary`}>
                <Card className="overflow-hidden rounded-2xl border bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative h-36 w-full">
                    <Image
                      src={
                        trip.coverImage ||
                        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80"
                      }
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width:768px) 100vw,50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2 text-white">
                      <div>
                        <div className="font-display text-lg font-semibold leading-tight">{trip.title}</div>
                        <div className="text-xs text-white/90">
                          {new Date(trip.startDate).toLocaleDateString()} —{" "}
                          {new Date(trip.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur">
                        {money(trip.budget)}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    {trip.stops.length} stops · {trip.stops.reduce((n, s) => n + s.activities.length, 0)} activities
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Recommended destinations</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {CITY_CATALOG.slice(0, 3).map((c) => (
            <Card key={c.id} className="rounded-2xl border bg-white/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">
                  {c.city}, {c.country}
                </CardTitle>
                <CardDescription>
                  Cost index {c.costIndex}/100 · Popularity {c.popularity}%
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {c.weatherSummary}, ~{c.tempC}°C
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
