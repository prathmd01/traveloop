import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plane, Sparkles } from "lucide-react";
import { TripPublicView } from "@/components/public/trip-public-view";

const API =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function absoluteAsset(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

async function getTrip(slug: string) {
  const res = await fetch(`${API}/public/trips/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json() as Promise<{ trip: Record<string, unknown> }>;
}

export default async function PublicTripPage({ params }: { params: { slug: string } }) {
  const data = await getTrip(params.slug);
  if (!data?.trip) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Plane className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-semibold">Traveloop</span>
        </Link>
        <Link href="/signup" className="text-sm font-medium text-primary hover:underline">
          Plan your own
        </Link>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 pb-24">
        <div className="overflow-hidden rounded-[2rem] border bg-white/90 shadow-xl">
          <div className="relative h-64 w-full md:h-80">
            <Image
              src={
                absoluteAsset(data.trip.coverImage as string | undefined) ||
                "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&q=80"
              }
              alt=""
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Shared itinerary
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">{String(data.trip.title)}</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/90">{String(data.trip.description || "")}</p>
            </div>
          </div>
        </div>

        <TripPublicView trip={data.trip as never} />
      </main>
    </div>
  );
}
