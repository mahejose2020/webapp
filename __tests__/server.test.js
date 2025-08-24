import request from "supertest";
import app from "../server.js"; // export app from server.js

describe("GET /", () => {
  it("should return 200 and contain 'Training Demo App'", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Training Demo App");
  });
});

describe("GET /pod", () => {
  it("should return pod info JSON", async () => {
    const res = await request(app).get("/pod");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("pod");
  });
});