"use client";

import * as React from "react";
import Image from "next/image";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { ActivityCategory, ExpenseCategory, type Activity, type TripStop } from "@prisma/client";
import {
  GripVertical,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
  CloudSun,
} from "lucide-react";
import { api } from "@/lib/api";
import { coordsForCity } from "@/lib/geo";
import { debounce } from "@/lib/debounce";
import { formatMoney } from "@/lib/utils";
import { useTripWorkspace } from "@/contexts/trip-context";
import type { CatalogActivityCategory } from "@/lib/catalog/activities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { TripMap, type MapStop } from "@/components/maps/trip-map";
import { ScrollArea } from "@/components/ui/scroll-area";

const ACTIVITY_LABELS: Record<ActivityCategory, string> = {
  ADVENTURE: "Adventure",
  FOOD: "Food",
  SIGHTSEEING: "Sightseeing",
  NATURE: "Nature",
  NIGHTLIFE: "Nightlife",
  OTHER: "Other",
};

function SortableStop({
  stop,
  children,
}: {
  stop: TripStop & { activities: Activity[] };
  children: (dragHandleProps: React.HTMLAttributes<HTMLButtonElement>) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stop.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative">
      {children(
        {
          ...attributes,
          ...listeners,
          className:
            "absolute left-2 top-6 z-10 rounded-lg border bg-white/90 p-1 text-muted-foreground shadow-sm hover:text-foreground",
        } as React.HTMLAttributes<HTMLButtonElement>,
      )}
    </div>
  );
}

