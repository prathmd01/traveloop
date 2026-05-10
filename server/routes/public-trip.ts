import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

router.get("/:slug", async (req, res) => {
  const trip = await prisma.trip.findFirst({
    where: {
      shareSlug: req.params.slug,
      visibility: "PUBLIC",
    },
    include: {
      user: { select: { name: true, avatar: true } },
      stops: {
        orderBy: { orderIndex: "asc" },
        include: { activities: { orderBy: { dayDate: "asc" } } },
      },
    },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found or private" });
  return res.json({ trip });
});

export default router;
