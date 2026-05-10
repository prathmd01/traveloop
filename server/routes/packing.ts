import { Router } from "express";
import { z } from "zod";
import { PackingCategory } from "@prisma/client";
import { prisma } from "../prisma";
import type { AuthedRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

const itemPayload = z.object({
  title: z.string().min(1).max(200),
  category: z.nativeEnum(PackingCategory).optional(),
  packed: z.boolean().optional(),
});

router.get("/trip/:tripId", async (req: AuthedRequest, res) => {
  const trip = await prisma.trip.findFirst({
    where: { id: req.params.tripId, userId: req.userId! },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  const items = await prisma.packingItem.findMany({
    where: { tripId: trip.id },
    orderBy: { title: "asc" },
  });
  return res.json({ items });
});

router.post("/trip/:tripId", async (req: AuthedRequest, res) => {
  const parsed = itemPayload.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const trip = await prisma.trip.findFirst({
    where: { id: req.params.tripId, userId: req.userId! },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const item = await prisma.packingItem.create({
    data: {
      tripId: trip.id,
      title: parsed.data.title,
      category: parsed.data.category ?? PackingCategory.OTHER,
      packed: parsed.data.packed ?? false,
    },
  });
  return res.status(201).json({ item });
});

router.patch("/:itemId", async (req: AuthedRequest, res) => {
  const parsed = itemPayload.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.packingItem.findUnique({
    where: { id: req.params.itemId },
    include: { trip: true },
  });
  if (!existing || existing.trip.userId !== req.userId) {
    return res.status(404).json({ error: "Item not found" });
  }

  const item = await prisma.packingItem.update({
    where: { id: req.params.itemId },
    data: parsed.data,
  });
  return res.json({ item });
});

router.delete("/:itemId", async (req: AuthedRequest, res) => {
  const existing = await prisma.packingItem.findUnique({
    where: { id: req.params.itemId },
    include: { trip: true },
  });
  if (!existing || existing.trip.userId !== req.userId) {
    return res.status(404).json({ error: "Item not found" });
  }
  await prisma.packingItem.delete({ where: { id: req.params.itemId } });
  return res.status(204).send();
});

export default router;
