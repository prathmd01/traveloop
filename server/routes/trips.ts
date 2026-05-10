import { Router } from "express";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "../prisma";
import type { AuthedRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";
import { TripVisibility } from "@prisma/client";

const router = Router();

router.use(authMiddleware);

const tripPayload = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  budget: z.coerce.number().nonnegative(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  coverImage: z.string().nullable().optional(),
  visibility: z.nativeEnum(TripVisibility).optional(),
  draft: z.boolean().optional(),
});

function generateShareSlug() {
  return randomBytes(12).toString("hex");
}

router.get("/", async (req: AuthedRequest, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const filter = typeof req.query.filter === "string" ? req.query.filter : "all";
  const now = new Date();

  const trips = await prisma.trip.findMany({
    where: {
      userId: req.userId!,
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
      ...(filter === "upcoming"
        ? { startDate: { gte: now } }
        : filter === "past"
          ? { endDate: { lt: now } }
          : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      stops: {
        orderBy: { orderIndex: "asc" },
        include: { activities: true },
      },
      packingItems: true,
      expenses: true,
    },
  });

  return res.json({ trips });
});

router.get("/:id", async (req: AuthedRequest, res) => {
  const trip = await prisma.trip.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: {
      stops: {
        orderBy: { orderIndex: "asc" },
        include: { activities: { orderBy: { dayDate: "asc" } } },
      },
      packingItems: true,
      notes: { orderBy: { createdAt: "desc" } },
      expenses: true,
    },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  return res.json({ trip });
});

router.post("/", async (req: AuthedRequest, res) => {
  const parsed = tripPayload.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data;
  if (data.endDate < data.startDate) {
    return res.status(400).json({ error: "End date must be after start date" });
  }
  const trip = await prisma.trip.create({
    data: {
      userId: req.userId!,
      title: data.title,
      description: data.description ?? undefined,
      budget: data.budget,
      startDate: data.startDate,
      endDate: data.endDate,
      coverImage: data.coverImage ?? undefined,
      visibility: data.visibility ?? TripVisibility.PRIVATE,
      draft: data.draft ?? false,
      shareSlug: generateShareSlug(),
    },
    include: {
      stops: { orderBy: { orderIndex: "asc" }, include: { activities: true } },
    },
  });
  return res.status(201).json({ trip });
});

router.patch("/:id", async (req: AuthedRequest, res) => {
  const parsed = tripPayload.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.trip.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) return res.status(404).json({ error: "Trip not found" });

  const data = parsed.data;
  const start = data.startDate ?? existing.startDate;
  const end = data.endDate ?? existing.endDate;
  if (end < start) return res.status(400).json({ error: "End date must be after start date" });

  const trip = await prisma.trip.update({
    where: { id: req.params.id },
    data: {
      ...data,
      description: data.description === null ? null : data.description,
    },
    include: {
      stops: { orderBy: { orderIndex: "asc" }, include: { activities: true } },
      packingItems: true,
      expenses: true,
    },
  });
  return res.json({ trip });
});

router.delete("/:id", async (req: AuthedRequest, res) => {
  const trip = await prisma.trip.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  await prisma.trip.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

router.post("/:id/clone", async (req: AuthedRequest, res) => {
  const source = await prisma.trip.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: {
      stops: { include: { activities: true }, orderBy: { orderIndex: "asc" } },
      packingItems: true,
      expenses: true,
    },
  });
  if (!source) return res.status(404).json({ error: "Trip not found" });

  const trip = await prisma.$transaction(async (tx) => {
    const t = await tx.trip.create({
      data: {
        userId: req.userId!,
        title: `${source.title} (copy)`,
        description: source.description,
        budget: source.budget,
        startDate: source.startDate,
        endDate: source.endDate,
        coverImage: source.coverImage,
        visibility: TripVisibility.PRIVATE,
        draft: true,
        shareSlug: generateShareSlug(),
      },
    });
    for (const s of source.stops) {
      const stop = await tx.tripStop.create({
        data: {
          tripId: t.id,
          city: s.city,
          country: s.country,
          arrivalDate: s.arrivalDate,
          departureDate: s.departureDate,
          notes: s.notes,
          orderIndex: s.orderIndex,
          lat: s.lat,
          lng: s.lng,
        },
      });
      for (const a of s.activities) {
        await tx.activity.create({
          data: {
            stopId: stop.id,
            title: a.title,
            category: a.category,
            cost: a.cost,
            duration: a.duration,
            image: a.image,
            rating: a.rating,
            dayDate: a.dayDate,
          },
        });
      }
    }
    for (const p of source.packingItems) {
      await tx.packingItem.create({
        data: {
          tripId: t.id,
          title: p.title,
          category: p.category,
          packed: false,
        },
      });
    }
    for (const e of source.expenses) {
      await tx.tripExpense.create({
        data: {
          tripId: t.id,
          category: e.category,
          amount: e.amount,
          label: e.label,
          date: e.date,
        },
      });
    }
    return tx.trip.findUniqueOrThrow({
      where: { id: t.id },
      include: {
        stops: { orderBy: { orderIndex: "asc" }, include: { activities: true } },
        packingItems: true,
        expenses: true,
      },
    });
  });

  return res.status(201).json({ trip });
});

router.patch("/:id/stops/reorder", async (req: AuthedRequest, res) => {
  const schema = z.object({ orderedStopIds: z.array(z.string().min(1)) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const trip = await prisma.trip.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: { stops: true },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const ids = new Set(trip.stops.map((s) => s.id));
  if (parsed.data.orderedStopIds.length !== ids.size) {
    return res.status(400).json({ error: "Stop id list mismatch" });
  }
  for (const id of parsed.data.orderedStopIds) {
    if (!ids.has(id)) return res.status(400).json({ error: "Unknown stop id" });
  }

  await prisma.$transaction(
    parsed.data.orderedStopIds.map((id, index) =>
      prisma.tripStop.update({
        where: { id },
        data: { orderIndex: index },
      }),
    ),
  );

  const updated = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: {
      stops: { orderBy: { orderIndex: "asc" }, include: { activities: true } },
    },
  });
  return res.json({ trip: updated });
});

export default router;
