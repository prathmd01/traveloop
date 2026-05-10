"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { useTripWorkspace } from "@/contexts/trip-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function TripNotesPage() {
  const { trip, refresh } = useTripWorkspace();
  const { toast } = useToast();
  const notes = trip.notes ?? [];
  const [content, setContent] = React.useState("<p>Arrival day — </p>");
  const [dayDate, setDayDate] = React.useState("");
  const [stopId, setStopId] = React.useState<string | "">("");

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api(`/notes/trip/${trip.id}`, {
        method: "POST",
        body: JSON.stringify({
          content,
          dayDate: dayDate ? new Date(dayDate).toISOString() : undefined,
          stopId: stopId || undefined,
        }),
      });
      toast({ title: "Journal entry saved" });
      setContent("<p></p>");
      setDayDate("");
      setStopId("");
      await refresh();
    } catch {
      toast({ title: "Could not save entry", variant: "destructive" });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Trip journal</h2>
        <p className="text-sm text-muted-foreground">Rich notes per day or city. HTML-friendly for light formatting.</p>
      </div>

      <Card className="rounded-2xl border bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">New entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={addNote}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Day (optional)</Label>
                <Input className="rounded-xl" type="date" value={dayDate} onChange={(e) => setDayDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Stop (optional)</Label>
                <Select value={stopId} onValueChange={setStopId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Attach to a city" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {trip.stops.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Content (HTML allowed)</Label>
              <Textarea
                className="min-h-[160px] rounded-xl font-mono text-sm"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <Button type="submit" className="rounded-xl">
              Save entry
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <Card className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            No journal entries yet.
          </Card>
        ) : null}
        {notes.map((n) => (
          <Card key={n.id} className="rounded-2xl border bg-white/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {format(new Date(n.createdAt), "PPpp")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: n.content }} />
              <Separator />
              <DeleteNoteButton id={n.id} onDone={refresh} />
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

function DeleteNoteButton({ id, onDone }: { id: string; onDone: () => Promise<void> }) {
  const { toast } = useToast();
  return (
    <Button
      variant="ghost"
      className="text-destructive"
      type="button"
      onClick={async () => {
        try {
          await api(`/notes/${id}`, { method: "DELETE" });
          toast({ title: "Entry removed" });
          await onDone();
        } catch {
          toast({ title: "Could not remove", variant: "destructive" });
        }
      }}
    >
      Delete entry
    </Button>
  );
}
