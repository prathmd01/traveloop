import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

import authRoutes from "./routes/auth";
import tripsRoutes from "./routes/trips";
import stopsRoutes from "./routes/stops";
import activitiesRoutes from "./routes/activities";
import notesRoutes from "./routes/notes";
import packingRoutes from "./routes/packing";
import expensesRoutes from "./routes/expenses";
import uploadRoutes from "./routes/upload";
import publicTripRoutes from "./routes/public-trip";
import catalogRoutes from "./routes/catalog";
import aiRoutes from "./routes/ai";
import optimizeRoutes from "./routes/optimize";
import adminRoutes from "./routes/admin";

const app = express();
const PORT = Number(process.env.API_PORT) || 4000;

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadDir));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/trips", tripsRoutes);
app.use("/stops", stopsRoutes);
app.use("/activities", activitiesRoutes);
app.use("/notes", notesRoutes);
app.use("/packing", packingRoutes);
app.use("/expenses", expensesRoutes);
app.use("/upload", uploadRoutes);
app.use("/public/trips", publicTripRoutes);
app.use("/catalog", catalogRoutes);
app.use("/ai", aiRoutes);
app.use("/optimize", optimizeRoutes);
app.use("/admin", adminRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Traveloop API listening on http://localhost:${PORT}`);
});
