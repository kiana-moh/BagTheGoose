import { AuthCard } from "./auth-card";
import { SignupForm } from "./auth-form";

export function SignupView() {
  return (
    <AuthCard
      title="Create your account"
      description="Start with your resume, finish setup, and move into a cleaner workflow for job discovery and application tracking."
      footerLabel="Sign in"
      footerLink="/login"
      footerText="Already have an account?"
    >
      <SignupForm />
    </AuthCard>
  );
}
