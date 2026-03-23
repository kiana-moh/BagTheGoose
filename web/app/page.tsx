import { redirect } from "next/navigation";
import { getRequiredProtectedPath } from "@/lib/navigation";
import { getServerAppSnapshot } from "@/lib/api/server";

export default async function HomePage() {
  const snapshot = await getServerAppSnapshot();
  redirect(snapshot.sessionUser ? getRequiredProtectedPath(snapshot) : "/login");
}