export function ItineraryBuilder() {
  const { trip, refresh } = useTripWorkspace();
  const { toast } = useToast();
  const [orderedIds, setOrderedIds] = React.useState<string[]>(() =>
    [...trip.stops].sort((a, b) => a.orderIndex - b.orderIndex).map((s) => s.id),
  );

  const [addStopOpen, setAddStopOpen] = React.useState(false);
  const [citySearch, setCitySearch] = React.useState("");
  const [catalogCities, setCatalogCities] = React.useState<
    { id: string; city: string; country: string; costIndex: number; popularity: number; weatherSummary: string; tempC: number }[]
  >([]);

  const [newStop, setNewStop] = React.useState({
    city: "",
    country: "",
    arrival: "",
    departure: "",
    notes: "",
  });

  React.useEffect(() => {
    setOrderedIds([...trip.stops].sort((a, b) => a.orderIndex - b.orderIndex).map((s) => s.id));
  }, [trip.stops]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ cities: typeof catalogCities }>(
          `/catalog/cities?q=${encodeURIComponent(citySearch)}`,
          { auth: false },
        );
        if (!cancelled) setCatalogCities(res.cities);
      } catch {
        if (!cancelled) setCatalogCities([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [citySearch]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const stopsById = React.useMemo(() => {
    const m = new Map<string, TripStop & { activities: Activity[] }>();
    for (const s of trip.stops) m.set(s.id, s);
    return m;
  }, [trip.stops]);

  const orderedStops = orderedIds.map((id) => stopsById.get(id)).filter(Boolean) as (TripStop & {
    activities: Activity[];
  })[];

  const persistReorder = React.useRef(
    debounce(async (ctx: { ids: string[]; tripId: string; toast: typeof toast; refresh: typeof refresh }) => {
      try {
        await api(`/trips/${ctx.tripId}/stops/reorder`, {
          method: "PATCH",
          body: JSON.stringify({ orderedStopIds: ctx.ids }),
        });
        ctx.toast({ title: "Itinerary saved", description: "Stop order updated." });
        await ctx.refresh();
      } catch {
        ctx.toast({ title: "Could not reorder", variant: "destructive" });
      }
    }, 450),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedIds.indexOf(String(active.id));
    const newIndex = orderedIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(next);
    persistReorder.current({ ids: next, tripId: trip.id, toast, refresh });
  }

  async function addStopFromCatalog(c: { city: string; country: string }) {
    try {
      const g = coordsForCity(c.city, c.country);
      await api(`/stops/trip/${trip.id}`, {
        method: "POST",
        body: JSON.stringify({
          city: c.city,
          country: c.country,
          arrivalDate: new Date(newStop.arrival || trip.startDate).toISOString(),
          departureDate: new Date(newStop.departure || trip.endDate).toISOString(),
          notes: newStop.notes || undefined,
          lat: g.lat,
          lng: g.lng,
        }),
      });
      toast({ title: "Stop added" });
      setAddStopOpen(false);
      await refresh();
    } catch {
      toast({ title: "Could not add stop", variant: "destructive" });
    }
  }

  async function deleteStop(id: string) {
    try {
      await api(`/stops/${id}`, { method: "DELETE" });
      toast({ title: "Stop removed" });
      await refresh();
    } catch {
      toast({ title: "Could not delete stop", variant: "destructive" });
    }
  }

  async function aiSuggestions() {
    try {
      const res = await api<{ suggestions: { title: string; rationale: string }[] }>(
        `/ai/trips/${trip.id}/suggestions`,
        { method: "POST", body: JSON.stringify({}) },
      );
      toast({
        title: "Suggestions ready",
        description: res.suggestions?.[0]?.rationale || "Open activities to attach ideas to stops.",
      });
    } catch {
      toast({ title: "Suggestions unavailable", variant: "destructive" });
    }
  }

  async function optimize() {
    try {
      await api(`/optimize/trips/${trip.id}/optimize`, { method: "POST", body: JSON.stringify({}) });
      toast({ title: "Optimized", description: "Stops sorted by arrival timeline." });
      await refresh();
    } catch {
      toast({ title: "Optimization failed", variant: "destructive" });
    }
  }

  const mapStops: MapStop[] = orderedStops.map((s) => ({
    id: s.id,
    label: `${s.city}, ${s.country}`,
    lat: s.lat ?? coordsForCity(s.city, s.country).lat,
    lng: s.lng ?? coordsForCity(s.city, s.country).lng,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => setAddStopOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add stop
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={optimize}>
            <Wand2 className="mr-2 h-4 w-4" />
            Auto-order by date
          </Button>
          <Button className="rounded-xl" onClick={aiSuggestions}>
            <Sparkles className="mr-2 h-4 w-4" />
            AI suggestions
          </Button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
            <div className="relative space-y-6 pl-2 before:absolute before:left-[22px] before:top-3 before:h-[calc(100%-24px)] before:w-px before:bg-gradient-to-b before:from-sky-300 before:to-violet-300">
              {orderedStops.map((stop, idx) => (
                <SortableStop key={stop.id} stop={stop}>
                  {(dragProps) => (
                    <Card className="relative ml-10 overflow-hidden rounded-2xl border bg-white/95 shadow-sm">
                      <button type="button" {...dragProps}>
                        <GripVertical className="h-4 w-4" />
                      </button>
                      <CardHeader className="pb-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Stop {idx + 1}</Badge>
                              <CardTitle className="font-display text-xl">
                                {stop.city}, {stop.country}
                              </CardTitle>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(stop.arrivalDate).toLocaleDateString()} —{" "}
                              {new Date(stop.departureDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteStop(stop.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <StopNotesEditor stop={stop} onSaved={refresh} />
                        <Separator />
                        <ActivitiesSection stop={stop} onChanged={refresh} />
                      </CardContent>
                    </Card>
                  )}
                </SortableStop>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {orderedStops.length === 0 ? (
          <Card className="rounded-2xl border-dashed bg-muted/20 p-10 text-center">
            <p className="text-muted-foreground">Add your first city stop — drag handles reorder the loop.</p>
            <Button className="mt-4 rounded-xl" onClick={() => setAddStopOpen(true)}>
              Add stop
            </Button>
          </Card>
        ) : null}
      </div>

      <div className="space-y-4">
        <Card className="overflow-hidden rounded-2xl border bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Live map</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TripMap stops={mapStops} />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CloudSun className="h-4 w-4" />
              Weather snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {orderedStops.slice(0, 3).map((s) => (
              <WeatherLine key={s.id} city={s.city} country={s.country} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={addStopOpen} onOpenChange={setAddStopOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add a stop</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="search">
            <TabsList className="grid w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="search">Search cities</TabsTrigger>
              <TabsTrigger value="manual">Manual entry</TabsTrigger>
            </TabsList>
            <TabsContent value="search" className="space-y-3 pt-3">
              <Input
                className="rounded-xl"
                placeholder="Search destination..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
              />
              <ScrollArea className="h-56 rounded-xl border">
                <div className="space-y-1 p-2">
                  {catalogCities.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setNewStop((s) => ({ ...s, city: c.city, country: c.country }));
                        void addStopFromCatalog(c);
                      }}
                    >
                      <span>
                        {c.city}, {c.country}
                      </span>
                      <span className="text-xs text-muted-foreground">{c.weatherSummary}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="manual" className="space-y-3 pt-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input className="rounded-xl" value={newStop.city} onChange={(e) => setNewStop((s) => ({ ...s, city: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Country</Label>
                  <Input
                    className="rounded-xl"
                    value={newStop.country}
                    onChange={(e) => setNewStop((s) => ({ ...s, country: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Arrival</Label>
                  <Input
                    type="datetime-local"
                    className="rounded-xl"
                    value={newStop.arrival}
                    onChange={(e) => setNewStop((s) => ({ ...s, arrival: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Departure</Label>
                  <Input
                    type="datetime-local"
                    className="rounded-xl"
                    value={newStop.departure}
                    onChange={(e) => setNewStop((s) => ({ ...s, departure: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea className="rounded-xl" rows={3} value={newStop.notes} onChange={(e) => setNewStop((s) => ({ ...s, notes: e.target.value }))} />
              </div>
              <Button
                className="rounded-xl"
                onClick={async () => {
                  const g = coordsForCity(newStop.city, newStop.country);
                  try {
                    await api(`/stops/trip/${trip.id}`, {
                      method: "POST",
                      body: JSON.stringify({
                        city: newStop.city,
                        country: newStop.country,
                        arrivalDate: new Date(newStop.arrival || trip.startDate).toISOString(),
                        departureDate: new Date(newStop.departure || trip.endDate).toISOString(),
                        notes: newStop.notes || undefined,
                        lat: g.lat,
                        lng: g.lng,
                      }),
                    });
                    toast({ title: "Stop added" });
                    setAddStopOpen(false);
                    await refresh();
                  } catch {
                    toast({ title: "Could not add stop", variant: "destructive" });
                  }
                }}
              >
                Save stop
              </Button>
            </TabsContent>
          </Tabs>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WeatherLine({ city, country }: { city: string; country: string }) {
  const [line, setLine] = React.useState<string>("Loading…");
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const match = await api<{ cities: { id: string; city: string; weatherSummary: string; tempC: number }[] }>(
          `/catalog/cities?q=${encodeURIComponent(city)}`,
          { auth: false },
        );
        const hit = match.cities.find((c) => c.city.toLowerCase() === city.toLowerCase());
        if (!hit) {
          setLine(`${city}: demo climate data unavailable`);
          return;
        }
        const w = await api<{ summary: string; tempC: number }>(`/catalog/cities/${hit.id}/weather`, { auth: false });
        if (!cancelled) setLine(`${city}: ${w.summary}, ~${w.tempC}°C`);
      } catch {
        if (!cancelled) setLine(`${city}: weather preview unavailable`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [city, country]);
  return <div>{line}</div>;
}

function StopNotesEditor({ stop, onSaved }: { stop: TripStop; onSaved: () => Promise<void> }) {
  const { toast } = useToast();
  const [value, setValue] = React.useState(stop.notes || "");

  React.useEffect(() => setValue(stop.notes || ""), [stop.notes]);

  const saveRef = React.useRef(
    debounce(async (payload: { notes: string; stopId: string; toast: typeof toast; onSaved: typeof onSaved }) => {
      try {
        await api(`/stops/${payload.stopId}`, {
          method: "PATCH",
          body: JSON.stringify({ notes: payload.notes }),
        });
        payload.toast({ title: "Notes saved" });
        await payload.onSaved();
      } catch {
        payload.toast({ title: "Could not save notes", variant: "destructive" });
      }
    }, 700),
  );

  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Stop notes (auto-save)</Label>
      <Textarea
        className="rounded-xl"
        rows={3}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          saveRef.current({ notes: v, stopId: stop.id, toast, onSaved });
        }}
      />
    </div>
  );
}

function ActivitiesSection({
  stop,
  onChanged,
}: {
  stop: TripStop & { activities: Activity[] };
  onChanged: () => Promise<void>;
}) {
  const { toast } = useToast();
  const { trip } = useTripWorkspace();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [templates, setTemplates] = React.useState<
    { id: string; title: string; category: CatalogActivityCategory; cost: number; duration: number; image: string; rating: number }[]
  >([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ activities: typeof templates }>(
          `/catalog/activities?q=${encodeURIComponent(query)}`,
          { auth: false },
        );
        if (!cancelled) setTemplates(res.activities);
      } catch {
        if (!cancelled) setTemplates([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  async function addTemplate(a: (typeof templates)[number]) {
    try {
      await api(`/activities/stop/${stop.id}`, {
        method: "POST",
        body: JSON.stringify({
          title: a.title,
          category: a.category as ActivityCategory,
          cost: a.cost,
          duration: a.duration,
          image: a.image,
          rating: a.rating,
        }),
      });
      toast({ title: "Activity added" });
      setPickerOpen(false);
      await onChanged();
    } catch {
      toast({ title: "Could not add activity", variant: "destructive" });
    }
  }

  async function removeActivity(id: string) {
    try {
      await api(`/activities/${id}`, { method: "DELETE" });
      toast({ title: "Removed" });
      await onChanged();
    } catch {
      toast({ title: "Could not remove", variant: "destructive" });
    }
  }

  async function syncBudgetCategoryHints() {
    const activitySpend = trip.stops.reduce(
      (sum, s) => sum + s.activities.reduce((a, x) => a + Number(x.cost), 0),
      0,
    );
    try {
      await api(`/expenses/trip/${trip.id}`, {
        method: "POST",
        body: JSON.stringify({
          category: ExpenseCategory.ACTIVITIES,
          amount: activitySpend,
          label: "Activities (auto from itinerary)",
        }),
      });
    } catch {
      /* optional */
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-medium">Activities</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setPickerOpen(true)}>
            Add from catalog
          </Button>
          <Button size="sm" className="rounded-xl" onClick={() => void syncBudgetCategoryHints()}>
            Sync budget line
          </Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {stop.activities.map((a) => (
          <motion.div layout key={a.id} className="flex gap-3 rounded-2xl border bg-muted/20 p-3">
            <div className="relative h-16 w-24 overflow-hidden rounded-xl">
              <Image src={a.image || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80"} alt="" fill className="object-cover" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="truncate font-medium">{a.title}</div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{ACTIVITY_LABELS[a.category]}</Badge>
                <span>{formatMoney(Number(a.cost))}</span>
                <span>{a.duration} min</span>
                <span>★ {a.rating.toFixed(1)}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive" onClick={() => removeActivity(a.id)}>
                Remove
              </Button>
            </div>
          </motion.div>
        ))}
        {stop.activities.length === 0 ? <div className="text-sm text-muted-foreground">No activities yet.</div> : null}
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Browse activities</DialogTitle>
          </DialogHeader>
          <Input className="rounded-xl" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <ScrollArea className="h-80 rounded-xl border">
            <div className="grid gap-3 p-3 md:grid-cols-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="rounded-2xl border bg-card text-left shadow-sm transition hover:-translate-y-0.5"
                  onClick={() => addTemplate(t)}
                >
                  <div className="relative h-28 w-full overflow-hidden rounded-t-2xl">
                    <Image src={t.image} alt="" fill className="object-cover" />
                  </div>
                  <div className="space-y-1 p-3">
                    <div className="font-medium leading-snug">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {ACTIVITY_LABELS[t.category as ActivityCategory]} · {formatMoney(t.cost)} · {t.duration}m
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
