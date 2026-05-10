"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { ExpenseCategory } from "@prisma/client";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import { useTripWorkspace } from "@/contexts/trip-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#38bdf8", "#a855f7", "#34d399", "#fbbf24", "#f97316"];

const LABEL: Record<ExpenseCategory, string> = {
  TRANSPORT: "Transport",
  STAY: "Stay",
  ACTIVITIES: "Activities",
  MEALS: "Meals",
  OTHER: "Other",
};

export function TripBudgetPanel() {
  const { trip, refresh } = useTripWorkspace();
  const { toast } = useToast();
  const budget = Number(trip.budget);

  const activityTotal = trip.stops.reduce(
    (sum, s) => sum + s.activities.reduce((a, x) => a + Number(x.cost), 0),
    0,
  );

  const expenses = trip.expenses ?? [];
  const expenseSum = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const committed = Math.max(expenseSum, activityTotal);

  const tripDays = Math.max(
    1,
    Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000),
  );

  const daily = committed / tripDays;
  const dailyBudget = budget / tripDays;

  const pieData = Object.values(ExpenseCategory).map((cat) => {
    const amount = expenses.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount), 0);
    return { name: LABEL[cat], value: amount };
  }).filter((d) => d.value > 0);

  const barData = Array.from({ length: tripDays }).map((_, i) => {
    const daySpend = i === 0 ? daily : daily * (0.85 + (i % 3) * 0.05);
    return { day: `D${i + 1}`, spend: Math.round(daySpend) };
  });

  const warn = committed > budget;

  async function quickAddExpense() {
    const category = ExpenseCategory.MEALS;
    const amount = 40;
    try {
      await api(`/expenses/trip/${trip.id}`, {
        method: "POST",
        body: JSON.stringify({ category, amount, label: "Quick meal (demo)" }),
      });
      toast({ title: "Expense added" });
      await refresh();
    } catch {
      toast({ title: "Could not add expense", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Trip budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="font-display text-3xl">{formatMoney(budget)}</div>
            <p className="text-xs text-muted-foreground">Planned ceiling</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Committed spend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="font-display text-3xl">{formatMoney(committed)}</div>
            <p className="text-xs text-muted-foreground">Expenses + activity costs</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Status
              {warn ? (
                <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-900">
                  <AlertTriangle className="h-3 w-3" />
                  Over plan
                </Badge>
              ) : (
                <Badge variant="success">Healthy</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Avg {formatMoney(daily)} / day vs target {formatMoney(dailyBudget)} / day
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border bg-white/90 p-4 shadow-sm">
          <div className="mb-2 font-medium">Spend mix</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData.length ? pieData : [{ name: "Unallocated", value: 1 }]} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {(pieData.length ? pieData : [{ name: "Unallocated", value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl border bg-white/90 p-4 shadow-sm">
          <div className="mb-2 font-medium">Daily pacing (modeled)</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Bar dataKey="spend" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <ExpenseQuickForm tripId={trip.id} onAdded={refresh} />
      <Button variant="outline" className="rounded-xl" onClick={quickAddExpense}>
        Add demo meal expense
      </Button>
    </div>
  );
}

function ExpenseQuickForm({ tripId, onAdded }: { tripId: string; onAdded: () => Promise<void> }) {
  const { toast } = useToast();
  const [category, setCategory] = React.useState<ExpenseCategory>(ExpenseCategory.MEALS);
  const [amount, setAmount] = React.useState("45");
  const [label, setLabel] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api(`/expenses/trip/${tripId}`, {
        method: "POST",
        body: JSON.stringify({
          category,
          amount: Number(amount),
          label: label || undefined,
        }),
      });
      toast({ title: "Expense logged" });
      await onAdded();
      setLabel("");
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  }

  return (
    <Card className="rounded-2xl border bg-white/90 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Log expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}>
          <div className="space-y-1 md:col-span-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {Object.values(ExpenseCategory).map((c) => (
                  <SelectItem key={c} value={c}>
                    {LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Amount</Label>
            <Input className="rounded-xl" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
          </div>
          <div className="space-y-1">
            <Label>Label</Label>
            <Input className="rounded-xl" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Optional" />
          </div>
          <div className="md:col-span-4">
            <Button type="submit" className="rounded-xl">
              Save expense
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
