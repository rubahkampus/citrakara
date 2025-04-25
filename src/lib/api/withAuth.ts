// src/lib/api/withAuth.ts
import { getAuthSession } from "@/lib/utils/session";
export async function withAuth<T>(fn: (session: any) => Promise<T>) {
  const session = await getAuthSession();
  if (!session || typeof session === "string")
    throw Object.assign(new Error("Unauthorized"), { code: 401 });
  return fn(session);
}