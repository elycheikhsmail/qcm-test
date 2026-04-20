import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql<{ up: number }[]>`SELECT 1 AS up`;
    const dbUp = rows[0]?.up === 1;
    return NextResponse.json({ ok: true, db: dbUp ? "up" : "down" });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        db: "down",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 503 },
    );
  }
}
