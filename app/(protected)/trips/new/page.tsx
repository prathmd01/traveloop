"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { api, uploadFile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  budget: z.coerce.number().nonnegative(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export default function NewTripPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [cover, setCover] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [savingDraft, setSavingDraft] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      budget: 2000,
      startDate: "",
      endDate: "",
    },
  });

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file);
      setCover(res.url);
      toast({ title: "Cover uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function save(draft: boolean) {
    const values = form.getValues();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      toast({ title: "Check the form", description: "Some fields need attention.", variant: "destructive" });
      return;
    }
    if (draft) setSavingDraft(true);
    try {
      const res = await api<{ trip: { id: string } }>("/trips", {
        method: "POST",
        body: JSON.stringify({
          title: parsed.data.title,
          description: parsed.data.description || undefined,
          budget: parsed.data.budget,
          startDate: new Date(parsed.data.startDate).toISOString(),
          endDate: new Date(parsed.data.endDate).toISOString(),
          coverImage: cover,
          draft,
        }),
      });
      toast({ title: draft ? "Draft saved" : "Trip created" });
      router.push(`/trips/${res.trip.id}/itinerary`);
    } catch {
      toast({ title: "Could not save trip", variant: "destructive" });
    } finally {
      setSavingDraft(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold">Plan a new trip</h1>
        <p className="text-muted-foreground">Set the basics — refine stops and budget anytime.</p>
      </motion.div>

      <Card className="rounded-2xl border bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>Trip details</CardTitle>
          <CardDescription>Name your adventure and estimate your range.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Trip name</Label>
            <Input id="title" {...form.register("title")} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register("description")} className="rounded-xl" rows={4} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Budget (USD)</Label>
              <Input type="number" step="1" {...form.register("budget", { valueAsNumber: true })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Start date</Label>
              <Input id="start" type="date" {...form.register("startDate")} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End date</Label>
              <Input id="end" type="date" {...form.register("endDate")} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cover">Cover image</Label>
            <Input id="cover" type="file" accept="image/*" onChange={onCover} disabled={uploading} />
            {cover ? <p className="text-xs text-muted-foreground">Saved as {cover}</p> : null}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" className="rounded-xl" onClick={() => save(false)}>
              Create & open itinerary
            </Button>
            <Button type="button" variant="outline" className="rounded-xl" disabled={savingDraft} onClick={() => save(true)}>
              {savingDraft ? "Saving..." : "Save draft"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
