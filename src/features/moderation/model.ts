import type { Listing } from "@/features/listings/model";

export type Decision = { id: number; outcome: string; reason: string; createdAt: string };
export type Report = { id: string; listingId: string; reason: string; status: string; response: string | null };
export type Appeal = { id: string; decisionId: number; reason: string; status: string; response: string | null };
export type ModerationQueue = { listings: Listing[]; sellers: string[]; reports: Report[]; appeals: Appeal[] };
