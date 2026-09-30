import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import prisma from "@UniSphere_cor/db";
import bcrypt from "bcrypt";

describe("E2E Auth Flow", () => {
  let testUser: any;
  let refreshTokenCookie = "";

  beforeAll(async () => {
    // Clear out test user if exists
    const existingUser = await prisma.user.findUnique({ where: { email: "testauth@example.com" } });
    if (existingUser) {
      await prisma.userSession.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    const passwordHash = await bcrypt.hash("InitialTempPassword123!", 10);

    testUser = await prisma.user.create({
      data: {
        email: "testauth@example.com",
        passwordHash,
        name: "Test Auth User",
        phone: "9999999999",
        role: "STUDENT",
        mustChangePassword: true,
        studentProfile: {
          enrollmentNo: "21BCE999",
          branch: "BCA",
          batchYear: 2021,
          semester: 1,
          classDivision: "A"
        },
        departmentId: (await prisma.department.findFirst())?.id || "5f8f8c44b54764421b7156d3"
      }
    });
  });

  afterAll(async () => {
    await prisma.userSession.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.deleteMany({ where: { id: testUser.id } });
  });

  it("should fail login with old password when mustChangePassword is true", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "testauth@example.com", password: "wrongpassword" });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should activate a newly imported CSV student successfully via PW change", async () => {
    const res = await request(app)
      .post("/api/v1/auth/activate-account")
      .send({
        email: "testauth@example.com",
        temporaryPassword: "InitialTempPassword123!",
        newPassword: "NewSecurePassword456!",
        confirmPassword: "NewSecurePassword456!"
      });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ACTIVATED");

    const user = await prisma.user.findUnique({ where: { email: "testauth@example.com" }});
    expect(user?.mustChangePassword).toBe(false);
  });

  it("should issue access & refresh tokens on success", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "testauth@example.com", password: "NewSecurePassword456!" });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    refreshTokenCookie = res.body.data.refreshToken;
  });

  it("should successfully fetch /me using the access token", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "testauth@example.com", password: "NewSecurePassword456!" });
    const token = loginRes.body.data.accessToken;

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("testauth@example.com");
  });

  it("should issue a new token pair using the valid refresh token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: refreshTokenCookie });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(refreshTokenCookie);
    
    refreshTokenCookie = res.body.data.refreshToken;
  });

  it("should reject token refresh with the old (rotated) token", async () => {
    const revokedToken = refreshTokenCookie;
    
    // First refresh to rotate it
    await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: revokedToken });
      
    // Try refreshing again with the old token
    const failRes = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: revokedToken });

    expect(failRes.status).toBe(401);
    expect(failRes.body.success).toBe(false);
  });

  it("should successfully logout and clear the token", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "testauth@example.com", password: "NewSecurePassword456!" });
    const token = loginRes.body.data.refreshToken;

    const res = await request(app)
      .post("/api/v1/auth/logout")
      .send({ refreshToken: token });

    expect(res.status).toBe(200);

    const failRes = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: token });

    expect(failRes.status).toBe(401);
  });
});
