import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import type { AuthedRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

const stopPayload = z.object({
  city: z.string().min(1).max(120),
  country: z.string().min(1).max(120),
  arrivalDate: z.coerce.date(),
  departureDate: z.coerce.date(),
  notes: z.string().max(8000).optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

async function assertTripOwner(tripId: string, userId: string) {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  return trip;
}

router.post("/trip/:tripId", async (req: AuthedRequest, res) => {
  const parsed = stopPayload.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const trip = await assertTripOwner(req.params.tripId, req.userId!);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const maxIx = await prisma.tripStop.aggregate({
    where: { tripId: trip.id },
    _max: { orderIndex: true },
  });
  const orderIndex = (maxIx._max.orderIndex ?? -1) + 1;

  const stop = await prisma.tripStop.create({
    data: {
      tripId: trip.id,
      city: parsed.data.city,
      country: parsed.data.country,
      arrivalDate: parsed.data.arrivalDate,
      departureDate: parsed.data.departureDate,
      notes: parsed.data.notes ?? undefined,
      orderIndex,
      lat: parsed.data.lat ?? undefined,
      lng: parsed.data.lng ?? undefined,
    },
    include: { activities: true },
  });
  return res.status(201).json({ stop });
});

router.patch("/:stopId", async (req: AuthedRequest, res) => {
  const parsed = stopPayload.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.tripStop.findUnique({
    where: { id: req.params.stopId },
    include: { trip: true },
  });
  if (!existing || existing.trip.userId !== req.userId) {
    return res.status(404).json({ error: "Stop not found" });
  }

  const stop = await prisma.tripStop.update({
    where: { id: req.params.stopId },
    data: {
      ...parsed.data,
      notes: parsed.data.notes === null ? null : parsed.data.notes,
    },
    include: { activities: true },
  });
  return res.json({ stop });
});

router.delete("/:stopId", async (req: AuthedRequest, res) => {
  const existing = await prisma.tripStop.findUnique({
    where: { id: req.params.stopId },
    include: { trip: true },
  });
  if (!existing || existing.trip.userId !== req.userId) {
    return res.status(404).json({ error: "Stop not found" });
  }
  await prisma.tripStop.delete({ where: { id: req.params.stopId } });
  return res.status(204).send();
});

export default router;
