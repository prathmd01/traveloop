import { redirect } from "next/navigation";

export default function TripIndexPage({ params }: { params: { tripId: string } }) {
  redirect(`/trips/${params.tripId}/itinerary`);
}
