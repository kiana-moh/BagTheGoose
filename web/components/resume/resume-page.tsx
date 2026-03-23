"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileCode2, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/ui/page-shell";
import { ErrorPanel, LoadingPanel } from "@/components/ui/state-panels";
import { Textarea } from "@/components/ui/textarea";
import { useResume, useSubmitResume } from "@/hooks/use-resume";
import { resumeSchema, type ResumeFormValues } from "@/lib/validators/resume";

const statusTone = {
  idle: "neutral",
  editing: "accent",
  uploading: "warning",
  processing: "warning",
  ready: "success",
  error: "danger"
} as const;

export function ResumePage() {
  const resumeQuery = useResume();
  const saveResume = useSubmitResume();
  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      latexContent: ""
    }
  });

  useEffect(() => {
    if (resumeQuery.data?.latexContent) {
      form.reset({
        latexContent: resumeQuery.data.latexContent
      });
    }
  }, [form, resumeQuery.data?.latexContent]);

  if (resumeQuery.isLoading) {
    return <LoadingPanel title="Loading your resume workspace…" />;
  }

  if (resumeQuery.isError) {
    return (
      <ErrorPanel
        title="Resume failed to load"
        description={resumeQuery.error instanceof Error ? resumeQuery.error.message : "Try again."}
      />
    );
  }

  const resume = resumeQuery.data;
  const status = saveResume.isPending ? "processing" : resume?.status ?? "idle";

  const onSubmit = form.handleSubmit(async (values) => {
    await saveResume.mutateAsync({
      latexContent: values.latexContent,
      sourceType: "pasted"
    });
  });

  return (
    <PageShell
      title="Resume"
      description="LaTeX is the canonical resume source in V1. That constraint keeps parsing, scoring, and truthful tailoring stable downstream."
      actions={<Badge tone={statusTone[status]}>{status}</Badge>}
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader
            title="Paste LaTeX"
            description="Use the exact source you maintain as your resume. No preview layer, no PDF upload, no rich-text editor."
          />
          <CardContent>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="latexContent">LaTeX source</Label>
                <Textarea
                  id="latexContent"
                  className="mt-2 min-h-[520px] font-mono text-[13px]"
                  placeholder={"\\section{Education}\n\\section{Experience}\n\\begin{itemize}\n  \\item Built...\n\\end{itemize}"}
                  {...form.register("latexContent")}
                />
                {form.formState.errors.latexContent ? (
                  <p className="mt-2 text-sm text-rose-600">{form.formState.errors.latexContent.message}</p>
                ) : null}
              </div>

              {saveResume.isError ? (
                <ErrorPanel
                  title="Resume processing failed"
                  description={saveResume.error instanceof Error ? saveResume.error.message : "Try again."}
                />
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-shell pt-4">
                <p className="max-w-[520px] text-sm leading-6 text-muted">
                  The backend receives this as canonical <code>latexContent</code> and runs the first structured analysis from that source.
                </p>
                <Button disabled={saveResume.isPending} type="submit">
                  {saveResume.isPending ? "Processing source…" : "Save and analyze"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="State" description="Current resume ingestion and analysis readiness." />
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-shell bg-[#faf7ef] px-4 py-4">
                <FileCode2 className="mt-0.5 h-5 w-5 text-[#866712]" />
                <div>
                  <p className="font-medium tracking-[-0.02em] text-ink-950">LaTeX-first pipeline</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Resume ingestion is intentionally constrained to structured source text.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-shell bg-white px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Current status</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[22px] font-semibold tracking-[-0.04em] text-ink-950">{status}</p>
                  <Badge tone={statusTone[status]}>{status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Extracted metadata"
              description="Structured signals produced from the canonical resume source."
            />
            <CardContent className="space-y-5">
              {resume?.extractedMetadata ? (
                <>
                  <Meta label="Degree level" value={resume.extractedMetadata.degreeLevel ?? "Unknown"} />
                  <Meta label="Major" value={resume.extractedMetadata.majors?.join(", ") ?? "Unknown"} />
                  <Meta
                    label="Graduation year"
                    value={resume.extractedMetadata.graduationYear?.toString() ?? "Unknown"}
                  />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Skills surfaced</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {resume.extractedMetadata.skills?.map((skill) => (
                        <Badge key={skill} tone="accent">
                          <Sparkles className="mr-1 h-3.5 w-3.5" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm leading-6 text-muted">
                  Degree level, majors, graduation year, and skill clusters will appear here once the backend finishes analysis.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink-950">{value}</p>
    </div>
  );
}
