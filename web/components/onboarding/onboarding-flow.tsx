"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/ui/page-shell";
import { ErrorPanel, LoadingPanel } from "@/components/ui/state-panels";
import { Textarea } from "@/components/ui/textarea";
import { useOnboarding, useSaveOnboarding } from "@/hooks/use-onboarding";
import { useProfile } from "@/hooks/use-profile";
import type { OnboardingData } from "@/lib/types";
import { toOnboardingPayload } from "@/lib/onboarding-payloads";
import {
  onboardingBasicsSchema,
  onboardingPreferencesSchema,
  onboardingTrackerSchema
} from "@/lib/validators/onboarding";

const stepLabels = [
  "Academic basics",
  "Job preferences",
  "Skills review",
  "Resume confirmation",
  "Tracker setup"
];

export function OnboardingFlow() {
  const onboardingQuery = useOnboarding();
  const profileQuery = useProfile();
  const saveOnboarding = useSaveOnboarding();
  const [localStep, setLocalStep] = useState<number | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  if (onboardingQuery.isLoading || profileQuery.isLoading) {
    return <LoadingPanel title="Loading onboarding…" />;
  }

  if (onboardingQuery.isError || profileQuery.isError || !profileQuery.data) {
    return (
      <ErrorPanel
        title="Onboarding failed to load"
        description="The onboarding record could not be loaded from the backend."
      />
    );
  }

  const onboarding = onboardingQuery.data;
  if (!onboarding) {
    return (
      <ErrorPanel
        title="Onboarding failed to load"
        description="The onboarding endpoint did not return a usable record."
      />
    );
  }

  const step = localStep ?? onboarding.currentStep;

  const updateDraft = (updater: (current: OnboardingData) => OnboardingData) => {
    const next = updater(onboarding);
    void saveOnboarding.mutateAsync(toOnboardingPayload(next));
  };

  const moveStep = (direction: -1 | 1) => {
    if (direction === 1) {
      const validation = validateStep(onboarding, step);
      if (!validation.success) {
        setStepError(validation.error);
        return;
      }
    }

    setStepError(null);
    const nextStep = Math.max(1, Math.min(stepLabels.length, step + direction));
    setLocalStep(nextStep);
    updateDraft((current) => ({
      ...current,
      currentStep: nextStep,
      completed: nextStep === stepLabels.length && current.resumeConfirmed
    }));
  };

  const completeFlow = () => {
    const validation = validateStep(onboarding, stepLabels.length);
    if (!validation.success) {
      setStepError(validation.error);
      return;
    }

    setStepError(null);
    updateDraft((current) => ({
      ...current,
      currentStep: stepLabels.length,
      completed: true
    }));
  };

  return (
    <PageShell
      title="Onboarding"
      description="Collect the minimum structured context the backend needs before the dashboard takes over."
    >
      <div className="grid gap-4 xl:grid-cols-[0.78fr,1.22fr]">
        <Card>
          <CardHeader title="Progress" description="Five steps. Persistent. Minimal." />
          <CardContent className="space-y-3">
            {stepLabels.map((label, index) => {
              const stepNumber = index + 1;
              const active = step === stepNumber;
              const completed = onboarding.currentStep > stepNumber || onboarding.completed;

              return (
                <div
                  key={label}
                  className={[
                    "rounded-2xl border px-4 py-4 transition",
                    active
                      ? "border-[#ead9a1] bg-[#fcf4da]"
                      : completed
                        ? "border-emerald-100 bg-emerald-50"
                        : "border-shell bg-white"
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Step {stepNumber}</p>
                      <p className="mt-1 font-medium tracking-[-0.02em] text-ink-950">{label}</p>
                    </div>
                    <Badge tone={active ? "accent" : completed ? "success" : "neutral"}>
                      {active ? "Active" : completed ? "Done" : "Pending"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title={stepLabels[step - 1]} description="Progress persists to the backend as you move." />
          <CardContent className="space-y-5">
            {stepError ? <ErrorPanel title="Step incomplete" description={stepError} /> : null}

            {step === 1 ? (
              <BasicsStep
                onboarding={onboarding}
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    basics: {
                      ...current.basics,
                      ...value
                    }
                  }))
                }
              />
            ) : null}

            {step === 2 ? (
              <PreferencesStep
                onboarding={onboarding}
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    preferences: {
                      ...current.preferences,
                      ...value
                    }
                  }))
                }
              />
            ) : null}

            {step === 3 ? (
              <SkillsReviewStep
                onboarding={onboarding}
                inferredSkills={profileQuery.data.skillsSummary.opportunityClusters}
              />
            ) : null}

            {step === 4 ? (
              <ResumeConfirmStep
                onboarding={onboarding}
                onConfirm={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    resumeConfirmed: value
                  }))
                }
              />
            ) : null}

            {step === 5 ? (
              <TrackerSetupStep
                onboarding={onboarding}
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    trackerSetup: {
                      ...current.trackerSetup,
                      ...value
                    }
                  }))
                }
              />
            ) : null}

            <div className="flex flex-wrap justify-between gap-3 border-t border-shell pt-4">
              <Button disabled={step === 1} onClick={() => moveStep(-1)} type="button" variant="secondary">
                Back
              </Button>
              {step < stepLabels.length ? (
                <Button onClick={() => moveStep(1)} type="button">
                  Next step
                </Button>
              ) : (
                <Button onClick={completeFlow} type="button">
                  Finish onboarding
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function validateStep(onboarding: OnboardingData, step: number) {
  if (step === 1) {
    const result = onboardingBasicsSchema.safeParse(onboarding.basics);
    return result.success
      ? { success: true as const }
      : { success: false as const, error: result.error.issues[0]?.message || "Complete this step." };
  }

  if (step === 2) {
    const result = onboardingPreferencesSchema.safeParse(onboarding.preferences);
    return result.success
      ? { success: true as const }
      : { success: false as const, error: result.error.issues[0]?.message || "Complete this step." };
  }

  if (step === 4 && !onboarding.resumeConfirmed) {
    return {
      success: false as const,
      error: "Confirm the LaTeX resume source before continuing."
    };
  }

  if (step === 5) {
    const result = onboardingTrackerSchema.safeParse(onboarding.trackerSetup);
    return result.success
      ? { success: true as const }
      : { success: false as const, error: result.error.issues[0]?.message || "Complete this step." };
  }

  return { success: true as const };
}

function BasicsStep({
  onboarding,
  onChange
}: {
  onboarding: OnboardingData;
  onChange: (value: Partial<OnboardingData["basics"]>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="School">
        <Input defaultValue={onboarding.basics.school} onBlur={(event) => onChange({ school: event.target.value })} />
      </Field>
      <Field label="Program">
        <Input defaultValue={onboarding.basics.program} onBlur={(event) => onChange({ program: event.target.value })} />
      </Field>
      <Field label="Graduation year">
        <Input defaultValue={onboarding.basics.graduationYear} onBlur={(event) => onChange({ graduationYear: event.target.value })} />
      </Field>
      <Field label="Work authorization">
        <Input defaultValue={onboarding.basics.workAuthorization} onBlur={(event) => onChange({ workAuthorization: event.target.value })} />
      </Field>
    </div>
  );
}

function PreferencesStep({
  onboarding,
  onChange
}: {
  onboarding: OnboardingData;
  onChange: (value: Partial<OnboardingData["preferences"]>) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Target roles">
        <Input
          defaultValue={onboarding.preferences.targetRoles.join(", ")}
          onBlur={(event) =>
            onChange({
              targetRoles: event.target.value.split(",").map((item) => item.trim()).filter(Boolean)
            })
          }
        />
      </Field>
      <Field label="Preferred locations">
        <Input
          defaultValue={onboarding.preferences.preferredLocations.join(", ")}
          onBlur={(event) =>
            onChange({
              preferredLocations: event.target.value.split(",").map((item) => item.trim()).filter(Boolean)
            })
          }
        />
      </Field>
      <Field label="Application goal">
        <Textarea
          defaultValue={onboarding.preferences.applicationGoal}
          onBlur={(event) => onChange({ applicationGoal: event.target.value })}
        />
      </Field>
    </div>
  );
}

function SkillsReviewStep({
  onboarding,
  inferredSkills
}: {
  onboarding: OnboardingData;
  inferredSkills: string[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-7 text-muted">
        The backend expands direct resume matches into adjacent opportunity clusters. Review the surfaced directions before matching broadens.
      </p>
      <div className="flex flex-wrap gap-2">
        {[...new Set([...onboarding.inferredOpportunities, ...inferredSkills])].map((item) => (
          <Badge key={item} tone="accent">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ResumeConfirmStep({
  onboarding,
  onConfirm
}: {
  onboarding: OnboardingData;
  onConfirm: (value: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-7 text-muted">
        Confirm that the stored LaTeX source is the resume the platform should analyze, score against jobs, and tailor from.
      </p>
      <Button onClick={() => onConfirm(!onboarding.resumeConfirmed)} type="button" variant="secondary">
        {onboarding.resumeConfirmed ? "Resume confirmed" : "Confirm resume source"}
      </Button>
    </div>
  );
}

function TrackerSetupStep({
  onboarding,
  onChange
}: {
  onboarding: OnboardingData;
  onChange: (value: Partial<OnboardingData["trackerSetup"]>) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Default tracker statuses">
        <Input
          defaultValue={onboarding.trackerSetup.defaultStatuses.join(", ")}
          onBlur={(event) =>
            onChange({
              defaultStatuses: event.target.value.split(",").map((item) => item.trim()).filter(Boolean)
            })
          }
        />
      </Field>
      <label className="flex items-center gap-3 rounded-2xl border border-shell bg-white px-4 py-3 text-sm text-[#4f4c45]">
        <input
          defaultChecked={onboarding.trackerSetup.deadlineReminder}
          type="checkbox"
          onChange={(event) => onChange({ deadlineReminder: event.target.checked })}
        />
        Enable default deadline reminders
      </label>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
