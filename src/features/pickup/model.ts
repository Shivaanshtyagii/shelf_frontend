export type PickupStatus = "REQUESTED" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "COLLECTED";
export type Pickup = {
  id: string; listingId: string; buyerId: string; sellerId: string; status: PickupStatus;
  listingTitle: string; meetingLocation: string | null; meetingTime: string | null;
};
