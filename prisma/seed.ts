import { PrismaClient, TripVisibility, ActivityCategory, PackingCategory, ExpenseCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("Traveloop123!", 12);

  const demo = await prisma.user.upsert({
    where: { email: "demo@traveloop.app" },
    update: {},
    create: {
      name: "Alex Wander",
      email: "demo@traveloop.app",
      password: hash,
      language: "en",
      role: "USER",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@traveloop.app" },
    update: { role: "ADMIN" },
    create: {
      name: "Traveloop Admin",
      email: "admin@traveloop.app",
      password: hash,
      language: "en",
      role: "ADMIN",
    },
  });

  await prisma.trip.deleteMany({ where: { userId: demo.id } });

  const trip1 = await prisma.trip.create({
    data: {
      userId: demo.id,
      title: "Euro highlights week",
      description: "Paris → Barcelona → Rome with food-forward pacing.",
      budget: 4200,
      startDate: new Date(Date.now() + 86400000 * 14),
      endDate: new Date(Date.now() + 86400000 * 21),
      coverImage:
        "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1600&q=80",
      visibility: TripVisibility.PUBLIC,
      draft: false,
      shareSlug: "demo-euro-week",
      stops: {
        create: [
          {
            city: "Paris",
            country: "France",
            arrivalDate: new Date(Date.now() + 86400000 * 14),
            departureDate: new Date(Date.now() + 86400000 * 16),
            orderIndex: 0,
            lat: 48.8566,
            lng: 2.3522,
            notes: "Focus on cafés & museums.",
            activities: {
              create: [
                {
                  title: "Louvre highlights",
                  category: ActivityCategory.SIGHTSEEING,
                  cost: 45,
                  duration: 180,
                  rating: 4.9,
                  image:
                    "https://images.unsplash.com/photo-1566127444979-b3d2b865f28e?w=800&q=80",
                },
                {
                  title: "Canal-side dinner",
                  category: ActivityCategory.FOOD,
                  cost: 95,
                  duration: 120,
                  rating: 4.8,
                  image:
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
                },
              ],
            },
          },
          {
            city: "Barcelona",
            country: "Spain",
            arrivalDate: new Date(Date.now() + 86400000 * 16),
            departureDate: new Date(Date.now() + 86400000 * 18),
            orderIndex: 1,
            lat: 41.3851,
            lng: 2.1734,
            activities: {
              create: [
                {
                  title: "Gothic Quarter stroll",
                  category: ActivityCategory.SIGHTSEEING,
                  cost: 0,
                  duration: 120,
                  rating: 4.7,
                  image:
                    "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
                },
              ],
            },
          },
        ],
      },
      packingItems: {
        create: [
          { title: "Passport", category: PackingCategory.DOCUMENTS },
          { title: "Comfortable shoes", category: PackingCategory.CLOTHING },
          { title: "Power adapter", category: PackingCategory.ELECTRONICS },
        ],
      },
      expenses: {
        create: [
          { category: ExpenseCategory.TRANSPORT, amount: 580, label: "Inter-city trains" },
          { category: ExpenseCategory.STAY, amount: 1200, label: "Hotels (est.)" },
          { category: ExpenseCategory.MEALS, amount: 640, label: "Dining" },
          { category: ExpenseCategory.ACTIVITIES, amount: 310, label: "Tickets & tours" },
        ],
      },
      notes: {
        create: [
          {
            content:
              "<p><strong>Day 1</strong> — arrive midday, light walk, early sleep.</p>",
            dayDate: new Date(Date.now() + 86400000 * 14),
          },
        ],
      },
    },
  });

  await prisma.trip.create({
    data: {
      userId: demo.id,
      title: "Kyoto calm escape",
      description: "Temples, tea, and forest baths.",
      budget: 2800,
      startDate: new Date(Date.now() - 86400000 * 30),
      endDate: new Date(Date.now() - 86400000 * 23),
      visibility: TripVisibility.PRIVATE,
      draft: false,
      stops: {
        create: [
          {
            city: "Kyoto",
            country: "Japan",
            arrivalDate: new Date(Date.now() - 86400000 * 30),
            departureDate: new Date(Date.now() - 86400000 * 23),
            orderIndex: 0,
            lat: 35.0116,
            lng: 135.7681,
            activities: {
              create: [
                {
                  title: "Arashiyama bamboo grove",
                  category: ActivityCategory.NATURE,
                  cost: 0,
                  duration: 90,
                  rating: 4.8,
                  image:
                    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Seed OK — demo user:", demo.email, "admin:", admin.email);
  console.log("Sample trip id:", trip1.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
