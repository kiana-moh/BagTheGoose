import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function getCurrentUser() {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? undefined,
    name: user.name ?? undefined
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}
