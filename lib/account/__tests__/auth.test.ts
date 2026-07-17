import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, sendStoreEmailMock } = vi.hoisted(() => {
  const prismaMock = {
    customerAccount: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    customerAccountToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    customerSession: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  };

  return {
    prisma: prismaMock,
    sendStoreEmailMock: vi.fn(async () => ({ status: "skipped" as const, reason: "test" })),
  };
});

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => prisma,
}));

vi.mock("@/lib/account/config", () => ({
  isCustomerAccountEnabled: () => true,
  isAccountDevSeedAllowed: () => false,
  isProductionRuntime: () => false,
}));

vi.mock("@/lib/store/email", () => ({
  sendStoreEmail: sendStoreEmailMock,
}));

import {
  assertPasswordsMatch,
  changeCustomerPassword,
  hashPassword,
  registerCustomer,
  requestPasswordReset,
  resetCustomerPassword,
  verifyCustomerEmail,
  verifyPassword,
} from "@/lib/account/auth";

beforeEach(() => {
  vi.clearAllMocks();
  prisma.$transaction.mockImplementation(async (operations: Promise<unknown>[]) => Promise.all(operations));
  prisma.customerAccount.create.mockImplementation(async ({ data }) => ({ ...data, id: data.id ?? "cust_test" }));
  prisma.customerAccount.update.mockImplementation(async ({ data }) => data);
  prisma.customerAccountToken.update.mockImplementation(async ({ data }) => data);
  prisma.customerAccountToken.updateMany.mockResolvedValue({ count: 1 });
  prisma.customerAccountToken.create.mockImplementation(async ({ data }) => data);
  prisma.customerSession.deleteMany.mockResolvedValue({ count: 1 });
});

