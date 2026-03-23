"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton({ mode }: { mode: "login" | "signup" }) {
  return (
    <div className="space-y-4">
      <Button
        className="w-full text-[15px]"
        onClick={() => {
          void signIn("google", {
            callbackUrl: "/"
          });
        }}
        type="button"
      >
        {mode === "signup" ? "Continue with Google" : "Sign in with Google"}
      </Button>
      <p className="text-center text-xs text-black/45">
        Authentication runs through Google OAuth with Auth.js.
      </p>
    </div>
  );
}
