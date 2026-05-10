import { Router } from "express";
import { prisma } from "../prisma";
import type { AuthedRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

router.post("/trips/:tripId/optimize", async (req: AuthedRequest, res) => {
  const trip = await prisma.trip.findFirst({
    where: { id: req.params.tripId, userId: req.userId! },
    include: { stops: true },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const sorted = [...trip.stops].sort(
    (a, b) => a.arrivalDate.getTime() - b.arrivalDate.getTime(),
  );

  await prisma.$transaction(
    sorted.map((stop, index) =>
      prisma.tripStop.update({
        where: { id: stop.id },
        data: { orderIndex: index },
      }),
    ),
  );

  return res.json({
    message: "Stops ordered by arrival date for a smoother timeline.",
    optimizedOrder: sorted.map((s) => s.id),
  });
});

export default router;
