import { NextResponse } from "next/server";
import { getRepository } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Lightweight list for the command palette's "jump to workflow" search. */
export async function GET() {
  const repo = await getRepository();
  const workflows = await repo.listWorkflows();
  return NextResponse.json(
    workflows.map((w) => ({ id: w.id, title: w.title, status: w.status })),
  );
}
