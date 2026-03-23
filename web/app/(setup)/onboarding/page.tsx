import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export default function SetupOnboardingPage() {
  return (
    <OnboardingShell>
      <OnboardingFlow />
    </OnboardingShell>
  );
}
