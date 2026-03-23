import { AuthCard } from "./auth-card";
import { LoginForm } from "./auth-form";

export function LoginView() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to manage your LaTeX resume, opportunity targeting, and application tracking in one focused workspace."
      footerLabel="Create an account"
      footerLink="/signup"
      footerText="New here?"
    >
      <LoginForm />
    </AuthCard>
  );
}
