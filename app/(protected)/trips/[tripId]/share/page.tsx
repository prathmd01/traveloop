"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Copy, Facebook, Link2, Twitter } from "lucide-react";
import { TripVisibility } from "@prisma/client";
import { api } from "@/lib/api";
import { useTripWorkspace } from "@/contexts/trip-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

export default function TripSharePage() {
  const { trip, refresh } = useTripWorkspace();
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${trip.shareSlug || trip.id}`
      : `/share/${trip.shareSlug || trip.id}`;

  async function setPublic(v: boolean) {
    try {
      await api(`/trips/${trip.id}`, {
        method: "PATCH",
        body: JSON.stringify({ visibility: v ? TripVisibility.PUBLIC : TripVisibility.PRIVATE }),
      });
      toast({ title: v ? "Trip is public" : "Trip is private" });
      await refresh();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({ title: "Link copied" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Share & collaborate</h2>
        <p className="text-sm text-muted-foreground">Public read-only link, copy, and lightweight social actions.</p>
      </div>

      <Card className="rounded-2xl border bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Public visibility</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Allow public view</div>
            <p className="text-sm text-muted-foreground">Anyone with the link can see the itinerary (read-only).</p>
          </div>
          <Switch
            checked={trip.visibility === TripVisibility.PUBLIC}
            onCheckedChange={(v) => setPublic(!!v)}
            aria-label="Toggle public"
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Shareable URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row">
            <Input className="rounded-xl" readOnly value={publicUrl} />
            <Button type="button" className="rounded-xl" variant="outline" onClick={copyLink}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              Copy
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(publicUrl)}`, "_blank")}
            >
              <Twitter className="mr-2 h-4 w-4" />
              Post
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`, "_blank")}
            >
              <Facebook className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={copyLink}>
              <Link2 className="mr-2 h-4 w-4" />
              Copy again
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Clone this trip</CardTitle>
        </CardHeader>
        <CardContent>
          <CloneTripButton tripId={trip.id} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CloneTripButton({ tripId }: { tripId: string }) {
  const { toast } = useToast();
  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">Create a private draft copy for iteration or templates.</Label>
      <Button
        type="button"
        className="rounded-xl"
        onClick={async () => {
          try {
            const res = await api<{ trip: { id: string } }>(`/trips/${tripId}/clone`, { method: "POST", body: JSON.stringify({}) });
            toast({ title: "Trip copied" });
            window.location.href = `/trips/${res.trip.id}/itinerary`;
          } catch {
            toast({ title: "Clone failed", variant: "destructive" });
          }
        }}
      >
        Copy trip
      </Button>
    </div>
  );
}
