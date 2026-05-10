import { Router } from "express";
import { prisma } from "../prisma";
import type { AuthedRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

const router = Router();

async function requireAdmin(req: AuthedRequest, res: import("express").Response, next: import("express").NextFunction) {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user || user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

router.use(authMiddleware);
router.use(requireAdmin);

router.get("/stats", async (_req, res) => {
  const [users, trips, stops] = await Promise.all([
    prisma.user.count(),
    prisma.trip.count(),
    prisma.tripStop.groupBy({
      by: ["city", "country"],
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
      take: 8,
    }),
  ]);

  const engagement = await prisma.trip.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
    take: 500,
  });

  const byMonth: Record<string, number> = {};
  for (const t of engagement) {
    const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] ?? 0) + 1;
  }

  const activityMix = await prisma.activity.groupBy({
    by: ["category"],
    _count: { category: true },
  });

  return res.json({
    totals: { users, trips },
    topCities: stops.map((s) => ({
      city: s.city,
      country: s.country,
      visits: s._count.city,
    })),
    tripsPerMonth: Object.entries(byMonth).map(([month, count]) => ({ month, count })),
    activityPopularity: activityMix.map((a) => ({
      category: a.category,
      count: a._count.category,
    })),
  });
});

export default router;
