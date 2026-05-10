"use client";

import { motion } from "framer-motion";
import { ItineraryBuilder } from "@/components/itinerary/itinerary-builder";

export default function ItineraryPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">Itinerary builder</h2>
        <p className="text-sm text-muted-foreground">
          Drag stops to reorder your route. Activities and notes auto-save as you edit.
        </p>
      </div>
      <ItineraryBuilder />
    </motion.div>
  );
}
