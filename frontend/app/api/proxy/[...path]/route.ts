import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPSTREAM = (process.env.API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
// Server-side only: never exposed to the browser.
const API_KEY = process.env.API_KEY || "";

function targetUrl(req: NextRequest, segments: string[]) {
  const u = new URL(req.url);
  const path = segments.join("/");
  return `${UPSTREAM}/${path}${u.search}`;
}

async function proxy(req: NextRequest, segments: string[]) {
  const url = targetUrl(req, segments);
  const h = new Headers();
  const ct = req.headers.get("content-type");
  if (ct) h.set("content-type", ct);
  if (API_KEY) h.set("x-api-key", API_KEY);
  const accept = req.headers.get("accept");
  if (accept) h.set("accept", accept);

  const method = req.method;
  let body: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  const res = await fetch(url, {
    method,
    headers: h,
    body: body && body.byteLength ? body : undefined,
    cache: "no-store",
  });

  const out = new Headers();
  for (const name of ["content-type", "content-disposition"]) {
    const v = res.headers.get(name);
    if (v) out.set(name, v);
  }

  const buf = await res.arrayBuffer();
  return new NextResponse(buf, { status: res.status, headers: out });
}

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}
