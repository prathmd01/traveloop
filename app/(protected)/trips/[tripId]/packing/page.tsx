"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PackingCategory } from "@prisma/client";
import { api } from "@/lib/api";
import { useTripWorkspace } from "@/contexts/trip-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const LABEL: Record<PackingCategory, string> = {
  CLOTHING: "Clothing",
  DOCUMENTS: "Documents",
  ELECTRONICS: "Electronics",
  ESSENTIALS: "Essentials",
  OTHER: "Other",
};

export default function TripPackingPage() {
  const { trip, refresh } = useTripWorkspace();
  const { toast } = useToast();
  const items = trip.packingItems ?? [];
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<PackingCategory>(PackingCategory.ESSENTIALS);

  const packed = items.filter((i) => i.packed).length;
  const progress = items.length ? Math.round((packed / items.length) * 100) : 0;

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api(`/packing/trip/${trip.id}`, {
        method: "POST",
        body: JSON.stringify({ title, category }),
      });
      setTitle("");
      toast({ title: "Item added" });
      await refresh();
    } catch {
      toast({ title: "Could not add", variant: "destructive" });
    }
  }

  async function toggle(id: string, packed: boolean) {
    try {
      await api(`/packing/${id}`, { method: "PATCH", body: JSON.stringify({ packed: !packed }) });
      await refresh();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  }

  async function remove(id: string) {
    try {
      await api(`/packing/${id}`, { method: "DELETE" });
      await refresh();
    } catch {
      toast({ title: "Remove failed", variant: "destructive" });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Packing checklist</h2>
        <p className="text-sm text-muted-foreground">Track progress by category with a simple, tactile list.</p>
      </div>

      <Card className="rounded-2xl border bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">
            {packed} of {items.length} packed
          </p>
        </CardContent>
      </Card>

      <form onSubmit={addItem} className="flex flex-col gap-3 rounded-2xl border bg-white/90 p-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-1">
          <Label>Item</Label>
          <Input className="rounded-xl" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Rain shell" />
        </div>
        <div className="w-full space-y-1 md:w-48">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as PackingCategory)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {Object.values(PackingCategory).map((c) => (
                <SelectItem key={c} value={c}>
                  {LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="rounded-xl">
          Add
        </Button>
      </form>

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((i) => (
          <Card key={i.id} className="rounded-2xl border bg-white/90 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Checkbox checked={i.packed} onCheckedChange={() => toggle(i.id, i.packed)} />
              <div className="flex-1">
                <div className={i.packed ? "text-muted-foreground line-through" : "font-medium"}>{i.title}</div>
                <div className="text-xs text-muted-foreground">{LABEL[i.category]}</div>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(i.id)}>
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
