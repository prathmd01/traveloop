import { Router } from "express";
import { z } from "zod";
import { ExpenseCategory } from "@prisma/client";
import { prisma } from "../prisma";
import type { AuthedRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

const expensePayload = z.object({
  category: z.nativeEnum(ExpenseCategory),
  amount: z.coerce.number().nonnegative(),
  label: z.string().max(200).optional().nullable(),
  date: z.coerce.date().optional().nullable(),
});

router.get("/trip/:tripId", async (req: AuthedRequest, res) => {
  const trip = await prisma.trip.findFirst({
    where: { id: req.params.tripId, userId: req.userId! },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  const expenses = await prisma.tripExpense.findMany({
    where: { tripId: trip.id },
    orderBy: { date: "desc" },
  });
  return res.json({ expenses });
});

router.post("/trip/:tripId", async (req: AuthedRequest, res) => {
  const parsed = expensePayload.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const trip = await prisma.trip.findFirst({
    where: { id: req.params.tripId, userId: req.userId! },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const expense = await prisma.tripExpense.create({
    data: {
      tripId: trip.id,
      category: parsed.data.category,
      amount: parsed.data.amount,
      label: parsed.data.label ?? undefined,
      date: parsed.data.date ?? undefined,
    },
  });
  return res.status(201).json({ expense });
});

router.patch("/:expenseId", async (req: AuthedRequest, res) => {
  const parsed = expensePayload.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.tripExpense.findUnique({
    where: { id: req.params.expenseId },
    include: { trip: true },
  });
  if (!existing || existing.trip.userId !== req.userId) {
    return res.status(404).json({ error: "Expense not found" });
  }

  const expense = await prisma.tripExpense.update({
    where: { id: req.params.expenseId },
    data: {
      ...parsed.data,
      label: parsed.data.label === null ? null : parsed.data.label,
      date: parsed.data.date === null ? null : parsed.data.date,
    },
  });
  return res.json({ expense });
});

router.delete("/:expenseId", async (req: AuthedRequest, res) => {
  const existing = await prisma.tripExpense.findUnique({
    where: { id: req.params.expenseId },
    include: { trip: true },
  });
  if (!existing || existing.trip.userId !== req.userId) {
    return res.status(404).json({ error: "Expense not found" });
  }
  await prisma.tripExpense.delete({ where: { id: req.params.expenseId } });
  return res.status(204).send();
});

export default router;
