import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { createId } from "@/lib/store/ids";
import { readStoreDatabase } from "@/lib/store/storage";
import { isCustomerAccountEnabled } from "@/lib/account/config";
import { sendStoreEmail } from "@/lib/store/email";
import type { Complaint, Order, ReturnRequest } from "@/lib/store/types";

const scrypt = promisify(scryptCallback);
const sessionCookieName = "gm_customer_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;

type AddressInput = {
  id?: string;
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  postalCode?: string;
  city?: string;
  country?: string;
  phone?: string | null;
  isDefault?: boolean;
};

function normalizeEmail(email: unknown) {
  return String(email ?? "").trim().toLowerCase();
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function requireText(value: unknown, field: string) {
  const text = cleanText(value);
  if (!text) {
    throw new Error(`Missing field: ${field}`);
  }
  return text;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createActionToken() {
  return randomBytes(32).toString("base64url");
}

function validatePassword(password: string) {
  if (password.length < 10) {
    throw new Error("Password must have at least 10 characters.");
  }
}

export function assertPasswordsMatch(password: unknown, passwordConfirmation: unknown) {
  if (String(password ?? "") !== String(passwordConfirmation ?? "")) {
    throw new Error("Passwords do not match.");
  }
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function getAccountCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  };
}

export async function createCustomerSession(customerId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000);

  await getPrisma().customerSession.create({
    data: {
      id: createId("cust_sess"),
      customerId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function destroyCustomerSession(token: string | undefined) {
  if (!token) {
    return;
  }

  await getPrisma().customerSession.deleteMany({
    where: { tokenHash: hashToken(token) },
  });
}

export async function destroyAllCustomerSessions(customerId: string) {
  await getPrisma().customerSession.deleteMany({ where: { customerId } });
}

export async function cleanupExpiredCustomerSessions() {
  const result = await getPrisma().customerSession.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });

  return result.count;
}

export async function getSessionTokenFromCookies() {
  return (await cookies()).get(sessionCookieName)?.value;
}

export { sessionCookieName };

export async function getCurrentCustomer() {
  if (!isCustomerAccountEnabled()) {
    return null;
  }

  const token = await getSessionTokenFromCookies();
  if (!token) {
    return null;
  }

  const session = await getPrisma().customerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      customer: {
        include: {
          addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
        },
      },
    },
  });

  if (!session || session.expiresAt.getTime() <= Date.now() || session.customer.status !== "active") {
    if (session) {
      await getPrisma().customerSession.deleteMany({ where: { id: session.id } });
    }
    return null;
  }

  return session.customer;
}

