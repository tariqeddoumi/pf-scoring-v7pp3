import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth-middleware";

describe("auth middleware", () => {
  it("rejects unauthenticated request", async () => {
    const request = new NextRequest("http://localhost/api/test", {
      method: "GET",
    });

    const response = await withAuth(request, async () => {
      throw new Error("handler should not be executed");
    });

    expect(response.status).toBe(401);
  });
});
