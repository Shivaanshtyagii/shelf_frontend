export type Scope = "EXPLORE" | "CAMPUS_MATERIALS" | "CAMPUS_MARKETPLACE";
export type ListingStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
export type Member = { id: string; email: string; displayName: string; verified: boolean; role: "MEMBER" | "MODERATOR" };
export type Card = {
  id: string; scope: Scope; title: string; description: string; subject: string; priceMinor: number;
  publishedAt: string | null;
};
export type Listing = Card & {
  ownerId: string; institutionId: string | null; assetId: string | null; status: ListingStatus; revision: number;
};
export type ListingPage = { items: Card[]; page: number; hasNext: boolean };
export type Institution = { id: string; name: string };
export type Course = { id: string; code: string; name: string };
export type RequestKind = "INSTITUTION" | "COURSE" | "AFFILIATION";
export type DirectoryRequest = {
  id: string; memberId: string; kind: RequestKind; institutionId: string | null;
  name: string | null; detail: string | null; status: "PENDING" | "APPROVED" | "REJECTED";
};
export type Capabilities = { assets: boolean; digitalCommerce: boolean };
export type PickupStatus = "REQUESTED" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "COLLECTED";
export type Pickup = {
  id: string; listingId: string; buyerId: string; sellerId: string; status: PickupStatus;
  listingTitle: string; meetingLocation: string | null; meetingTime: string | null;
};
export type Decision = { id: number; outcome: string; reason: string; createdAt: string };
export type Report = { id: string; listingId: string; reason: string; status: string; response: string | null };
export type Appeal = { id: string; decisionId: number; reason: string; status: string; response: string | null };
export type ModerationQueue = { listings: Listing[]; sellers: string[]; reports: Report[]; appeals: Appeal[] };
export type Commerce = {
  enabled: boolean; platformCommissionMinor: number;
  ledger: { reference: string; status: string; amountMinor: number; currency: string }[];
  payouts: { reference: string; status: string; amountMinor: number; currency: string }[];
};

export const scopeLabels: Record<Scope, string> = {
  EXPLORE: "Explore", CAMPUS_MATERIALS: "Campus Materials", CAMPUS_MARKETPLACE: "Campus Marketplace",
};

export function statusLabel(status: string) {
  return status.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function price(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value / 100);
}