export async function registerCustomer(input: {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
  marketingConsent?: boolean;
}) {
  if (!isCustomerAccountEnabled()) {
    throw new Error("Customer account is not enabled.");
  }

  const email = normalizeEmail(input.email);
  const password = String(input.password ?? "");

  if (!email.includes("@")) {
    throw new Error("Invalid e-mail address.");
  }
  validatePassword(password);
  if (input.passwordConfirmation !== undefined) {
    assertPasswordsMatch(password, input.passwordConfirmation);
  }

  try {
    return await getPrisma().customerAccount.create({
      data: {
        id: createId("cust"),
        email,
        passwordHash: await hashPassword(password),
        firstName: requireText(input.firstName, "firstName"),
        lastName: requireText(input.lastName, "lastName"),
        marketingConsent: Boolean(input.marketingConsent),
        status: "active",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint failed")) {
      throw new Error("Account already exists.");
    }
    throw error;
  }
}

function siteUrl(baseUrl: string) {
  return (process.env.NEXT_PUBLIC_SITE_URL || baseUrl).replace(/\/$/, "");
}

function verificationPathForLocale(locale?: "pl" | "en") {
  return locale === "en" ? "/en/account/verification" : "/konto/weryfikacja";
}

function newPasswordPathForLocale(locale?: "pl" | "en") {
  return locale === "en" ? "/en/account/new-password" : "/konto/nowe-haslo";
}

function isDevActionLinkLogAllowed() {
  return process.env.VERCEL_ENV !== "production" && process.env.NODE_ENV !== "production";
}

async function createCustomerActionToken(input: {
  customerId: string;
  type: "email_verification" | "password_reset";
  expiresInMs: number;
}) {
  const token = createActionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + input.expiresInMs);

  await getPrisma().customerAccountToken.updateMany({
    where: {
      customerId: input.customerId,
      type: input.type,
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  await getPrisma().customerAccountToken.create({
    data: {
      id: createId("cust_token"),
      customerId: input.customerId,
      type: input.type,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function sendCustomerVerificationEmail(input: {
  customerId: string;
  baseUrl: string;
  locale?: "pl" | "en";
}) {
  const customer = await getPrisma().customerAccount.findUnique({
    where: { id: input.customerId },
  });

  if (!customer || customer.status !== "active" || customer.emailVerifiedAt) {
    return { sent: false as const };
  }

  const { token } = await createCustomerActionToken({
    customerId: customer.id,
    type: "email_verification",
    expiresInMs: 1000 * 60 * 60 * 24 * 7,
  });
  const actionUrl = `${siteUrl(input.baseUrl)}${verificationPathForLocale(input.locale)}?token=${encodeURIComponent(token)}`;

  const result = await sendStoreEmail("account_verification", {
    account: {
      email: customer.email,
      firstName: customer.firstName,
      actionUrl,
    },
  });

  if (result.status === "skipped" && isDevActionLinkLogAllowed()) {
    console.info("[account-email] verification link available in non-production logs", {
      customerId: customer.id,
      reason: "email skipped: missing env",
      actionUrl,
    });
  }

  return { sent: result.status === "sent" || result.status === "queued", status: result.status };
}

export async function verifyCustomerEmail(token: string) {
  const tokenHash = hashToken(token);
  const record = await getPrisma().customerAccountToken.findUnique({
    where: { tokenHash },
    include: { customer: true },
  });

  if (!record || record.type !== "email_verification" || record.customer.status !== "active") {
    throw new Error("Invalid verification token.");
  }
  if (record.customer.emailVerifiedAt) {
    throw new Error("E-mail is already verified.");
  }
  if (record.usedAt) {
    throw new Error("Verification token has already been used.");
  }
  if (record.expiresAt.getTime() <= Date.now()) {
    throw new Error("Verification token has expired.");
  }

  await getPrisma().$transaction([
    getPrisma().customerAccount.update({
      where: { id: record.customerId },
      data: { emailVerifiedAt: new Date() },
    }),
    getPrisma().customerAccountToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);
}

export async function requestPasswordReset(input: {
  email?: string;
  baseUrl: string;
  locale?: "pl" | "en";
}) {
  const email = normalizeEmail(input.email);
  const customer = email
    ? await getPrisma().customerAccount.findUnique({ where: { email } })
    : null;

  if (!customer || customer.status !== "active") {
    return { accepted: true as const };
  }

  const { token } = await createCustomerActionToken({
    customerId: customer.id,
    type: "password_reset",
    expiresInMs: 1000 * 60 * 60,
  });
  const actionUrl = `${siteUrl(input.baseUrl)}${newPasswordPathForLocale(input.locale)}?token=${encodeURIComponent(token)}`;

  const result = await sendStoreEmail("password_reset", {
    account: {
      email: customer.email,
      firstName: customer.firstName,
      actionUrl,
    },
  });

  if (result.status === "skipped" && isDevActionLinkLogAllowed()) {
    console.info("[account-email] password reset link available in non-production logs", {
      customerId: customer.id,
      reason: "email skipped: missing env",
      actionUrl,
    });
  }

  return { accepted: true as const };
}

export async function resetCustomerPassword(input: {
  token?: string;
  password?: string;
  passwordConfirmation?: string;
}) {
  const token = cleanText(input.token);
  const password = String(input.password ?? "");
  validatePassword(password);
  if (input.passwordConfirmation !== undefined) {
    assertPasswordsMatch(password, input.passwordConfirmation);
  }

  const record = await getPrisma().customerAccountToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { customer: true },
  });

  if (!record || record.type !== "password_reset" || record.customer.status !== "active") {
    throw new Error("Invalid reset token.");
  }
  if (record.usedAt) {
    throw new Error("Reset token has already been used.");
  }
  if (record.expiresAt.getTime() <= Date.now()) {
    throw new Error("Reset token has expired.");
  }

  await getPrisma().$transaction([
    getPrisma().customerAccount.update({
      where: { id: record.customerId },
      data: { passwordHash: await hashPassword(password) },
    }),
    getPrisma().customerAccountToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    getPrisma().customerSession.deleteMany({ where: { customerId: record.customerId } }),
  ]);

  await sendStoreEmail("password_changed", {
    account: {
      email: record.customer.email,
      firstName: record.customer.firstName,
    },
  });
}

export async function loginCustomer(emailInput: unknown, passwordInput: unknown) {
  if (!isCustomerAccountEnabled()) {
    throw new Error("Customer account is not enabled.");
  }

  const { ensurePreviewCustomerAccount } = await import("@/lib/account/dev-seed");
  await ensurePreviewCustomerAccount();

  const email = normalizeEmail(emailInput);
  const password = String(passwordInput ?? "");
  const customer = await getPrisma().customerAccount.findUnique({ where: { email } });

  if (!customer || customer.status !== "active") {
    throw new Error("Invalid e-mail or password.");
  }

  const valid = await verifyPassword(password, customer.passwordHash);
  if (!valid) {
    throw new Error("Invalid e-mail or password.");
  }

  await getPrisma().customerAccount.update({
    where: { id: customer.id },
    data: { lastLoginAt: new Date() },
  });

  return customer;
}

export async function changeCustomerPassword(
  customerId: string,
  input: {
    currentPassword?: string;
    newPassword?: string;
    newPasswordConfirmation?: string;
    logoutOtherSessions?: boolean;
    currentSessionToken?: string;
  },
) {
  const customer = await getPrisma().customerAccount.findUnique({ where: { id: customerId } });
  if (!customer || customer.status !== "active") {
    throw new Error("Unauthorized.");
  }

  const currentPasswordValid = await verifyPassword(String(input.currentPassword ?? ""), customer.passwordHash);
  if (!currentPasswordValid) {
    throw new Error("Current password is invalid.");
  }

  const newPassword = String(input.newPassword ?? "");
  validatePassword(newPassword);
  assertPasswordsMatch(newPassword, input.newPasswordConfirmation);

  const passwordUpdate = getPrisma().customerAccount.update({
    where: { id: customer.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  const sessionCleanup = input.logoutOtherSessions
    ? getPrisma().customerSession.deleteMany({
        where: {
          customerId: customer.id,
          ...(input.currentSessionToken ? { tokenHash: { not: hashToken(input.currentSessionToken) } } : {}),
        },
      })
    : null;

  await getPrisma().$transaction([
    passwordUpdate,
    ...(sessionCleanup ? [sessionCleanup] : []),
  ]);

  await sendStoreEmail("password_changed", {
    account: {
      email: customer.email,
      firstName: customer.firstName,
    },
  });
}

function safeCustomer(customer: Awaited<ReturnType<typeof getCurrentCustomer>>) {
  if (!customer) {
    return null;
  }

  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone ?? "",
    marketingConsent: customer.marketingConsent,
    status: customer.status,
    emailVerifiedAt: customer.emailVerifiedAt?.toISOString() ?? null,
    deletionRequestedAt: customer.deletionRequestedAt?.toISOString() ?? null,
    createdAt: customer.createdAt.toISOString(),
    lastLoginAt: customer.lastLoginAt?.toISOString() ?? null,
    addresses: customer.addresses.map((address) => ({
      id: address.id,
      firstName: address.firstName,
      lastName: address.lastName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? "",
      postalCode: address.postalCode,
      city: address.city,
      country: address.country,
      phone: address.phone ?? "",
      isDefault: address.isDefault,
    })),
  };
}

export async function requestCustomerAccountDeletion(customerId: string, note?: string) {
  const customer = await getPrisma().customerAccount.update({
    where: { id: customerId },
    data: {
      status: "pending_deletion",
      deletionRequestedAt: new Date(),
      deletionRequestNote: cleanText(note) || null,
    },
  });

  await destroyAllCustomerSessions(customer.id);
  await sendStoreEmail("account_deletion_requested", {
    account: {
      email: customer.email,
      firstName: customer.firstName,
    },
  });

  return customer;
}

function orderSummary(order: Order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    orderStatus: order.orderStatus,
    total: order.total,
    currency: order.currency,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

function orderDetail(order: Order, returns: ReturnRequest[], complaints: Complaint[]) {
  return {
    ...orderSummary(order),
    customerEmail: order.customer.email,
    shippingAddress: order.shippingAddress,
    delivery: order.delivery,
    items: order.items,
    returns: returns
      .filter((item) => item.orderId === order.id)
      .map((item) => ({
        id: item.id,
        status: item.status,
        reason: item.reason ?? "",
        createdAt: item.createdAt,
        selectedItems: item.selectedItems,
      })),
    complaints: complaints
      .filter((item) => item.orderId === order.id)
      .map((item) => ({
        id: item.id,
        status: item.status,
        productId: item.productId,
        description: item.description,
        preferredSolution: item.preferredSolution,
        createdAt: item.createdAt,
      })),
  };
}

export async function getCustomerAccountPayload(orderNumber?: string) {
  if (!isCustomerAccountEnabled()) {
    return {
      accountEnabled: false as const,
      authenticated: false as const,
      customer: null,
    };
  }

  const customer = await getCurrentCustomer();
  if (!customer) {
    return { accountEnabled: true as const, authenticated: false as const, customer: null };
  }

  if (!customer.emailVerifiedAt) {
    return {
      accountEnabled: true as const,
      authenticated: false as const,
      verificationRequired: true as const,
      customer: safeCustomer(customer),
    };
  }

  const database = await readStoreDatabase();
  const orders = database.orders
    .filter((order) => order.customer.email.toLowerCase() === customer.email.toLowerCase())
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  const selectedOrder = orderNumber
    ? orders.find((order) => order.orderNumber.toLowerCase() === orderNumber.toLowerCase()) ?? null
    : null;

  return {
    authenticated: true as const,
    accountEnabled: true as const,
    customer: safeCustomer(customer),
    orders: orders.map(orderSummary),
    orderDetails: orders.map((order) => orderDetail(order, database.returns, database.complaints)),
    order: selectedOrder ? orderDetail(selectedOrder, database.returns, database.complaints) : null,
    returns: database.returns
      .filter((item) => orders.some((order) => order.id === item.orderId))
      .map((item) => ({
        id: item.id,
        orderNumber: orders.find((order) => order.id === item.orderId)?.orderNumber ?? item.orderId,
        type: "return" as const,
        status: item.status,
        createdAt: item.createdAt,
        reason: item.reason ?? "",
      })),
    complaints: database.complaints
      .filter((item) => orders.some((order) => order.id === item.orderId))
      .map((item) => ({
        id: item.id,
        orderNumber: orders.find((order) => order.id === item.orderId)?.orderNumber ?? item.orderId,
        type: "complaint" as const,
        status: item.status,
        createdAt: item.createdAt,
        reason: item.description,
      })),
  };
}

export async function updateCustomerProfile(
  customerId: string,
  input: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    marketingConsent?: boolean;
  },
) {
  return getPrisma().customerAccount.update({
    where: { id: customerId },
    data: {
      firstName: requireText(input.firstName, "firstName"),
      lastName: requireText(input.lastName, "lastName"),
      phone: cleanText(input.phone) || null,
      marketingConsent: Boolean(input.marketingConsent),
    },
  });
}

export async function saveCustomerAddress(customerId: string, input: AddressInput) {
  const prisma = getPrisma();
  const data = {
    firstName: requireText(input.firstName, "firstName"),
    lastName: requireText(input.lastName, "lastName"),
    addressLine1: requireText(input.addressLine1, "addressLine1"),
    addressLine2: cleanText(input.addressLine2) || null,
    postalCode: requireText(input.postalCode, "postalCode"),
    city: requireText(input.city, "city"),
    country: cleanText(input.country) || "PL",
    phone: cleanText(input.phone) || null,
    isDefault: Boolean(input.isDefault),
  };

  if (data.isDefault) {
    await prisma.customerAddress.updateMany({
      where: { customerId },
      data: { isDefault: false },
    });
  }

  if (input.id) {
    const updated = await prisma.customerAddress.updateMany({
      where: { id: input.id, customerId },
      data,
    });
    if (!updated.count) {
      throw new Error("Address not found.");
    }
    return prisma.customerAddress.findFirstOrThrow({ where: { id: input.id, customerId } });
  }

  return prisma.customerAddress.create({
    data: {
      id: createId("addr"),
      customerId,
      ...data,
    },
  });
}

export async function deleteCustomerAddress(customerId: string, id: string) {
  await getPrisma().customerAddress.deleteMany({
    where: { id, customerId },
  });
}
