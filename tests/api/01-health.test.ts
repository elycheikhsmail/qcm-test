import { describe, it, expect } from "bun:test";
import { api } from "../setup";

describe("GET /api/health", () => {
  it("retourne 200 avec ok=true et db=true", async () => {
    const { status, data } = await api("/api/health");
    expect(status).toBe(200);
    expect((data as any).ok).toBe(true);
    expect((data as any).db).toBe("up");
  });
});
