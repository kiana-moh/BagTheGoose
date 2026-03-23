import { createHmac } from "node:crypto";
import type { AuthUser } from "@/lib/types";

export function createBackendAuthHeaders(user: AuthUser) {
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    throw new Error("AUTH_SECRET is required for authenticated backend proxying.");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const email = user.email ?? "";
  const payload = `${user.id}:${email}:${timestamp}`;
  const signature = createHmac("sha256", authSecret).update(payload).digest("hex");

  return {
    "x-btg-auth-user-id": user.id,
    "x-btg-auth-user-email": email,
    "x-btg-auth-timestamp": timestamp,
    "x-btg-auth-signature": signature
  };
}
