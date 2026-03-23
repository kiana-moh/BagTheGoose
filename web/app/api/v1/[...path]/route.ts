import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createBackendAuthHeaders } from "@/lib/backend-auth";
import { BACKEND_BASE_URL } from "@/lib/constants";

async function proxy(request: NextRequest, path: string[]) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body =
      request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();

    const response = await fetch(
      `${BACKEND_BASE_URL}/api/v1/${path.join("/")}${request.nextUrl.search}`,
      {
        method: request.method,
        headers: {
          ...(request.headers.get("origin")
            ? { Origin: request.headers.get("origin") as string }
            : {}),
          ...(body
            ? { "Content-Type": request.headers.get("content-type") ?? "application/json" }
            : {}),
          ...createBackendAuthHeaders(user)
        },
        body,
        cache: "no-store"
      }
    );

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json"
      }
    });
  } catch {
    return NextResponse.json({ error: "Backend proxy request failed." }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}
