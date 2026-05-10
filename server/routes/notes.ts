import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import type { AuthedRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

const notePayload = z.object({
  content: z.string().min(1).max(100000),
  stopId: z.string().nullable().optional(),
  dayDate: z.coerce.date().optional().nullable(),
});

router.get("/trip/:tripId", async (req: AuthedRequest, res) => {
  const trip = await prisma.trip.findFirst({
    where: { id: req.params.tripId, userId: req.userId! },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  const notes = await prisma.note.findMany({
    where: { tripId: trip.id },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ notes });
});

router.post("/trip/:tripId", async (req: AuthedRequest, res) => {
  const parsed = notePayload.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const trip = await prisma.trip.findFirst({
    where: { id: req.params.tripId, userId: req.userId! },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  if (parsed.data.stopId) {
    const stop = await prisma.tripStop.findFirst({
      where: { id: parsed.data.stopId, tripId: trip.id },
    });
    if (!stop) return res.status(400).json({ error: "Invalid stop for this trip" });
  }

  const note = await prisma.note.create({
    data: {
      tripId: trip.id,
      content: parsed.data.content,
      stopId: parsed.data.stopId ?? undefined,
      dayDate: parsed.data.dayDate ?? undefined,
    },
  });
  return res.status(201).json({ note });
});

router.patch("/:noteId", async (req: AuthedRequest, res) => {
  const parsed = notePayload.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.note.findUnique({
    where: { id: req.params.noteId },
    include: { trip: true },
  });
  if (!existing || existing.trip.userId !== req.userId) {
    return res.status(404).json({ error: "Note not found" });
  }

  const note = await prisma.note.update({
    where: { id: req.params.noteId },
    data: {
      ...parsed.data,
      stopId: parsed.data.stopId === null ? null : parsed.data.stopId,
      dayDate: parsed.data.dayDate === null ? null : parsed.data.dayDate,
    },
  });
  return res.json({ note });
});

router.delete("/:noteId", async (req: AuthedRequest, res) => {
  const existing = await prisma.note.findUnique({
    where: { id: req.params.noteId },
    include: { trip: true },
  });
  if (!existing || existing.trip.userId !== req.userId) {
    return res.status(404).json({ error: "Note not found" });
  }
  await prisma.note.delete({ where: { id: req.params.noteId } });
  return res.status(204).send();
});

export default router;
