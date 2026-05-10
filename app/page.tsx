import Link from "next/link";
import { Plane, ArrowRight, Sparkles, Shield, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-violet-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(167,139,250,0.16),transparent_40%)]" />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Plane className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">Traveloop</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="rounded-xl">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="rounded-xl shadow-sm">Get started</Button>
          </Link>
        </div>
      </header>
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-10 md:flex-row md:items-center md:gap-12 md:pt-16">
        <div className="flex-1 space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-medium text-primary shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Personalized travel planning made easy
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Plan trips that feel{" "}
            <span className="bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent">
              beautifully orchestrated
            </span>
            .
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Multi-city itineraries, drag-and-drop stops, smart budgets, activity discovery, and public sharing —
            all in one calm, premium workspace.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup">
              <Button size="lg" className="rounded-2xl px-8 shadow-md">
                Start planning free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="rounded-2xl px-8">
                View demo account
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 pt-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur">
              <Shield className="mb-2 h-5 w-5 text-primary" />
              <div className="font-medium">Secure sessions</div>
              <p className="text-sm text-muted-foreground">JWT auth & hashed passwords.</p>
            </div>
            <div className="rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur">
              <Plane className="mb-2 h-5 w-5 text-primary" />
              <div className="font-medium">Itinerary builder</div>
              <p className="text-sm text-muted-foreground">Stops, days, activities, timeline.</p>
            </div>
            <div className="rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur">
              <LineChart className="mb-2 h-5 w-5 text-primary" />
              <div className="font-medium">Budget clarity</div>
              <p className="text-sm text-muted-foreground">Charts, alerts, daily pacing.</p>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="relative mx-auto max-w-md rounded-[2rem] border bg-white/80 p-6 shadow-2xl backdrop-blur">
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-sky-200/50 blur-2xl" />
            <div className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-violet-200/50 blur-2xl" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Euro highlights week</span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  On track
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 w-[62%] rounded-full bg-gradient-to-r from-sky-500 to-violet-500" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Budget used</span>
                  <span>62%</span>
                </div>
              </div>
              <div className="space-y-3 border-t pt-4">
                {["Paris — cafés & museums", "Barcelona — Gothic stroll", "Rome — sunset forum"].map((t) => (
                  <div key={t} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10" />
                    <div className="text-sm">{t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
