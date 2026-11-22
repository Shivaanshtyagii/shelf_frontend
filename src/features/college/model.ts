export type Institution = { id: string; name: string };
export type Course = { id: string; code: string; name: string };
export type RequestKind = "INSTITUTION" | "COURSE" | "AFFILIATION";
export type DirectoryRequest = {
  id: string; memberId: string; kind: RequestKind; institutionId: string | null;
  name: string | null; detail: string | null; status: "PENDING" | "APPROVED" | "REJECTED";
};
