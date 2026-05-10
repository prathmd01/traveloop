import type {
  Trip,
  TripStop,
  Activity,
  User,
  PackingItem,
  Note,
  TripExpense,
} from "@prisma/client";

export type TripWithRelations = Trip & {
  stops: (TripStop & { activities: Activity[] })[];
  packingItems?: PackingItem[];
  notes?: Note[];
  expenses?: TripExpense[];
};

export type UserPublic = Pick<
  User,
  "id" | "name" | "email" | "avatar" | "language" | "createdAt" | "role"
> & {
  savedDestinations?: unknown;
};
