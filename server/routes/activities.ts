import { Router } from "express";
import { z } from "zod";
import { ActivityCategory } from "@prisma/client";
import { prisma } from "../prisma";
import type { AuthedRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

const activityPayload = z.object({
  title: z.string().min(1).max(200),
  category: z.nativeEnum(ActivityCategory).optional(),
  cost: z.coerce.number().nonnegative(),
  duration: z.coerce.number().int().nonnegative(),
  image: z.string().nullable().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  dayDate: z.coerce.date().optional().nullable(),
});

router.post("/stop/:stopId", async (req: AuthedRequest, res) => {
  const parsed = activityPayload.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const stop = await prisma.tripStop.findUnique({
    where: { id: req.params.stopId },
    include: { trip: true },
  });
  if (!stop || stop.trip.userId !== req.userId) {
    return res.status(404).json({ error: "Stop not found" });
  }

  const activity = await prisma.activity.create({
    data: {
      stopId: stop.id,
      title: parsed.data.title,
      category: parsed.data.category ?? ActivityCategory.OTHER,
      cost: parsed.data.cost,
      duration: parsed.data.duration,
      image: parsed.data.image ?? undefined,
      rating: parsed.data.rating ?? 0,
      dayDate: parsed.data.dayDate ?? undefined,
    },
  });
  return res.status(201).json({ activity });
});

router.patch("/:activityId", async (req: AuthedRequest, res) => {
  const parsed = activityPayload.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.activity.findUnique({
    where: { id: req.params.activityId },
    include: { stop: { include: { trip: true } } },
  });
  if (!existing || existing.stop.trip.userId !== req.userId) {
    return res.status(404).json({ error: "Activity not found" });
  }

  const activity = await prisma.activity.update({
    where: { id: req.params.activityId },
    data: {
      ...parsed.data,
      image: parsed.data.image === null ? null : parsed.data.image,
      dayDate: parsed.data.dayDate === null ? null : parsed.data.dayDate,
    },
  });
  return res.json({ activity });
});

router.delete("/:activityId", async (req: AuthedRequest, res) => {
  const existing = await prisma.activity.findUnique({
    where: { id: req.params.activityId },
    include: { stop: { include: { trip: true } } },
  });
  if (!existing || existing.stop.trip.userId !== req.userId) {
    return res.status(404).json({ error: "Activity not found" });
  }
  await prisma.activity.delete({ where: { id: req.params.activityId } });
  return res.status(204).send();
});

export default router;
