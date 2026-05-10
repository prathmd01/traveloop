"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type Stats = {
  totals: { users: number; trips: number };
  topCities: { city: string; country: string; visits: number }[];
  tripsPerMonth: { month: string; count: number }[];
  activityPopularity: { category: string; count: number }[];
};

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<Stats>("/admin/stats");
        if (!cancelled) setStats(res);
      } catch (e) {
        if (!cancelled) setError("Forbidden");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (user?.role !== "ADMIN") {
    return (
      <EmptyState icon={ShieldAlert} title="Admins only" description="You don't have access to this workspace." />
    );
  }

  if (error) {
    return <EmptyState icon={ShieldAlert} title="Couldn't load analytics" description={error} />;
  }

  if (!stats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground">High-level product pulse for Traveloop.</p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Total users</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-4xl">{stats.totals.users}</CardContent>
        </Card>
        <Card className="rounded-2xl border bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Total trips</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-4xl">{stats.totals.trips}</CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border bg-white/90 p-4 shadow-sm">
        <div className="mb-2 font-medium">Trips created over time</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.tripsPerMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border bg-white/90 p-4 shadow-sm">
          <div className="mb-2 font-medium">Most visited cities</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topCities}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="visits" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="rounded-2xl border bg-white/90 p-4 shadow-sm">
          <div className="mb-2 font-medium">Activity categories</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.activityPopularity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
