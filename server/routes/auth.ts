import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { signToken } from "../utils/jwt";
import type { AuthedRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      language: true,
      role: true,
      createdAt: true,
    },
  });
  const token = signToken({ userId: user.id, email: user.email });
  return res.status(201).json({ user, token });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const safe = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    language: user.language,
    role: user.role,
    createdAt: user.createdAt,
  };
  const token = signToken({ userId: user.id, email: user.email });
  return res.json({ user: safe, token });
});

router.get("/me", authMiddleware, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      language: true,
      role: true,
      savedDestinations: true,
      createdAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user });
});

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  avatar: z.string().min(1).nullable().optional(),
  language: z.string().min(2).max(10).optional(),
  savedDestinations: z.array(z.string()).optional(),
});

router.patch("/me", authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.savedDestinations) {
    data.savedDestinations = parsed.data.savedDestinations;
  }
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: data as Parameters<typeof prisma.user.update>[0]["data"],
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      language: true,
      role: true,
      savedDestinations: true,
      createdAt: true,
    },
  });
  return res.json({ user });
});

router.post("/forgot-password", async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid email" });
  return res.json({
    message: "If an account exists for that email, password reset instructions have been sent.",
  });
});

router.delete("/me", authMiddleware, async (req: AuthedRequest, res) => {
  await prisma.user.delete({ where: { id: req.userId! } });
  return res.status(204).send();
});

export default router;
