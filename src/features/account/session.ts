import { api, ApiError } from "@/lib/api";
import type { Member } from "./model";

export async function currentMember(signal?: AbortSignal): Promise<Member | undefined> {
  try {
    return await api<Member>("/auth/me", { signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return undefined;
    throw error;
  }
}
