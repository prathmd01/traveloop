"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, LayoutDashboard, MapPinned, Menu, Plane, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips", label: "My trips", icon: Plane },
  { href: "/trips/new", label: "Plan trip", icon: Compass },
  { href: "/explore", label: "Explore", icon: MapPinned },
];

const adminNav = [{ href: "/admin", label: "Analytics", icon: Sparkles }];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const links = user?.role === "ADMIN" ? [...nav, ...adminNav] : nav;

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/dashboard" className="flex items-center gap-2 px-2" onClick={onNavigate}>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Plane className="h-5 w-5" />
        </div>
        <div>
          <div className="font-display text-lg font-semibold tracking-tight">Traveloop</div>
          <div className="text-xs text-muted-foreground">Personalized trips</div>
        </div>
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate}>
              <span
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="space-y-2">
        <Link href="/profile" onClick={onNavigate}>
          <span className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <Settings className="h-4 w-4" />
            Profile & settings
          </span>
        </Link>
        <Button variant="outline" className="w-full justify-start rounded-xl" onClick={() => logout()}>
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TL";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-sky-50/80 via-white to-violet-50/60">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-white/70 backdrop-blur-xl lg:block">
        <SidebarContent />
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="outline" size="icon" className="rounded-xl">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SidebarContent onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="flex flex-1 items-center justify-between gap-3">
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden text-sm text-muted-foreground md:block"
              >
                {pathname === "/dashboard"
                  ? "Your travel command center"
                  : "Craft journeys that feel effortless"}
              </motion.div>
              <div className="flex items-center gap-3">
                <Link href="/trips/new">
                  <Button className="rounded-xl shadow-sm">Plan new trip</Button>
                </Link>
                <Link href="/profile">
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={user?.avatar || undefined} alt={user?.name || ""} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Link>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
