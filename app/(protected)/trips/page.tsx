"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Filter, Plane, Search } from "lucide-react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import type { TripWithRelations } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function TripsPage() {
  const sp = useSearchParams();
  const initialQ = sp.get("q") || "";
  const [trips, setTrips] = React.useState<TripWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState(initialQ);
  const [filter, setFilter] = React.useState<"all" | "upcoming" | "past">("all");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (q.trim()) qs.set("q", q.trim());
      if (filter !== "all") qs.set("filter", filter);
      const res = await api<{ trips: TripWithRelations[] }>(`/trips?${qs.toString()}`);
      setTrips(res.trips);
    } catch {
      setTrips([]);
      toast({ title: "Could not load trips", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [q, filter, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function onDelete() {
    if (!deleteId) return;
    try {
      await api(`/trips/${deleteId}`, { method: "DELETE" });
      toast({ title: "Trip deleted" });
      setDeleteId(null);
      load();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">My trips</h1>
          <p className="text-muted-foreground">Search, filter, and open your itineraries.</p>
        </div>
        <Link href="/trips/new">
          <Button className="rounded-xl">New trip</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-xl pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All trips</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="No trips match"
          description="Try another search or create a fresh itinerary."
        >
          <Link href="/trips/new">
            <Button className="rounded-xl">Create trip</Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {trips.map((trip, idx) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card className="overflow-hidden rounded-2xl border bg-white/90 shadow-sm">
                <div className="relative h-40 w-full">
                  <Image
                    src={
                      trip.coverImage ||
                      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80"
                    }
                    alt=""
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="bg-white/25 text-white backdrop-blur">
                      {formatMoney(Number(trip.budget))}
                    </Badge>
                    {trip.draft ? (
                      <Badge variant="outline" className="border-white/40 bg-black/20 text-white">
                        Draft
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <div className="font-display text-lg font-semibold">{trip.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(trip.startDate).toLocaleDateString()} —{" "}
                      {new Date(trip.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/trips/${trip.id}/itinerary`} className="flex-1">
                      <Button className="w-full rounded-xl" variant="default">
                        Open
                      </Button>
                    </Link>
                    <Link href={`/trips/${trip.id}/edit`}>
                      <Button variant="outline" className="rounded-xl">
                        Edit
                      </Button>
                    </Link>
                    <Button variant="ghost" className="rounded-xl text-destructive" onClick={() => setDeleteId(trip.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete trip?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={onDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
