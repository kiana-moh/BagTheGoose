import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createBackendAuthHeaders } from "@/lib/backend-auth";
import { BACKEND_BASE_URL } from "@/lib/constants";

const analyzeSchema = z.object({
  latexContent: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = analyzeSchema.parse(await request.json());
    const response = await fetch(`${BACKEND_BASE_URL}/api/v1/ai/resume/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...createBackendAuthHeaders(user)
      },
      body: JSON.stringify({
        latexResume: body.latexContent
      }),
      cache: "no-store"
    });

    const payload = await response.text();

    if (!response.ok) {
      return new NextResponse(payload, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("content-type") ?? "application/json"
        }
      });
    }

    const analysis = JSON.parse(payload) as {
      skills?: string[];
      rolePatterns?: string[];
      candidateSummary?: string;
    };

    return NextResponse.json({
      skills: analysis.skills ?? [],
      inferred_roles: analysis.rolePatterns ?? [],
      experience_summary: analysis.candidateSummary ?? ""
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }

    return NextResponse.json({ error: "Resume analysis failed." }, { status: 500 });
  }
}
