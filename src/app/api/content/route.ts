import { NextRequest, NextResponse } from "next/server";
import { getSiteContent, setJobs, setLocations } from "@/lib/site-content-store";
import type { JobItem, LocationItem } from "@/lib/site-content";

export async function GET() {
  const content = await getSiteContent();
  return NextResponse.json(content);
}

export async function PUT(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  const token = req.headers.get("x-admin-token");

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    jobs?: JobItem[];
    locations?: LocationItem[];
  } | null;

  if (!body || (!Array.isArray(body.jobs) && !Array.isArray(body.locations))) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  let content = await getSiteContent();
  if (Array.isArray(body.jobs)) content = await setJobs(body.jobs);
  if (Array.isArray(body.locations)) content = await setLocations(body.locations);

  return NextResponse.json(content);
}
