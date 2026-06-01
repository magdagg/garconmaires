import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { createDefaultStoreDatabase } from "./defaults";
import { addMinutes, createId } from "./ids";
import { getDefaultDeliveryQuotes } from "./delivery";
import {
  assertPaymentWebhookMatchesPayment,
  getDefaultPaymentProvider,
} from "./payments";
import type { PaymentCreation, PaymentWebhookResult } from "./payments";
import type {
  Cart,
  CartItem,
  Complaint,
  DiscountCode,
  Drop,
  InventoryReservation,
  NewsletterSubscriber,
  Order,
  OrderItemSnapshot,
  PaymentTransaction,
  Product,
  ProductCategory,
  ProductImage,
  ProductVariant,
  ReturnRequest,
  StoreDatabase,
  StoreSettings,
} from "./types";
import type { CheckoutCustomerInput } from "./orders";
import type { CheckoutItemInput } from "@/lib/commerce";

type Db = Prisma.TransactionClient;

function iso(date: Date | string | null | undefined) {
  return date ? new Date(date).toISOString() : null;
}

function requiredIso(date: Date | string) {
  return new Date(date).toISOString();
}

function asDate(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function requireText(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Brak wymaganego pola: ${field}.`);
  }

  return value.trim();
}

function mapSettings(settings: Awaited<ReturnType<Db["storeSettings"]["findUnique"]>>): StoreSettings {
  return settings
    ? {
        storeName: settings.storeName,
        contactEmail: settings.contactEmail,
        supportEmail: settings.supportEmail,
        sellerName: settings.sellerName,
        sellerAddress: settings.sellerAddress,
        nip: settings.nip,
        regon: settings.regon,
        returnAddress: settings.returnAddress,
        defaultCurrency: "PLN",
        defaultCountry: "PL",
        freeShippingThreshold: settings.freeShippingThreshold,
        defaultDeliveryPrice: settings.defaultDeliveryPrice,
        shopEnabled: settings.shopEnabled,
        maintenanceMode: settings.maintenanceMode,
        shopMode: settings.shopMode,
        legalDocumentVersion: settings.legalDocumentVersion,
        updatedAt: requiredIso(settings.updatedAt),
      }
    : createDefaultStoreDatabase().settings;
}

export async function ensurePostgresDefaults(db?: Db) {
  const client = db ?? (getPrisma() as unknown as Db);
  const fallback = createDefaultStoreDatabase();

  await client.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      ...fallback.settings,
      updatedAt: new Date(fallback.settings.updatedAt),
    },
  });

  for (const category of fallback.categories) {
    await client.productCategory.upsert({
      where: { id: category.id },
      update: {},
      create: {
        ...category,
        createdAt: new Date(category.createdAt),
        updatedAt: new Date(category.updatedAt),
      },
    });
  }

  for (const drop of fallback.drops) {
    await client.drop.upsert({
      where: { id: drop.id },
      update: {},
      create: {
        ...drop,
        launchDate: asDate(drop.launchDate),
        endDate: asDate(drop.endDate),
        createdAt: new Date(drop.createdAt),
        updatedAt: new Date(drop.updatedAt),
      },
    });
  }

  for (const product of fallback.products) {
    await client.product.upsert({
      where: { id: product.id },
      update: {},
      create: {
        ...product,
        currency: "PLN",
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt),
      },
    });
  }

  for (const variant of fallback.variants) {
    await client.productVariant.upsert({
      where: { id: variant.id },
      update: {},
      create: {
        ...variant,
        priceOverride: variant.priceOverride ?? null,
        createdAt: new Date(variant.createdAt),
        updatedAt: new Date(variant.updatedAt),
      },
    });
  }
}

export async function readPostgresStore(): Promise<StoreDatabase> {
  const prisma = getPrisma();

  await ensurePostgresDefaults(prisma as unknown as Db);

  const [
    settings,
    categories,
    drops,
    products,
    variants,
    images,
    carts,
    cartItems,
    reservations,
    orders,
    payments,
    deliveries,
    shippingAddresses,
    invoices,
    legalConsents,
    orderItems,
    returns,
    returnItems,
    complaints,
    newsletterSubscribers,
    discounts,
    discountProducts,
    legalSubmissions,
    analyticsEvents,
    webhookEvents,
  ] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { id: "default" } }),
    prisma.productCategory.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.drop.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.product.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.productVariant.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.productImage.findMany({ orderBy: [{ productId: "asc" }, { sortOrder: "asc" }] }),
    prisma.cart.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.cartItem.findMany(),
    prisma.inventoryReservation.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.payment.findMany(),
    prisma.delivery.findMany(),
    prisma.shippingAddress.findMany(),
    prisma.invoice.findMany(),
    prisma.legalConsent.findMany(),
    prisma.orderItem.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.returnRequest.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.returnItem.findMany(),
    prisma.complaint.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.discountProduct.findMany(),
    prisma.legalSubmission.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.analyticsEvent.findMany({ orderBy: { createdAt: "desc" }, take: 1000 }),
    prisma.paymentWebhookEvent.findMany({ orderBy: { createdAt: "desc" }, take: 5000 }),
  ]);

  return {
    products: products.map((item): Product => ({
      ...item,
      currency: "PLN",
      createdAt: requiredIso(item.createdAt),
      updatedAt: requiredIso(item.updatedAt),
    })),
    variants: variants.map((item): ProductVariant => ({
      ...item,
      priceOverride: item.priceOverride,
      createdAt: requiredIso(item.createdAt),
      updatedAt: requiredIso(item.updatedAt),
    })),
    images: images.map((item): ProductImage => ({
      ...item,
      createdAt: requiredIso(item.createdAt),
    })),
    categories: categories.map((item): ProductCategory => ({
      ...item,
      description: item.description ?? undefined,
      createdAt: requiredIso(item.createdAt),
      updatedAt: requiredIso(item.updatedAt),
    })),
    drops: drops.map((item): Drop => ({
      ...item,
      launchDate: iso(item.launchDate),
      endDate: iso(item.endDate),
      createdAt: requiredIso(item.createdAt),
      updatedAt: requiredIso(item.updatedAt),
    })),
    carts: carts.map((cart): Cart => ({
      ...cart,
      expiresAt: requiredIso(cart.expiresAt),
      createdAt: requiredIso(cart.createdAt),
      updatedAt: requiredIso(cart.updatedAt),
      items: cartItems
        .filter((item) => item.cartId === cart.id)
        .map((item): CartItem => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
          createdAt: requiredIso(item.createdAt),
          updatedAt: requiredIso(item.updatedAt),
        })),
    })),
    reservations: reservations.map((item): InventoryReservation => ({
      ...item,
      status: item.status,
      expiresAt: requiredIso(item.expiresAt),
      createdAt: requiredIso(item.createdAt),
      updatedAt: requiredIso(item.updatedAt),
    })),
    orders: orders.map((order): Order => {
      const delivery = deliveries.find((item) => item.orderId === order.id);
      const shippingAddress = shippingAddresses.find((item) => item.orderId === order.id);
      const invoice = invoices.find((item) => item.orderId === order.id);
      const consent = legalConsents.find((item) => item.orderId === order.id);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: {
          firstName: order.customerFirstName,
          lastName: order.customerLastName,
          email: order.customerEmail,
          phone: order.customerPhone,
        },
        shippingAddress: shippingAddress
          ? {
              firstName: shippingAddress.firstName,
              lastName: shippingAddress.lastName,
              addressLine1: shippingAddress.addressLine1,
              addressLine2: shippingAddress.addressLine2 ?? undefined,
              postalCode: shippingAddress.postalCode,
              city: shippingAddress.city,
              country: "PL",
            }
          : {
              firstName: "",
              lastName: "",
              addressLine1: "",
              postalCode: "",
              city: "",
              country: "PL",
            },
        invoice: {
          wantsInvoice: invoice?.wantsInvoice ?? false,
          companyName: invoice?.companyName ?? undefined,
          nip: invoice?.nip ?? undefined,
          companyAddress: invoice?.companyAddress ?? undefined,
        },
        delivery: {
          deliveryMethod: delivery?.deliveryMethod ?? "inpost_courier",
          parcelLockerId: delivery?.parcelLockerId ?? null,
          parcelLockerAddress: delivery?.parcelLockerAddress ?? null,
          deliveryPrice: delivery?.deliveryPrice ?? order.deliveryCost,
          trackingNumber: delivery?.trackingNumber ?? null,
          labelUrl: delivery?.labelUrl ?? null,
          deliveryStatus: delivery?.deliveryStatus ?? "pending",
        },
        items: orderItems
          .filter((item) => item.orderId === order.id)
          .map((item): OrderItemSnapshot => ({
            productId: item.productId,
            variantId: item.variantId,
            sku: item.sku,
            name: item.productName,
            slug: "",
            size: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            currency: "PLN",
          })),
        subtotal: order.subtotal,
        deliveryCost: order.deliveryCost,
        discount: order.discount,
        total: order.total,
        currency: "PLN",
        provider: order.provider,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        orderStatus: order.orderStatus,
        trackingNumber: order.trackingNumber,
        consentLog: {
          termsAcceptedAt: requiredIso(consent?.termsAcceptedAt ?? order.createdAt),
          privacyAcceptedAt: requiredIso(consent?.privacyAcceptedAt ?? order.createdAt),
          newsletterConsentAt: iso(consent?.newsletterConsentAt),
          marketingConsentAt: iso(consent?.marketingConsentAt),
          legalDocumentVersion: consent?.legalDocumentVersion ?? mapSettings(settings).legalDocumentVersion,
        },
        reservationIds: reservations
          .filter((item) => item.orderId === order.id)
          .map((item) => item.id),
        createdAt: requiredIso(order.createdAt),
        updatedAt: requiredIso(order.updatedAt),
      };
    }),
    payments: payments.map((item): PaymentTransaction => ({
      id: item.id,
      orderId: item.orderId,
      provider: item.provider,
      paymentMethod: item.paymentMethod as PaymentTransaction["paymentMethod"],
      paymentUrl: item.paymentUrl,
      providerTransactionId: item.providerTransactionId,
      providerPaymentId: item.providerPaymentId,
      providerCustomerId: item.providerCustomerId,
      status: item.status,
      amount: item.amount,
      currency: "PLN",
      rawProviderPayload: item.rawProviderPayload as Record<string, unknown> | null,
      rawEventIds: item.rawEventIds,
      paidAt: iso(item.paidAt),
      createdAt: requiredIso(item.createdAt),
      updatedAt: requiredIso(item.updatedAt),
    })),
    returns: returns.map((item): ReturnRequest => ({
      id: item.id,
      orderId: item.orderId,
      customerEmail: item.customerEmail,
      reason: item.reason ?? undefined,
      status: item.status,
      selectedItems: returnItems
        .filter((returnItem) => returnItem.returnRequestId === item.id)
        .map((returnItem) => ({
          orderItemId: returnItem.orderItemId ?? undefined,
          productId: returnItem.productId,
          variantId: returnItem.variantId,
          quantity: returnItem.quantity,
        })),
      createdAt: requiredIso(item.createdAt),
      updatedAt: requiredIso(item.updatedAt),
    })),
    complaints: complaints.map((item): Complaint => ({
      ...item,
      preferredSolution: item.preferredSolution,
      status: item.status,
      createdAt: requiredIso(item.createdAt),
      updatedAt: requiredIso(item.updatedAt),
    })),
    newsletterSubscribers: newsletterSubscribers.map((item): NewsletterSubscriber => ({
      ...item,
      status: item.status,
      confirmationToken: item.confirmationToken ?? undefined,
      consentTimestamp: requiredIso(item.consentTimestamp),
      createdAt: requiredIso(item.createdAt),
      updatedAt: requiredIso(item.updatedAt),
    })),
    discounts: discounts.map((item): DiscountCode => ({
      ...item,
      type: item.type,
      startsAt: iso(item.startsAt),
      endsAt: iso(item.endsAt),
      appliesToDropId: item.appliesToDropId,
      appliesToProductIds: discountProducts
        .filter((entry) => entry.discountId === item.id)
        .map((entry) => entry.productId),
      createdAt: requiredIso(item.createdAt),
      updatedAt: requiredIso(item.updatedAt),
    })),
    settings: mapSettings(settings),
    legalSubmissions: legalSubmissions.map((item) => ({
      id: item.id,
      type: item.type as "withdrawal" | "complaint",
      orderId: item.orderId,
      customerEmail: item.customerEmail,
      payload: item.payload as Record<string, unknown>,
      documentVersion: item.documentVersion,
      createdAt: requiredIso(item.createdAt),
    })),
    analyticsEvents: analyticsEvents.map((item) => ({
      id: item.id,
      name: item.name as never,
      sessionId: item.sessionId,
      customerEmail: item.customerEmail,
      orderId: item.orderId,
      productId: item.productId,
      data: item.data as Record<string, unknown>,
      createdAt: requiredIso(item.createdAt),
    })),
    processedWebhookEvents: webhookEvents.map((item) => item.id),
  };
}

export async function writePostgresStore(database: StoreDatabase): Promise<StoreDatabase> {
  const prisma = getPrisma();

  await prisma.$transaction(async (tx) => {
    await tx.storeSettings.upsert({
      where: { id: "default" },
      update: {
        ...database.settings,
        updatedAt: new Date(database.settings.updatedAt),
      },
      create: {
        id: "default",
        ...database.settings,
        updatedAt: new Date(database.settings.updatedAt),
      },
    });

    for (const category of database.categories) {
      await tx.productCategory.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          updatedAt: new Date(category.updatedAt),
        },
        create: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          createdAt: new Date(category.createdAt),
          updatedAt: new Date(category.updatedAt),
        },
      });
    }

    for (const drop of database.drops) {
      await tx.drop.upsert({
        where: { id: drop.id },
        update: {
          name: drop.name,
          slug: drop.slug,
          status: drop.status,
          launchDate: asDate(drop.launchDate),
          endDate: asDate(drop.endDate),
          description: drop.description,
          isPasswordProtected: drop.isPasswordProtected,
          earlyAccessEnabled: drop.earlyAccessEnabled,
          updatedAt: new Date(drop.updatedAt),
        },
        create: {
          ...drop,
          launchDate: asDate(drop.launchDate),
          endDate: asDate(drop.endDate),
          createdAt: new Date(drop.createdAt),
          updatedAt: new Date(drop.updatedAt),
        },
      });
    }

    for (const product of database.products) {
      await tx.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription,
          editorialDescription: product.editorialDescription,
          technicalDescription: product.technicalDescription,
          price: product.price,
          status: product.status,
          isVisible: product.isVisible,
          isFeatured: product.isFeatured,
          categoryId: product.categoryId,
          dropId: product.dropId,
          updatedAt: new Date(product.updatedAt),
        },
        create: {
          ...product,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt),
        },
      });
    }

    for (const variant of database.variants) {
      await tx.productVariant.upsert({
        where: { id: variant.id },
        update: {
          size: variant.size,
          sku: variant.sku,
          stockQuantity: variant.stockQuantity,
          reservedQuantity: variant.reservedQuantity,
          isAvailable: variant.isAvailable,
          priceOverride: variant.priceOverride ?? null,
          updatedAt: new Date(variant.updatedAt),
        },
        create: {
          ...variant,
          priceOverride: variant.priceOverride ?? null,
          createdAt: new Date(variant.createdAt),
          updatedAt: new Date(variant.updatedAt),
        },
      });
    }

    for (const image of database.images) {
      await tx.productImage.upsert({
        where: { id: image.id },
        update: {
          productId: image.productId,
          url: image.url,
          alt: image.alt,
          sortOrder: image.sortOrder,
          isPrimary: image.isPrimary,
        },
        create: {
          ...image,
          createdAt: new Date(image.createdAt),
        },
      });
    }

    for (const cart of database.carts) {
      await tx.cart.upsert({
        where: { id: cart.id },
        update: {
          sessionId: cart.sessionId,
          subtotal: cart.subtotal,
          deliveryCost: cart.deliveryCost,
          discount: cart.discount,
          total: cart.total,
          expiresAt: new Date(cart.expiresAt),
          updatedAt: new Date(cart.updatedAt),
        },
        create: {
          id: cart.id,
          sessionId: cart.sessionId,
          subtotal: cart.subtotal,
          deliveryCost: cart.deliveryCost,
          discount: cart.discount,
          total: cart.total,
          expiresAt: new Date(cart.expiresAt),
          createdAt: new Date(cart.createdAt),
          updatedAt: new Date(cart.updatedAt),
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      if (cart.items.length > 0) {
        await tx.cartItem.createMany({
          data: cart.items.map((item) => ({
            id: item.id,
            cartId: cart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            priceAtTime: item.priceAtTime,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          })),
        });
      }
    }

    for (const reservation of database.reservations) {
      await tx.inventoryReservation.upsert({
        where: { id: reservation.id },
        update: {
          cartId: reservation.cartId,
          orderId: reservation.orderId,
          variantId: reservation.variantId,
          quantity: reservation.quantity,
          status: reservation.status,
          expiresAt: new Date(reservation.expiresAt),
          updatedAt: new Date(reservation.updatedAt),
        },
        create: {
          id: reservation.id,
          cartId: reservation.cartId,
          orderId: reservation.orderId,
          variantId: reservation.variantId,
          quantity: reservation.quantity,
          status: reservation.status,
          expiresAt: new Date(reservation.expiresAt),
          createdAt: new Date(reservation.createdAt),
          updatedAt: new Date(reservation.updatedAt),
        },
      });
    }

    for (const order of database.orders) {
      await tx.order.upsert({
        where: { id: order.id },
        update: {
          paymentStatus: order.paymentStatus,
          fulfillmentStatus: order.fulfillmentStatus,
          orderStatus: order.orderStatus,
          trackingNumber: order.trackingNumber,
          updatedAt: new Date(order.updatedAt),
        },
        create: {
          id: order.id,
          orderNumber: order.orderNumber,
          customerFirstName: order.customer.firstName,
          customerLastName: order.customer.lastName,
          customerEmail: order.customer.email,
          customerPhone: order.customer.phone,
          subtotal: order.subtotal,
          deliveryCost: order.deliveryCost,
          discount: order.discount,
          total: order.total,
          currency: "PLN",
          provider: order.provider,
          paymentStatus: order.paymentStatus,
          fulfillmentStatus: order.fulfillmentStatus,
          orderStatus: order.orderStatus,
          trackingNumber: order.trackingNumber,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        },
      });
    }

    for (const order of database.orders) {
      await upsertNestedOrderRows(tx, order);
    }

    for (const payment of database.payments) {
      await tx.payment.upsert({
        where: { id: payment.id },
        update: {
          paymentUrl: payment.paymentUrl,
          providerTransactionId: payment.providerTransactionId,
          providerPaymentId: payment.providerPaymentId,
          providerCustomerId: payment.providerCustomerId,
          status: payment.status,
          rawProviderPayload: payment.rawProviderPayload as Prisma.InputJsonValue,
          rawEventIds: payment.rawEventIds,
          paidAt: asDate(payment.paidAt),
          updatedAt: new Date(payment.updatedAt),
        },
        create: {
          ...payment,
          currency: "PLN",
          rawProviderPayload: payment.rawProviderPayload as Prisma.InputJsonValue,
          paidAt: asDate(payment.paidAt),
          createdAt: new Date(payment.createdAt),
          updatedAt: new Date(payment.updatedAt),
        },
      });
    }

    for (const returnRequest of database.returns) {
      await tx.returnRequest.upsert({
        where: { id: returnRequest.id },
        update: {
          status: returnRequest.status,
          reason: returnRequest.reason,
          updatedAt: new Date(returnRequest.updatedAt),
        },
        create: {
          id: returnRequest.id,
          orderId: returnRequest.orderId,
          customerEmail: returnRequest.customerEmail,
          reason: returnRequest.reason,
          status: returnRequest.status,
          createdAt: new Date(returnRequest.createdAt),
          updatedAt: new Date(returnRequest.updatedAt),
        },
      });

      await tx.returnItem.deleteMany({
        where: { returnRequestId: returnRequest.id },
      });

      if (returnRequest.selectedItems.length > 0) {
        await tx.returnItem.createMany({
          data: returnRequest.selectedItems.map((item) => ({
            id: createId("ret_item"),
            returnRequestId: returnRequest.id,
            orderItemId: item.orderItemId ?? null,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        });
      }
    }

    for (const complaint of database.complaints) {
      await tx.complaint.upsert({
        where: { id: complaint.id },
        update: {
          status: complaint.status,
          description: complaint.description,
          imageUrls: complaint.imageUrls,
          preferredSolution: complaint.preferredSolution,
          updatedAt: new Date(complaint.updatedAt),
        },
        create: {
          ...complaint,
          createdAt: new Date(complaint.createdAt),
          updatedAt: new Date(complaint.updatedAt),
        },
      });
    }

    for (const subscriber of database.newsletterSubscribers) {
      await tx.newsletterSubscriber.upsert({
        where: { email: subscriber.email },
        update: {
          consent: subscriber.consent,
          consentTimestamp: new Date(subscriber.consentTimestamp),
          source: subscriber.source,
          status: subscriber.status,
          earlyAccess: subscriber.earlyAccess,
          tags: subscriber.tags,
          confirmationToken: subscriber.confirmationToken,
          updatedAt: new Date(subscriber.updatedAt),
        },
        create: {
          ...subscriber,
          consentTimestamp: new Date(subscriber.consentTimestamp),
          createdAt: new Date(subscriber.createdAt),
          updatedAt: new Date(subscriber.updatedAt),
        },
      });
    }

    for (const discount of database.discounts) {
      await tx.discountCode.upsert({
        where: { id: discount.id },
        update: {
          code: discount.code,
          type: discount.type,
          value: discount.value,
          usageLimit: discount.usageLimit,
          usedCount: discount.usedCount,
          startsAt: asDate(discount.startsAt),
          endsAt: asDate(discount.endsAt),
          minimumOrderValue: discount.minimumOrderValue,
          appliesToDropId: discount.appliesToDropId,
          isActive: discount.isActive,
          updatedAt: new Date(discount.updatedAt),
        },
        create: {
          id: discount.id,
          code: discount.code,
          type: discount.type,
          value: discount.value,
          usageLimit: discount.usageLimit,
          usedCount: discount.usedCount,
          startsAt: asDate(discount.startsAt),
          endsAt: asDate(discount.endsAt),
          minimumOrderValue: discount.minimumOrderValue,
          appliesToDropId: discount.appliesToDropId,
          isActive: discount.isActive,
          createdAt: new Date(discount.createdAt),
          updatedAt: new Date(discount.updatedAt),
        },
      });

      await tx.discountProduct.deleteMany({
        where: { discountId: discount.id },
      });

      if (discount.appliesToProductIds.length > 0) {
        await tx.discountProduct.createMany({
          data: discount.appliesToProductIds.map((productId) => ({
            discountId: discount.id,
            productId,
          })),
          skipDuplicates: true,
        });
      }
    }

    for (const submission of database.legalSubmissions) {
      await tx.legalSubmission.upsert({
        where: { id: submission.id },
        update: {
          type: submission.type,
          orderId: submission.orderId,
          customerEmail: submission.customerEmail,
          payload: submission.payload as Prisma.InputJsonValue,
          documentVersion: submission.documentVersion,
          createdAt: new Date(submission.createdAt),
        },
        create: {
          id: submission.id,
          type: submission.type,
          orderId: submission.orderId,
          customerEmail: submission.customerEmail,
          payload: submission.payload as Prisma.InputJsonValue,
          documentVersion: submission.documentVersion,
          createdAt: new Date(submission.createdAt),
        },
      });
    }

    for (const event of database.analyticsEvents) {
      await tx.analyticsEvent.upsert({
        where: { id: event.id },
        update: {
          name: event.name,
          sessionId: event.sessionId,
          customerEmail: event.customerEmail,
          orderId: event.orderId,
          productId: event.productId,
          data: event.data as Prisma.InputJsonValue,
          createdAt: new Date(event.createdAt),
        },
        create: {
          id: event.id,
          name: event.name,
          sessionId: event.sessionId,
          customerEmail: event.customerEmail,
          orderId: event.orderId,
          productId: event.productId,
          data: event.data as Prisma.InputJsonValue,
          createdAt: new Date(event.createdAt),
        },
      });
    }

    for (const eventId of database.processedWebhookEvents) {
      await tx.paymentWebhookEvent.upsert({
        where: { id: eventId },
        update: {},
        create: {
          id: eventId,
          provider: getDefaultPaymentProvider(),
          type: "legacy_or_ignored",
          orderId: null,
        },
      });
    }
  });

  return readPostgresStore();
}

async function upsertNestedOrderRows(tx: Db, order: Order) {
  await tx.shippingAddress.upsert({
    where: { orderId: order.id },
    update: {
      ...order.shippingAddress,
      country: "PL",
    },
    create: {
      id: createId("addr"),
      orderId: order.id,
      ...order.shippingAddress,
      country: "PL",
    },
  });

  await tx.invoice.upsert({
    where: { orderId: order.id },
    update: order.invoice,
    create: {
      id: createId("inv"),
      orderId: order.id,
      ...order.invoice,
    },
  });

  await tx.delivery.upsert({
    where: { orderId: order.id },
    update: order.delivery,
    create: {
      id: createId("del"),
      orderId: order.id,
      ...order.delivery,
    },
  });

  await tx.legalConsent.upsert({
    where: { orderId: order.id },
    update: {
      customerEmail: order.customer.email,
      termsAcceptedAt: new Date(order.consentLog.termsAcceptedAt),
      privacyAcceptedAt: new Date(order.consentLog.privacyAcceptedAt),
      newsletterConsentAt: asDate(order.consentLog.newsletterConsentAt),
      marketingConsentAt: asDate(order.consentLog.marketingConsentAt),
      legalDocumentVersion: order.consentLog.legalDocumentVersion,
    },
    create: {
      id: createId("legal"),
      orderId: order.id,
      customerEmail: order.customer.email,
      termsAcceptedAt: new Date(order.consentLog.termsAcceptedAt),
      privacyAcceptedAt: new Date(order.consentLog.privacyAcceptedAt),
      newsletterConsentAt: asDate(order.consentLog.newsletterConsentAt),
      marketingConsentAt: asDate(order.consentLog.marketingConsentAt),
      legalDocumentVersion: order.consentLog.legalDocumentVersion,
    },
  });

  for (const item of order.items) {
    const id = `${order.id}-${item.variantId}`;
    await tx.orderItem.upsert({
      where: { id },
      update: {
        productName: item.name,
        variantName: item.size,
        sku: item.sku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        total: item.total,
      },
      create: {
        id,
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.name,
        variantName: item.size,
        sku: item.sku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        total: item.total,
        currency: "PLN",
      },
    });
  }
}

export async function cleanupExpiredPostgresReservations(db?: Db) {
  const client = db ?? (getPrisma() as unknown as Db);
  const expired = await client.inventoryReservation.findMany({
    where: {
      status: "active",
      expiresAt: { lte: new Date() },
    },
  });

  for (const reservation of expired) {
    await client.productVariant.update({
      where: { id: reservation.variantId },
      data: {
        reservedQuantity: {
          decrement: reservation.quantity,
        },
      },
    });
    await client.inventoryReservation.update({
      where: { id: reservation.id },
      data: { status: "released" },
    });
  }

  return expired.length;
}

export async function createPostgresCheckout(input: {
  items: CheckoutItemInput[];
  sessionId: string;
  checkout: CheckoutCustomerInput;
  allowDisabledShop?: boolean;
}) {
  const prisma = getPrisma();

  return prisma.$transaction(
    async (tx) => {
      await ensurePostgresDefaults(tx);
      await cleanupExpiredPostgresReservations(tx);

      const settings = await tx.storeSettings.findUniqueOrThrow({
        where: { id: "default" },
      });

      if (
        !input.allowDisabledShop &&
        (!settings.shopEnabled || settings.shopMode === "PRE_LAUNCH")
      ) {
        throw new Error("Sklep nie jest jeszcze publicznie uruchomiony.");
      }

      if (settings.maintenanceMode) {
        throw new Error("Sklep jest tymczasowo w trybie konserwacji.");
      }

      if (!input.checkout.acceptedTerms || !input.checkout.acceptedPrivacy) {
        throw new Error("Akceptacja regulaminu i polityki prywatności jest wymagana.");
      }

      const customer = {
        firstName: requireText(input.checkout.customer?.firstName, "imię"),
        lastName: requireText(input.checkout.customer?.lastName, "nazwisko"),
        email: requireText(input.checkout.customer?.email, "e-mail"),
        phone: requireText(input.checkout.customer?.phone, "telefon"),
      };
      const shippingAddress = {
        firstName: requireText(
          input.checkout.shippingAddress?.firstName ?? customer.firstName,
          "imię odbiorcy",
        ),
        lastName: requireText(
          input.checkout.shippingAddress?.lastName ?? customer.lastName,
          "nazwisko odbiorcy",
        ),
        addressLine1: requireText(input.checkout.shippingAddress?.addressLine1, "adres"),
        addressLine2: input.checkout.shippingAddress?.addressLine2?.trim() || null,
        postalCode: requireText(input.checkout.shippingAddress?.postalCode, "kod pocztowy"),
        city: requireText(input.checkout.shippingAddress?.city, "miasto"),
        country: "PL" as const,
      };
      const invoice = {
        wantsInvoice: Boolean(input.checkout.invoice?.wantsInvoice),
        companyName: input.checkout.invoice?.companyName?.trim() || null,
        nip: input.checkout.invoice?.nip?.trim() || null,
        companyAddress: input.checkout.invoice?.companyAddress?.trim() || null,
      };

      const orderId = createId("ord");
      const orderNumber = await nextOrderNumber(tx);
      const timestamp = new Date();
      const normalizedItems = normalizeCheckoutItems(input.items);
      const orderItems: OrderItemSnapshot[] = [];
      const reservationIds: string[] = [];

      for (const requested of normalizedItems) {
        const product = await tx.product.findUnique({
          where: { id: requested.productId },
          include: { variants: true },
        });
        const variant = product?.variants.find((item) => item.size === requested.size);

        if (!product || !variant) {
          throw new Error("Jeden z produktów nie jest już dostępny.");
        }

        if (
          input.allowDisabledShop
            ? product.status !== "active" || product.isVisible
            : !product.isVisible || product.status !== "active"
        ) {
          throw new Error(`${product.name} nie jest aktualnie dostępny w sprzedaży.`);
        }

        const reserved = await reserveVariantAtomically(tx, {
          variantId: variant.id,
          quantity: requested.quantity,
        });

        if (!reserved) {
          throw new Error(`${product.name} / ${variant.size} jest niedostępny w tej ilości.`);
        }

        const reservationId = createId("res");
        await tx.inventoryReservation.create({
          data: {
            id: reservationId,
            orderId,
            variantId: variant.id,
            quantity: requested.quantity,
            status: "active",
            expiresAt: addMinutes(timestamp, 30),
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        });
        reservationIds.push(reservationId);

        const unitPrice = variant.priceOverride ?? product.price;
        orderItems.push({
          productId: product.id,
          variantId: variant.id,
          sku: variant.sku,
          name: product.name,
          slug: product.slug,
          size: variant.size,
          quantity: requested.quantity,
          unitPrice,
          total: unitPrice * requested.quantity,
          currency: "PLN",
        });
      }

      const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
      const deliveryCost =
        getDefaultDeliveryQuotes({
          subtotal,
          freeShippingThreshold: settings.freeShippingThreshold,
          defaultDeliveryPrice: settings.defaultDeliveryPrice,
        })[0]?.price ?? settings.defaultDeliveryPrice;
      const discount = 0;
      const total = subtotal + deliveryCost - discount;
      const provider = getDefaultPaymentProvider();

      await tx.order.create({
        data: {
          id: orderId,
          orderNumber,
          customerFirstName: customer.firstName,
          customerLastName: customer.lastName,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          subtotal,
          deliveryCost,
          discount,
          total,
          currency: "PLN",
          provider,
          paymentStatus: "pending",
          fulfillmentStatus: "unfulfilled",
          orderStatus: "new",
          createdAt: timestamp,
          updatedAt: timestamp,
          items: {
            create: orderItems.map((item) => ({
              id: `${orderId}-${item.variantId}`,
              productId: item.productId,
              variantId: item.variantId,
              productName: item.name,
              variantName: item.size,
              sku: item.sku,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              total: item.total,
              currency: "PLN",
            })),
          },
          payment: {
            create: {
              id: createId("pay"),
              provider,
              paymentMethod: "unknown",
              status: "pending",
              amount: total,
              currency: "PLN",
              rawProviderPayload: Prisma.JsonNull,
              rawEventIds: [],
              paidAt: null,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          },
          delivery: {
            create: {
              id: createId("del"),
              deliveryMethod: input.checkout.delivery?.deliveryMethod ?? "inpost_courier",
              parcelLockerId: input.checkout.delivery?.parcelLockerId ?? null,
              parcelLockerAddress: input.checkout.delivery?.parcelLockerAddress ?? null,
              deliveryPrice: deliveryCost,
              deliveryStatus: "pending",
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          },
          shippingAddress: {
            create: {
              id: createId("addr"),
              ...shippingAddress,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          },
          invoice: {
            create: {
              id: createId("inv"),
              ...invoice,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          },
          legalConsent: {
            create: {
              id: createId("legal"),
              customerEmail: customer.email,
              termsAcceptedAt: timestamp,
              privacyAcceptedAt: timestamp,
              newsletterConsentAt: input.checkout.marketingConsent ? timestamp : null,
              marketingConsentAt: input.checkout.marketingConsent ? timestamp : null,
              legalDocumentVersion: settings.legalDocumentVersion,
              createdAt: timestamp,
            },
          },
        },
      });

      await tx.analyticsEvent.create({
        data: {
          id: createId("ana"),
          name: "begin_checkout",
          sessionId: input.sessionId,
          customerEmail: customer.email,
          orderId,
          data: {},
          createdAt: timestamp,
        },
      });

      const order = await readOrderSnapshot(tx, orderId);

      return { order, reservationIds };
    },
    { isolationLevel: "Serializable" },
  );
}

async function nextOrderNumber(tx: Db) {
  const year = new Date().getFullYear();
  const prefix = `GM-${year}-`;
  const latest = await tx.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
  });
  const next =
    latest?.orderNumber
      ? Number.parseInt(latest.orderNumber.replace(prefix, ""), 10) + 1
      : 1;

  return `${prefix}${String(next).padStart(4, "0")}`;
}

function normalizeCheckoutItems(items: CheckoutItemInput[]) {
  return items.map((item) => ({
    productId: item.productId,
    size: item.size,
    quantity: Number.isFinite(item.quantity)
      ? Math.max(1, Math.min(10, Math.floor(item.quantity)))
      : 1,
  }));
}

async function reserveVariantAtomically(
  tx: Db,
  input: { variantId: string; quantity: number },
) {
  const updated = await tx.$queryRaw<{ id: string }[]>`
    UPDATE "ProductVariant"
    SET "reservedQuantity" = "reservedQuantity" + ${input.quantity},
        "updatedAt" = NOW()
    WHERE "id" = ${input.variantId}
      AND "isAvailable" = true
      AND ("stockQuantity" - "reservedQuantity") >= ${input.quantity}
    RETURNING "id"
  `;

  return updated.length === 1;
}

export async function markPostgresPaymentStarted(input: {
  orderId: string;
  payment: PaymentCreation;
  sessionId: string;
}) {
  const prisma = getPrisma();

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId: input.orderId },
      data: {
        provider: input.payment.provider,
        paymentUrl: input.payment.paymentUrl,
        providerTransactionId: input.payment.providerTransactionId,
        providerPaymentId: input.payment.providerPaymentId,
        rawProviderPayload: input.payment.rawProviderPayload as Prisma.InputJsonValue,
      },
    });
    await tx.analyticsEvent.create({
      data: {
        id: createId("ana"),
        name: "payment_started",
        sessionId: input.sessionId,
        orderId: input.orderId,
        data: { provider: input.payment.provider },
      },
    });
  });
}

export async function releasePostgresOrderReservations(orderId: string, status: "failed" | "cancelled" | "expired") {
  const prisma = getPrisma();

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { reservations: true, payment: true },
    });

    if (!order || order.paymentStatus === "paid") {
      return;
    }

    for (const reservation of order.reservations) {
      if (reservation.status !== "active") {
        continue;
      }

      await tx.productVariant.update({
        where: { id: reservation.variantId },
        data: { reservedQuantity: { decrement: reservation.quantity } },
      });
      await tx.inventoryReservation.update({
        where: { id: reservation.id },
        data: { status: "released" },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: status,
        orderStatus:
          status === "cancelled" || status === "expired"
            ? "cancelled"
            : order.orderStatus,
      },
    });
    await tx.payment.updateMany({
      where: { orderId },
      data: { status },
    });
  });
}

export async function processPostgresPaymentWebhook(input: PaymentWebhookResult) {
  const prisma = getPrisma();

  return prisma.$transaction(
    async (tx) => {
      const duplicate = await tx.paymentWebhookEvent.findUnique({
        where: { id: input.providerEventId },
      });

      if (duplicate) {
        return { duplicate: true, order: null as Order | null };
      }

      const payment = await tx.payment.findFirst({
        where: {
          OR: [
            ...(input.providerTransactionId
              ? [{ providerTransactionId: input.providerTransactionId }]
              : []),
            ...(input.providerPaymentId
              ? [{ providerPaymentId: input.providerPaymentId }]
              : []),
            ...(input.orderId ? [{ orderId: input.orderId }] : []),
          ],
        },
        include: { order: { include: { reservations: true } } },
      });

      if (!payment) {
        await tx.paymentWebhookEvent.create({
          data: {
            id: input.providerEventId,
            provider: input.provider,
            type: "payment_notification",
            orderId: input.orderId,
            providerTransactionId: input.providerTransactionId,
            providerPaymentId: input.providerPaymentId,
            status: input.status,
            amount: input.amount,
            currency: input.currency,
            rawProviderPayload: input.rawProviderPayload as Prisma.InputJsonValue,
          },
        });
        return { duplicate: false, order: null as Order | null };
      }

      assertPaymentWebhookMatchesPayment(input, payment);

      if (input.status === "paid" && payment.status !== "paid") {
        for (const reservation of payment.order.reservations) {
          if (reservation.status !== "active") {
            continue;
          }

          const updatedVariant = await tx.productVariant.update({
            where: { id: reservation.variantId },
            data: {
              reservedQuantity: { decrement: reservation.quantity },
              stockQuantity: { decrement: reservation.quantity },
            },
          });
          await tx.inventoryReservation.update({
            where: { id: reservation.id },
            data: { status: "committed" },
          });

          const availableVariantCount = await tx.productVariant.count({
            where: {
              productId: updatedVariant.productId,
              isAvailable: true,
              stockQuantity: { gt: 0 },
            },
          });

          if (availableVariantCount === 0) {
            await tx.product.updateMany({
              where: { id: updatedVariant.productId, status: "active" },
              data: { status: "sold_out" },
            });
          }
        }

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "paid",
            orderStatus: "confirmed",
            fulfillmentStatus: "packing",
          },
        });
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "paid",
            providerTransactionId:
              input.providerTransactionId ?? payment.providerTransactionId,
            providerPaymentId: input.providerPaymentId ?? payment.providerPaymentId,
            rawProviderPayload: input.rawProviderPayload as Prisma.InputJsonValue,
            rawEventIds: [...payment.rawEventIds, input.providerEventId],
            paidAt: new Date(),
          },
        });
      } else if (input.status !== "paid" && payment.order.paymentStatus !== "paid") {
        await releaseReservationsInTx(tx, payment.orderId, input.status);
        await tx.payment.updateMany({
          where: { id: payment.id, status: { not: "paid" } },
          data: {
            providerTransactionId:
              input.providerTransactionId ?? payment.providerTransactionId,
            providerPaymentId: input.providerPaymentId ?? payment.providerPaymentId,
            rawProviderPayload: input.rawProviderPayload as Prisma.InputJsonValue,
            rawEventIds: [...payment.rawEventIds, input.providerEventId],
          },
        });
      }

      await tx.paymentWebhookEvent.create({
        data: {
          id: input.providerEventId,
          provider: input.provider,
          type: "payment_notification",
          orderId: payment.orderId,
          providerTransactionId: input.providerTransactionId,
          providerPaymentId: input.providerPaymentId,
          status: input.status,
          amount: input.amount,
          currency: input.currency,
          rawProviderPayload: input.rawProviderPayload as Prisma.InputJsonValue,
        },
      });

      if (input.status === "paid") {
        await tx.analyticsEvent.create({
          data: {
            id: createId("ana"),
            name: "payment_success",
            customerEmail: payment.order.customerEmail,
            orderId: payment.orderId,
            data: {
              provider: input.provider,
              providerTransactionId: input.providerTransactionId,
            },
          },
        });
        await tx.analyticsEvent.create({
          data: {
            id: createId("ana"),
            name: "purchase",
            customerEmail: payment.order.customerEmail,
            orderId: payment.orderId,
            data: { total: payment.order.total, currency: "PLN" },
          },
        });
      } else {
        await tx.analyticsEvent.create({
          data: {
            id: createId("ana"),
            name: "payment_failed",
            customerEmail: payment.order.customerEmail,
            orderId: payment.orderId,
            data: { provider: input.provider, status: input.status },
          },
        });
      }

      return {
        duplicate: false,
        order: await readOrderSnapshot(tx, payment.orderId),
      };
    },
    { isolationLevel: "Serializable" },
  );
}

async function releaseReservationsInTx(tx: Db, orderId: string, status: "failed" | "cancelled" | "expired") {
  const reservations = await tx.inventoryReservation.findMany({
    where: { orderId, status: "active" },
  });

  for (const reservation of reservations) {
    await tx.productVariant.update({
      where: { id: reservation.variantId },
      data: { reservedQuantity: { decrement: reservation.quantity } },
    });
    await tx.inventoryReservation.update({
      where: { id: reservation.id },
      data: { status: "released" },
    });
  }

  await tx.order.updateMany({
    where: { id: orderId, paymentStatus: { not: "paid" } },
    data: {
      paymentStatus: status,
      orderStatus:
        status === "cancelled" || status === "expired" ? "cancelled" : undefined,
    },
  });
  await tx.payment.updateMany({
    where: { orderId, status: { not: "paid" } },
    data: { status },
  });
}

async function readOrderSnapshot(tx: Db, orderId: string): Promise<Order> {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: true,
      delivery: true,
      invoice: true,
      shippingAddress: true,
      legalConsent: true,
      reservations: true,
    },
  });

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customer: {
      firstName: order.customerFirstName,
      lastName: order.customerLastName,
      email: order.customerEmail,
      phone: order.customerPhone,
    },
    shippingAddress: {
      firstName: order.shippingAddress?.firstName ?? "",
      lastName: order.shippingAddress?.lastName ?? "",
      addressLine1: order.shippingAddress?.addressLine1 ?? "",
      addressLine2: order.shippingAddress?.addressLine2 ?? undefined,
      postalCode: order.shippingAddress?.postalCode ?? "",
      city: order.shippingAddress?.city ?? "",
      country: "PL",
    },
    invoice: {
      wantsInvoice: order.invoice?.wantsInvoice ?? false,
      companyName: order.invoice?.companyName ?? undefined,
      nip: order.invoice?.nip ?? undefined,
      companyAddress: order.invoice?.companyAddress ?? undefined,
    },
    delivery: {
      deliveryMethod: order.delivery?.deliveryMethod ?? "inpost_courier",
      parcelLockerId: order.delivery?.parcelLockerId ?? null,
      parcelLockerAddress: order.delivery?.parcelLockerAddress ?? null,
      deliveryPrice: order.delivery?.deliveryPrice ?? order.deliveryCost,
      trackingNumber: order.delivery?.trackingNumber ?? null,
      labelUrl: order.delivery?.labelUrl ?? null,
      deliveryStatus: order.delivery?.deliveryStatus ?? "pending",
    },
    items: order.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku,
      name: item.productName,
      slug: "",
      size: item.variantName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      currency: "PLN",
    })),
    subtotal: order.subtotal,
    deliveryCost: order.deliveryCost,
    discount: order.discount,
    total: order.total,
    currency: "PLN",
    provider: order.provider,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    orderStatus: order.orderStatus,
    trackingNumber: order.trackingNumber,
    consentLog: {
      termsAcceptedAt: requiredIso(order.legalConsent?.termsAcceptedAt ?? order.createdAt),
      privacyAcceptedAt: requiredIso(order.legalConsent?.privacyAcceptedAt ?? order.createdAt),
      newsletterConsentAt: iso(order.legalConsent?.newsletterConsentAt),
      marketingConsentAt: iso(order.legalConsent?.marketingConsentAt),
      legalDocumentVersion: order.legalConsent?.legalDocumentVersion ?? "",
    },
    reservationIds: order.reservations.map((reservation) => reservation.id),
    createdAt: requiredIso(order.createdAt),
    updatedAt: requiredIso(order.updatedAt),
  };
}
