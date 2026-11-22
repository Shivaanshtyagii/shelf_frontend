export type Scope = "EXPLORE" | "CAMPUS_MATERIALS" | "CAMPUS_MARKETPLACE";
export type ListingStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
export type Card = {
  id: string; scope: Scope; title: string; description: string; subject: string; priceMinor: number;
  publishedAt: string | null;
};
export type Listing = Card & {
  ownerId: string; institutionId: string | null; assetId: string | null; status: ListingStatus; revision: number;
};
export type ListingPage = { items: Card[]; page: number; hasNext: boolean };

export const scopeLabels: Record<Scope, string> = {
  EXPLORE: "Explore", CAMPUS_MATERIALS: "Campus Materials", CAMPUS_MARKETPLACE: "Campus Marketplace",
};