describe("customer account auth", () => {
  it("hashes passwords and verifies only the original password", async () => {
    const hash = await hashPassword("GarconmairesTest2026!");

    expect(hash).toMatch(/^scrypt:/);
    expect(await verifyPassword("GarconmairesTest2026!", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("normalizes e-mail and keeps marketing consent optional on registration", async () => {
    await registerCustomer({
      firstName: "Magda",
      lastName: "Client",
      email: "  TEST@EXAMPLE.COM ",
      password: "GarconmairesTest2026!",
      passwordConfirmation: "GarconmairesTest2026!",
    });

    expect(prisma.customerAccount.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "test@example.com",
        firstName: "Magda",
        lastName: "Client",
        marketingConsent: false,
      }),
    });
    const created = prisma.customerAccount.create.mock.calls[0][0].data;
    expect(created.passwordHash).not.toBe("GarconmairesTest2026!");
  });

  it("rejects mismatched registration passwords before creating an account", async () => {
    await expect(
      registerCustomer({
        firstName: "Magda",
        lastName: "Client",
        email: "test@example.com",
        password: "GarconmairesTest2026!",
        passwordConfirmation: "DifferentTest2026!",
      }),
    ).rejects.toThrow("Passwords do not match.");

    expect(prisma.customerAccount.create).not.toHaveBeenCalled();
  });

  it("maps duplicate account writes to a controlled error", async () => {
    prisma.customerAccount.create.mockRejectedValueOnce(new Error("Unique constraint failed on the fields: (`email`)"));

    await expect(
      registerCustomer({
        firstName: "Magda",
        lastName: "Client",
        email: "test@example.com",
        password: "GarconmairesTest2026!",
      }),
    ).rejects.toThrow("Account already exists.");
  });

  it("marks a valid verification token as used and verifies the account", async () => {
    prisma.customerAccountToken.findUnique.mockResolvedValueOnce({
      id: "token_1",
      customerId: "cust_1",
      type: "email_verification",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      customer: { status: "active", emailVerifiedAt: null },
    });

    await verifyCustomerEmail("plain-token");

    expect(prisma.customerAccount.update).toHaveBeenCalledWith({
      where: { id: "cust_1" },
      data: { emailVerifiedAt: expect.any(Date) },
    });
    expect(prisma.customerAccountToken.update).toHaveBeenCalledWith({
      where: { id: "token_1" },
      data: { usedAt: expect.any(Date) },
    });
  });

  it("rejects expired and reused verification tokens", async () => {
    prisma.customerAccountToken.findUnique.mockResolvedValueOnce({
      type: "email_verification",
      usedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
      customer: { status: "active", emailVerifiedAt: null },
    });

    await expect(verifyCustomerEmail("expired")).rejects.toThrow("Verification token has expired.");

    prisma.customerAccountToken.findUnique.mockResolvedValueOnce({
      type: "email_verification",
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      customer: { status: "active", emailVerifiedAt: null },
    });

    await expect(verifyCustomerEmail("used")).rejects.toThrow("Verification token has already been used.");
  });

  it("resets an unverified account password, verifies the email and invalidates account tokens", async () => {
    prisma.customerAccountToken.findUnique.mockResolvedValueOnce({
      id: "reset_1",
      customerId: "cust_1",
      type: "password_reset",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      customer: {
        status: "active",
        email: "client@example.com",
        firstName: "Client",
        emailVerifiedAt: null,
      },
    });

    await resetCustomerPassword({
      token: "reset-token",
      password: "GarconmairesNew2026!",
      passwordConfirmation: "GarconmairesNew2026!",
    });

    expect(prisma.customerAccount.update).toHaveBeenCalledWith({
      where: { id: "cust_1" },
      data: {
        passwordHash: expect.stringMatching(/^scrypt:/),
        emailVerifiedAt: expect.any(Date),
      },
    });
    expect(prisma.customerAccountToken.updateMany).toHaveBeenCalledWith({
      where: {
        customerId: "cust_1",
        type: { in: ["password_reset", "email_verification"] },
        usedAt: null,
      },
      data: { usedAt: expect.any(Date) },
    });
    expect(prisma.customerSession.deleteMany).toHaveBeenCalledWith({ where: { customerId: "cust_1" } });
    expect(sendStoreEmailMock).toHaveBeenCalledWith("password_changed", expect.any(Object));
  });

  it("resets an already verified account password without changing the existing verification date", async () => {
    const verifiedAt = new Date("2026-07-01T12:00:00.000Z");
    prisma.customerAccountToken.findUnique.mockResolvedValueOnce({
      id: "reset_1",
      customerId: "cust_1",
      type: "password_reset",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      customer: {
        status: "active",
        email: "client@example.com",
        firstName: "Client",
        emailVerifiedAt: verifiedAt,
      },
    });

    await resetCustomerPassword({
      token: "reset-token",
      password: "GarconmairesNew2026!",
      passwordConfirmation: "GarconmairesNew2026!",
    });

    expect(prisma.customerAccount.update).toHaveBeenCalledWith({
      where: { id: "cust_1" },
      data: { passwordHash: expect.stringMatching(/^scrypt:/) },
    });
    expect(prisma.customerAccount.update.mock.calls[0][0].data).not.toHaveProperty("emailVerifiedAt");
  });

  it("does not verify an account when only requesting a password reset", async () => {
    prisma.customerAccount.findUnique.mockResolvedValueOnce({
      id: "cust_1",
      status: "active",
      email: "client@example.com",
      firstName: "Client",
      emailVerifiedAt: null,
    });

    await requestPasswordReset({
      email: "client@example.com",
      baseUrl: "https://garconmaires.test",
      locale: "pl",
    });

    expect(prisma.customerAccount.update).not.toHaveBeenCalled();
    expect(prisma.customerAccountToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: "cust_1",
        type: "password_reset",
      }),
    });
  });

  it("does not mutate account data for invalid or expired reset tokens", async () => {
    prisma.customerAccountToken.findUnique.mockResolvedValueOnce(null);

    await expect(
      resetCustomerPassword({
        token: "invalid-token",
        password: "GarconmairesNew2026!",
        passwordConfirmation: "GarconmairesNew2026!",
      }),
    ).rejects.toThrow("Invalid reset token.");

    expect(prisma.customerAccount.update).not.toHaveBeenCalled();
    expect(prisma.customerAccountToken.updateMany).not.toHaveBeenCalled();
    expect(prisma.customerSession.deleteMany).not.toHaveBeenCalled();

    vi.clearAllMocks();
    prisma.customerAccountToken.findUnique.mockResolvedValueOnce({
      id: "reset_1",
      customerId: "cust_1",
      type: "password_reset",
      usedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
      customer: {
        status: "active",
        email: "client@example.com",
        firstName: "Client",
        emailVerifiedAt: null,
      },
    });

    await expect(
      resetCustomerPassword({
        token: "expired-token",
        password: "GarconmairesNew2026!",
        passwordConfirmation: "GarconmairesNew2026!",
      }),
    ).rejects.toThrow("Reset token has expired.");

    expect(prisma.customerAccount.update).not.toHaveBeenCalled();
    expect(prisma.customerAccountToken.updateMany).not.toHaveBeenCalled();
    expect(prisma.customerSession.deleteMany).not.toHaveBeenCalled();
  });

  it("changes password only when the current password is valid", async () => {
    const oldHash = await hashPassword("GarconmairesOld2026!");
    prisma.customerAccount.findUnique.mockResolvedValueOnce({
      id: "cust_1",
      status: "active",
      email: "client@example.com",
      firstName: "Client",
      passwordHash: oldHash,
    });

    await changeCustomerPassword("cust_1", {
      currentPassword: "GarconmairesOld2026!",
      newPassword: "GarconmairesNew2026!",
      newPasswordConfirmation: "GarconmairesNew2026!",
      logoutOtherSessions: true,
      currentSessionToken: "current-session",
    });

    expect(prisma.customerAccount.update).toHaveBeenCalledWith({
      where: { id: "cust_1" },
      data: { passwordHash: expect.stringMatching(/^scrypt:/) },
    });
    expect(prisma.customerSession.deleteMany).toHaveBeenCalledWith({
      where: {
        customerId: "cust_1",
        tokenHash: { not: expect.any(String) },
      },
    });
  });

  it("rejects mismatched password confirmation", () => {
    expect(() => assertPasswordsMatch("one-password", "another-password")).toThrow("Passwords do not match.");
  });
});
