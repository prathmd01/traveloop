"use client";

import { motion } from "framer-motion";
import { TripBudgetPanel } from "@/components/budget/trip-budget-panel";

export default function TripBudgetPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">Budget & expenses</h2>
        <p className="text-sm text-muted-foreground">Visualize burn-down, category mix, and daily pacing.</p>
      </div>
      <TripBudgetPanel />
    </motion.div>
  );
}
