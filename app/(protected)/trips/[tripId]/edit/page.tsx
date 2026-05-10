"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TripVisibility } from "@prisma/client";
import { api, uploadFile } from "@/lib/api";
import { useTripWorkspace } from "@/contexts/trip-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  budget: z.coerce.number().nonnegative(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  visibility: z.nativeEnum(TripVisibility),
  draft: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function EditTripPage() {
  const { trip, refresh } = useTripWorkspace();
  const router = useRouter();
  const { toast } = useToast();
  const [cover, setCover] = React.useState<string | null>(trip.coverImage);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: trip.title,
      description: trip.description || "",
      budget: Number(trip.budget),
      startDate: trip.startDate.toString().slice(0, 10),
      endDate: trip.endDate.toString().slice(0, 10),
      visibility: trip.visibility,
      draft: trip.draft,
    },
  });

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadFile(file);
      setCover(res.url);
      toast({ title: "Cover uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      await api(`/trips/${trip.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: values.title,
          description: values.description || undefined,
          budget: values.budget,
          startDate: new Date(values.startDate).toISOString(),
          endDate: new Date(values.endDate).toISOString(),
          coverImage: cover,
          visibility: values.visibility,
          draft: values.draft,
        }),
      });
      toast({ title: "Trip updated" });
      await refresh();
      router.push(`/trips/${trip.id}/itinerary`);
    } catch {
      toast({ title: "Could not update trip", variant: "destructive" });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Edit trip</h2>
        <p className="text-sm text-muted-foreground">Adjust basics, visibility, and draft status.</p>
      </div>

      <Card className="rounded-2xl border bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Changes sync across budget, itinerary, and sharing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="title">Trip name</Label>
              <Input id="title" {...form.register("title")} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} {...form.register("description")} className="rounded-xl" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Budget</Label>
                <Input type="number" step="1" {...form.register("budget", { valueAsNumber: true })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start">Start</Label>
                <Input id="start" type="date" {...form.register("startDate")} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End</Label>
                <Input id="end" type="date" {...form.register("endDate")} className="rounded-xl" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={form.watch("visibility")}
                  onValueChange={(v) => form.setValue("visibility", v as TripVisibility)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value={TripVisibility.PRIVATE}>Private</SelectItem>
                    <SelectItem value={TripVisibility.PUBLIC}>Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Draft</Label>
                <Select
                  value={form.watch("draft") ? "yes" : "no"}
                  onValueChange={(v) => form.setValue("draft", v === "yes")}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="no">Published</SelectItem>
                    <SelectItem value="yes">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover">Cover image</Label>
              <Input id="cover" type="file" accept="image/*" onChange={onCover} />
              {cover ? <p className="text-xs text-muted-foreground">{cover}</p> : null}
            </div>
            <Button type="submit" className="rounded-xl">
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
