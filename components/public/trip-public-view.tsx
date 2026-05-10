"use client";

import * as React from "react";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import type { Activity, TripStop } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

type PublicTrip = {
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  user?: { name?: string | null; avatar?: string | null };
  stops: (TripStop & { activities: Activity[] })[];
};

export function TripPublicView({ trip }: { trip: PublicTrip }) {
  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="secondary">
            {format(new Date(trip.startDate), "MMM d, yyyy")} — {format(new Date(trip.endDate), "MMM d, yyyy")}
          </Badge>
          {trip.user?.name ? <span>Curated by {trip.user.name}</span> : null}
        </div>

        <div className="relative space-y-8 pl-4 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-gradient-to-b before:from-sky-300 before:to-violet-300">
          {trip.stops.map((stop, idx) => (
            <Card key={stop.id} className="relative ml-6 overflow-hidden rounded-2xl border bg-white/95 shadow-sm">
              <span className="absolute -left-[33px] top-6 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow">
                {idx + 1}
              </span>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-4 w-4 text-primary" />
                  {stop.city}, {stop.country}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(stop.arrivalDate), "MMM d")} — {format(new Date(stop.departureDate), "MMM d")}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {stop.notes ? <p className="text-sm text-muted-foreground">{stop.notes}</p> : null}
                <div className="grid gap-3 md:grid-cols-2">
                  {stop.activities.map((a) => (
                    <div key={a.id} className="rounded-xl border bg-muted/30 p-3 text-sm">
                      <div className="font-medium">{a.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatMoney(Number(a.cost))} · {a.duration}m · ★ {a.rating.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Card className="rounded-2xl border bg-white/95 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Share</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full rounded-xl" type="button" onClick={() => navigator.clipboard.writeText(url)}>
              Copy link
            </Button>
            <p className="text-xs text-muted-foreground">
              This public page is read-only. Clone inside Traveloop to customize your own loop.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
