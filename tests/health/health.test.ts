import request from "supertest";
import app from "../../src/app.js";

describe("Health endpoint", () => {
  it("GET /api/health should respond with service status", async () => {
    const response = await request(app).get("/api/health");

    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty("status");
    expect(response.body).toHaveProperty("timestamp");
  });
});
