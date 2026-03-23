"use client";

import { GoogleSignInButton } from "./google-sign-in-button";

export function LoginForm() {
  return (
    <div className="space-y-4">
      <GoogleSignInButton mode="login" />
    </div>
  );
}

export function SignupForm() {
  return (
    <div className="space-y-4">
      <GoogleSignInButton mode="signup" />
    </div>
  );
}
