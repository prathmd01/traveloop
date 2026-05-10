"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CloudSun, MapPin, Search } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default function ExplorePage() {
  const [qCity, setQCity] = React.useState("");
  const [qAct, setQAct] = React.useState("");
  const [cities, setCities] = React.useState<
    { id: string; city: string; country: string; costIndex: number; popularity: number; weatherSummary: string; tempC: number }[]
  >([]);
  const [activities, setActivities] = React.useState<
    { id: string; title: string; category: string; cost: number; duration: number; image: string; rating: number }[]
  >([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ cities: typeof cities }>(`/catalog/cities?q=${encodeURIComponent(qCity)}`, {
          auth: false,
        });
        if (!cancelled) setCities(res.cities);
      } catch {
        if (!cancelled) setCities([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qCity]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ activities: typeof activities }>(
          `/catalog/activities?q=${encodeURIComponent(qAct)}`,
          { auth: false },
        );
        if (!cancelled) setActivities(res.activities);
      } catch {
        if (!cancelled) setActivities([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qAct]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold">Explore</h1>
        <p className="text-muted-foreground">Search curated cities and activity templates to inspire your next loop.</p>
      </motion.div>

      <Tabs defaultValue="cities" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="cities">Global cities</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>
        <TabsContent value="cities" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="rounded-xl pl-9" placeholder="Search cities..." value={qCity} onChange={(e) => setQCity(e.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {cities.map((c) => (
              <Card key={c.id} className="rounded-2xl border bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-4 w-4 text-primary" />
                    {c.city}, {c.country}
                  </CardTitle>
                  <CardDescription>
                    Cost index {c.costIndex} · Popularity {c.popularity}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CloudSun className="h-4 w-4" />
                  {c.weatherSummary} · ~{c.tempC}°C
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="activities" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="rounded-xl pl-9" placeholder="Search activities..." value={qAct} onChange={(e) => setQAct(e.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {activities.map((a) => (
              <Card key={a.id} className="overflow-hidden rounded-2xl border bg-white/90 shadow-sm">
                <div className="relative h-40 w-full">
                  <Image src={a.image} alt="" fill className="object-cover" />
                </div>
                <CardHeader>
                  <CardTitle className="text-base">{a.title}</CardTitle>
                  <CardDescription className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{a.category}</Badge>
                    <span>${a.cost}</span>
                    <span>{a.duration}m</span>
                    <span>★ {a.rating}</span>
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
