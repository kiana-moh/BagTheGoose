"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { ErrorPanel, LoadingPanel } from "@/components/ui/state-panels";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useSubmitResume } from "@/hooks/use-resume";

export function ProfilePage() {
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const submitResume = useSubmitResume();
  const [nameDraft, setNameDraft] = useState("");
  const [resumeDraft, setResumeDraft] = useState("");

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setNameDraft(profileQuery.data.user.name || "");
    setResumeDraft(profileQuery.data.resume?.latexContent || "");
  }, [profileQuery.data]);

  if (profileQuery.isLoading) {
    return <LoadingPanel title="Loading profile…" />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ErrorPanel
        title="Profile failed to load"
        description="The profile endpoint did not return a usable user record."
      />
    );
  }

  const profile = profileQuery.data;

  return (
    <PageShell
      title="Profile"
      description="The persistent source of truth for identity, academic context, targeting preferences, and resume assets."
      actions={
        <Button
          disabled={updateProfile.isPending}
          onClick={() => {
            void updateProfile.mutateAsync({
              user: { name: nameDraft }
            });
          }}
          variant="secondary"
        >
          {updateProfile.isPending ? "Saving…" : "Save profile"}
        </Button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Basic info" description="Core account identity resolved from authenticated ownership." />
            <CardContent className="space-y-4">
              <Field label="Name">
                <Input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} />
              </Field>
              <InfoRow label="Email" value={profile.user.email ?? "No email"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Academic info" description="Structured data used in targeting and fit analysis." />
            <CardContent className="space-y-3">
              <InfoRow label="School" value={profile.academicInfo.school || "Not set"} />
              <InfoRow label="Program" value={profile.academicInfo.program || "Not set"} />
              <InfoRow label="Degree" value={profile.academicInfo.degreeLevel || "Not set"} />
              <InfoRow label="Graduation year" value={profile.academicInfo.graduationYear || "Not set"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Targeting" description="Current preferences used to shape scraping and downstream evaluation." />
            <CardContent className="space-y-5">
              <TagGroup label="Target roles" values={profile.jobPreferences.targetRoles} />
              <TagGroup label="Preferred locations" values={profile.jobPreferences.preferredLocations} />
              <TagGroup label="Work modes" values={profile.jobPreferences.workModes} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Resume assets"
              description="Replace the stored LaTeX source here. Updating it re-runs resume analysis against the canonical source."
              action={<Badge tone={profile.resume ? "success" : "warning"}>{profile.resume ? profile.resume.status : "missing"}</Badge>}
            />
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted">
                {profile.resume
                  ? "The current account already has a canonical LaTeX resume stored."
                  : "No LaTeX source is stored yet for this account."}
              </p>
              <Field label="Replace LaTeX source">
                <Textarea
                  className="min-h-[300px] font-mono text-[13px]"
                  value={resumeDraft}
                  onChange={(event) => setResumeDraft(event.target.value)}
                  placeholder={"\\section{Education}\n\\section{Experience}"}
                />
              </Field>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-shell pt-4">
                <p className="max-w-[460px] text-sm leading-6 text-muted">
                  This writes a new canonical resume record for the authenticated user and refreshes extracted metadata.
                </p>
                <Button
                  disabled={submitResume.isPending || !resumeDraft.trim()}
                  onClick={() => {
                    void submitResume.mutateAsync({
                      latexContent: resumeDraft,
                      sourceType: "pasted"
                    });
                  }}
                >
                  {submitResume.isPending ? "Updating…" : "Update resume"}
                </Button>
              </div>
              {submitResume.isError ? (
                <ErrorPanel
                  title="Resume update failed"
                  description={submitResume.error instanceof Error ? submitResume.error.message : "Try again."}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Skills summary" description="Normalized clusters inferred from resume ingestion." />
            <CardContent className="space-y-5">
              <TagGroup label="Technical skills" values={profile.skillsSummary.technicalSkills} />
              <TagGroup label="Opportunity clusters" values={profile.skillsSummary.opportunityClusters} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Tailoring preferences" description="Future constraints and preferences for resume adaptation." />
            <CardContent className="space-y-3">
              {profile.tailoringPreferences.length > 0 ? (
                profile.tailoringPreferences.map((item) => (
                  <div key={item} className="rounded-2xl border border-shell bg-white px-4 py-3 text-sm leading-6 text-[#4f4c45]">
                    {item}
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted">No tailoring preferences saved yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink-950">{label}</p>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-shell bg-white px-4 py-3">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-sm font-medium text-ink-950">{value}</p>
    </div>
  );
}

function TagGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.length > 0 ? values.map((value) => <Badge key={value} tone="accent">{value}</Badge>) : <p className="text-sm text-muted">Not set</p>}
      </div>
    </div>
  );
}
