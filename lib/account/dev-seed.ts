import { getPrisma } from "@/lib/prisma";
import { createId } from "@/lib/store/ids";
import { isAccountDevSeedAllowed } from "@/lib/account/config";
import { hashPassword } from "@/lib/account/auth";

const devSeedEmail = "customer@example.com";
const devSeedPassword = "GarconmairesPreview2026!";

export async function ensurePreviewCustomerAccount() {
  if (!isAccountDevSeedAllowed()) {
    return null;
  }

  const existing = await getPrisma().customerAccount.findUnique({ where: { email: devSeedEmail } });
  if (existing) {
    return existing;
  }

  return getPrisma().customerAccount.create({
    data: {
      id: createId("cust"),
      email: devSeedEmail,
      passwordHash: await hashPassword(devSeedPassword),
      firstName: "Customer",
      lastName: "Preview",
      phone: "+48123123123",
      marketingConsent: false,
      status: "active",
      addresses: {
        create: {
          id: createId("addr"),
          firstName: "Customer",
          lastName: "Preview",
          addressLine1: "Testowa 1",
          addressLine2: null,
          postalCode: "00-001",
          city: "Warszawa",
          country: "PL",
          phone: "+48123123123",
          isDefault: true,
        },
      },
    },
  });
}

export { devSeedEmail };
