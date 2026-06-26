import { storePages } from "@/lib/store-pages";

export type LaunchBlockerPriority = "critical" | "high" | "medium" | "low";

export type LaunchBlocker = {
  priority: LaunchBlockerPriority;
  area: string;
  title: string;
  detail: string;
  action: string;
};

type ProductLike = {
  id: string;
  name: string;
  status: string;
  isVisible: boolean;
  shortDescription?: string;
  editorialDescription?: string;
  technicalDescription?: string;
  specifications?: Record<string, string>;
  sizeGuide?: {
    apparel?: {
      size: string;
      chestWidth: string;
      length: string;
      sleeveLength?: string;
      shoulderWidth?: string;
    }[];
  };
};

type VariantLike = {
  id: string;
  productId: string;
  size: string;
  sku: string;
  stockQuantity: number;
  reservedQuantity: number;
  isAvailable: boolean;
};

type ImageLike = {
  id: string;
  productId: string;
  url: string;
  alt: string;
};

type DropLike = {
  id: string;
  name: string;
  status: string;
};

type DeliveryMethodLike = {
  id: string;
  name: string;
  provider: string;
  price: number;
  estimatedDeliveryTime: string;
  enabled: boolean;
};

type SettingsLike = {
  shopEnabled: boolean;
  shopMode: string;
  sellerName: string;
  sellerAddress: string;
  nip: string;
  regon: string;
  returnAddress: string;
  legalDocumentVersion: string;
  deliveryMethods: DeliveryMethodLike[];
};

type ReadinessCheckLike = {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export type LaunchReadinessInput = {
  products: ProductLike[];
  variants: VariantLike[];
  images: ImageLike[];
  drops: DropLike[];
  emailEvents: { status: string; template: string }[];
  settings: SettingsLike;
  diagnostics?: {
    legalReadiness?: {
      sellerDataStatus: "pending";
      legalStatus: "pending";
      businessRegistrationStatus: "unregistered_activity_planned";
      readyForPublicCheckout: boolean;
      sellerFields: ReadinessCheckLike[];
      legalPages: ReadinessCheckLike[];
      unregisteredActivityChecks?: ReadinessCheckLike[];
    };
    tpaySandbox?: {
      ready: boolean;
      isProductionDeployment: boolean;
      missing: string[];
      invalid: string[];
      warnings: ReadinessCheckLike[];
      oauth: {
        selectedEnvironment: "sandbox" | "production";
        merchantId: { present: boolean; looksPlaceholder: boolean };
        apiKey: { present: boolean; looksPlaceholder: boolean };
        apiSecret: { present: boolean; looksPlaceholder: boolean };
        webhookSecret: { present: boolean; looksPlaceholder: boolean };
      };
    };
    email?: {
      config: {
        resendApiKeyPresent: boolean;
        resendFromEmailPresent: boolean;
        resendReplyToPresent: boolean;
        emailTestMode: boolean;
        emailTestRecipientPresent: boolean;
        warnings: string[];
      };
    };
    shipping?: {
      providers: {
        provider: string;
        configured: boolean;
        enabled: boolean;
        apiTokenPresent: boolean;
        organizationIdPresent: boolean;
        missing: string[];
        warnings: string[];
      }[];
    };
  };
};

export type LaunchReadinessResult = {
  score: number;
  blockers: LaunchBlocker[];
  counts: Record<LaunchBlockerPriority, number>;
  checkoutGated: boolean;
  visibleProductCount: number;
  realProductCount: number;
  legalCopy: {
    unsafeCount: number;
    placeholderCount: number;
    pendingMarkerCount: number;
  };
};

export const launchReadinessScore = 56;
export const launchReadinessPriorities: LaunchBlockerPriority[] = [
  "critical",
  "high",
  "medium",
  "low",
];

const sandboxProductId = "prod-tpay-sandbox-test";
const requiredSpecKeys = ["material", "fit", "color", "care"];

const unsafeLegalPattern =
  /Magdalena Grabowska|Aleja Rzeczypospolitej|Seller:\s*Magdalena|Sprzedawca:\s*Magdalena|Administrator danych:\s*Magdalena/i;
const placeholderPattern =
  /\[[^\]]+\]|TBD|PLACEHOLDER/i;
const pendingMarkerPattern =
  /pending|do uzupełnienia|do potwierdzenia|to be completed|to be confirmed|wymaga uzupełnienia|draft|roboczy|not ready/i;

function isBlank(value: unknown) {
  return typeof value !== "string" || value.trim().length === 0;
}

function hasPlaceholder(value: unknown) {
  return typeof value === "string" && placeholderPattern.test(value);
}

function hasPendingMarker(value: unknown) {
  return typeof value === "string" && pendingMarkerPattern.test(value);
}

function collectStorePageStrings(value: unknown, acc: string[] = []) {
  if (typeof value === "string") {
    acc.push(value);
    return acc;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStorePageStrings(item, acc);
    }
    return acc;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectStorePageStrings(item, acc);
    }
  }

  return acc;
}

function legalCopySummary() {
  const strings = collectStorePageStrings(storePages);

  return {
    unsafeCount: strings.filter((item) => unsafeLegalPattern.test(item)).length,
    placeholderCount: strings.filter((item) => placeholderPattern.test(item)).length,
    pendingMarkerCount: strings.filter((item) => pendingMarkerPattern.test(item)).length,
  };
}

function makeCounts(blockers: LaunchBlocker[]) {
  return launchReadinessPriorities.reduce(
    (acc, priority) => ({
      ...acc,
      [priority]: blockers.filter((blocker) => blocker.priority === priority).length,
    }),
    { critical: 0, high: 0, medium: 0, low: 0 } as Record<LaunchBlockerPriority, number>,
  );
}

function add(blockers: LaunchBlocker[], blocker: LaunchBlocker) {
  blockers.push(blocker);
}

export function getLaunchReadiness(snapshot: LaunchReadinessInput): LaunchReadinessResult {
  const blockers: LaunchBlocker[] = [];
  const realProducts = snapshot.products.filter((product) => product.id !== sandboxProductId);
  const liveDrops = snapshot.drops.filter((drop) => drop.status === "live");
  const visibleProductCount = realProducts.filter(
    (product) => product.status === "active" && product.isVisible,
  ).length;
  const checkoutGated =
    !snapshot.settings.shopEnabled &&
    snapshot.settings.shopMode === "PRE_LAUNCH" &&
    liveDrops.length === 0;
  const legal = snapshot.diagnostics?.legalReadiness;
  const legalCopy = legalCopySummary();

  if (!legal || legal.sellerDataStatus === "pending") {
    add(blockers, {
      priority: "critical",
      area: "Legal / seller",
      title: "Seller data is pending",
      detail: "Seller legal name, address, return address and tax identity are not confirmed.",
      action: "Complete real seller fields only after the business form is confirmed.",
    });
  }

  if (!legal || legal.legalStatus === "pending") {
    add(blockers, {
      priority: "critical",
      area: "Legal / seller",
      title: "Legal status is pending",
      detail: "Terms, privacy, returns, delivery and payment pages are still draft documents.",
      action: "Run final legal review after seller data and checkout model are confirmed.",
    });
  }

  if (!legal) {
    add(blockers, {
      priority: "critical",
      area: "Legal / seller",
      title: "Business model status is unavailable",
      detail: "The launch cannot assume a legal sales model without admin legal diagnostics.",
      action: "Restore legal readiness diagnostics before publishing checkout.",
    });
  } else if (legal.businessRegistrationStatus === "unregistered_activity_planned") {
    add(blockers, {
      priority: "critical",
      area: "Legal / seller",
      title: "Business model selected: działalność nierejestrowana planned",
      detail:
        "Launch still blocked until seller identity, legal pages, return/contact data, sales limit controls and product readiness are completed.",
      action:
        "Keep checkout gated and complete the działalność nierejestrowana operational controls before launch rehearsal.",
    });
  }

  add(blockers, {
    priority: "critical",
    area: "Revenue limit",
    title: "Działalność nierejestrowana revenue tracking is required",
    detail:
      "The first drop must stay within the applicable działalność nierejestrowana revenue limit; the store does not yet enforce or report this limit.",
    action:
      "Add an operational revenue tracker before launch and reconcile it against all paid orders.",
  });

  add(blockers, {
    priority: "high",
    area: "Sales records",
    title: "Simplified sales register is not ready",
    detail:
      "Działalność nierejestrowana requires a simplified sales register / ewidencja sprzedaży process.",
    action: "Prepare daily sales register export/process before accepting real orders.",
  });

  add(blockers, {
    priority: "medium",
    area: "Tax operations",
    title: "Invoices and cost documents collection is not defined",
    detail:
      "The launch needs a simple process for collecting order confirmations, invoices and cost documents.",
    action: "Create a document collection workflow before the first paid order.",
  });

  add(blockers, {
    priority: "medium",
    area: "Tax operations",
    title: "PIT settlement reminder is missing",
    detail:
      "Income under działalność nierejestrowana still needs PIT settlement planning.",
    action: "Add an operational reminder/checklist item for annual PIT settlement.",
  });

  add(blockers, {
    priority: "medium",
    area: "VAT",
    title: "No VAT recovery assumed",
    detail:
      "The preview should assume no VAT recovery unless a different tax/VAT decision is made later.",
    action: "Keep VAT recovery out of launch economics until a separate tax decision is made.",
  });

  for (const field of [
    ["seller legal name", snapshot.settings.sellerName],
    ["seller address", snapshot.settings.sellerAddress],
    ["return address", snapshot.settings.returnAddress],
    ["legal document version", snapshot.settings.legalDocumentVersion],
  ] as const) {
    if (isBlank(field[1]) || hasPlaceholder(field[1]) || hasPendingMarker(field[1])) {
      add(blockers, {
        priority: "critical",
        area: "Legal / seller",
        title: `${field[0]} is not launch-ready`,
        detail: `${field[0]} is empty, placeholder, or marked pending.`,
        action: "Do not invent this value; complete it only with confirmed seller/legal data.",
      });
    }
  }

  if (legalCopy.unsafeCount > 0) {
    add(blockers, {
      priority: "critical",
      area: "Public legal copy",
      title: "Unsafe hardcoded seller/address copy remains",
      detail: `${legalCopy.unsafeCount} public legal/help strings still look like final seller or address data.`,
      action: "Replace hardcoded seller/address claims with draft/pending language.",
    });
  }

  if (legalCopy.placeholderCount > 0 || legalCopy.pendingMarkerCount > 0) {
    add(blockers, {
      priority: "critical",
      area: "Public legal copy",
      title: "Legal pages are still draft/pending",
      detail: `${legalCopy.placeholderCount} placeholder strings and ${legalCopy.pendingMarkerCount} pending markers were found in public legal/help copy.`,
      action: "Keep checkout blocked until final legal pages are completed and reviewed.",
    });
  }

  if (snapshot.settings.shopEnabled && (!legal || !legal.readyForPublicCheckout)) {
    add(blockers, {
      priority: "critical",
      area: "Checkout gating",
      title: "shopEnabled=true while legal readiness is blocked",
      detail: "Public checkout cannot be enabled while seller/legal data is pending.",
      action: "Keep shopEnabled=false until Critical blockers are resolved.",
    });
  }

  if (!checkoutGated) {
    add(blockers, {
      priority: "critical",
      area: "Checkout gating",
      title: "Checkout is not fully gated",
      detail: `shopEnabled=${String(snapshot.settings.shopEnabled)}, shopMode=${snapshot.settings.shopMode}, liveDrops=${liveDrops.length}.`,
      action: "Keep shopEnabled=false, shopMode=PRE_LAUNCH and drops non-live until launch rehearsal passes.",
    });
  }

  if (visibleProductCount > 0 && snapshot.settings.shopMode === "PRE_LAUNCH") {
    add(blockers, {
      priority: "critical",
      area: "Products",
      title: "Products are visible during PRE_LAUNCH",
      detail: `${visibleProductCount} real active product(s) are public-visible while shopMode=PRE_LAUNCH.`,
      action: "Keep real products hidden/draft until the public launch pass.",
    });
  }

  if (realProducts.length === 0) {
    add(blockers, {
      priority: "high",
      area: "Products",
      title: "No real product records",
      detail: "The store needs real draft product records for Hoodie, T-shirt and Zip hoodie before launch rehearsal.",
      action: "Create draft products with real media, variants, stock and specs.",
    });
  }

  for (const product of realProducts) {
    const variants = snapshot.variants.filter((variant) => variant.productId === product.id);
    const images = snapshot.images.filter((image) => image.productId === product.id);
    const specs = product.specifications ?? {};
    const specText = [
      product.shortDescription,
      product.editorialDescription,
      product.technicalDescription,
      ...Object.values(specs),
    ].join("\n");
    const totalStock = variants.reduce(
      (sum, variant) => sum + Math.max(0, variant.stockQuantity - variant.reservedQuantity),
      0,
    );

    if (images.length === 0) {
      add(blockers, {
        priority: "critical",
        area: "Products",
        title: `${product.name} has no real images`,
        detail: "Fashion launch requires real product imagery, not placeholders.",
        action: "Upload final product photos or approved visualizations before launch rehearsal.",
      });
    }

    if (variants.length === 0 || variants.every((variant) => isBlank(variant.size))) {
      add(blockers, {
        priority: "critical",
        area: "Products",
        title: `${product.name} has missing size variants`,
        detail: "The product cannot be sold without concrete size variants.",
        action: "Add size variants and SKUs for the launch range.",
      });
    }

    if (!product.sizeGuide?.apparel?.length) {
      add(blockers, {
        priority: "high",
        area: "Products",
        title: `${product.name} has no measurements`,
        detail: "Clothing products need a size guide or measurements to reduce returns.",
        action: "Add size guide rows with garment measurements.",
      });
    }

    const missingSpecs = requiredSpecKeys.filter((key) => isBlank(specs[key]) || hasPlaceholder(specs[key]));
    if (isBlank(product.technicalDescription) || missingSpecs.length > 0 || hasPlaceholder(specText)) {
      add(blockers, {
        priority: "high",
        area: "Products",
        title: `${product.name} has missing material/fit/care content`,
        detail: missingSpecs.length ? `Missing or placeholder fields: ${missingSpecs.join(", ")}.` : "Technical description is missing or placeholder.",
        action: "Complete material, composition, fit and care information with confirmed production specs.",
      });
    }

    if (totalStock <= 0 || variants.every((variant) => !variant.isAvailable)) {
      add(blockers, {
        priority: "critical",
        area: "Inventory",
        title: `${product.name} has no launch stock`,
        detail: `Available stock is ${totalStock}.`,
        action: "Enter confirmed stock quantities only after production inventory is known.",
      });
    }
  }

  const enabledDelivery = snapshot.settings.deliveryMethods.filter((method) => method.enabled);
  if (enabledDelivery.length === 0) {
    add(blockers, {
      priority: "critical",
      area: "Delivery",
      title: "No delivery methods are enabled",
      detail: "Checkout cannot launch without an enabled delivery method.",
      action: "Confirm delivery method, price and handling process before launch.",
    });
  }

  for (const method of enabledDelivery) {
    if (method.price <= 0 || isBlank(method.estimatedDeliveryTime)) {
      add(blockers, {
        priority: "high",
        area: "Delivery",
        title: `${method.name} delivery details are incomplete`,
        detail: "Enabled delivery methods need final pricing and estimated timing.",
        action: "Finalize delivery prices and delivery-time copy before launch.",
      });
    }
  }

  const inpost = snapshot.diagnostics?.shipping?.providers.find(
    (provider) => provider.provider === "inpost",
  );
  if (!inpost || !inpost.configured || inpost.missing.length > 0) {
    add(blockers, {
      priority: "critical",
      area: "Fulfillment",
      title: "InPost fulfillment is not ready",
      detail: inpost ? `Missing: ${inpost.missing.join(", ") || "configuration verification"}.` : "No InPost diagnostics are available.",
      action: "Configure and test InPost sandbox/manual fulfillment before launch rehearsal.",
    });
  }

  const tpay = snapshot.diagnostics?.tpaySandbox;
  if (!tpay?.ready) {
    add(blockers, {
      priority: "high",
      area: "Payments",
      title: "Tpay sandbox readiness is incomplete",
      detail: `Missing: ${tpay?.missing.join(", ") || "Tpay diagnostics unavailable"}.`,
      action: "Resolve sandbox diagnostics before live payment rehearsal.",
    });
  }

  if (tpay?.oauth.selectedEnvironment !== "production") {
    add(blockers, {
      priority: "critical",
      area: "Payments",
      title: "Production payment rehearsal is not completed",
      detail: "The store is intentionally not using production Tpay credentials in preview.",
      action: "Schedule a separate production payment rehearsal after legal/seller data is complete.",
    });
  }

  const emailConfig = snapshot.diagnostics?.email?.config;
  if (!emailConfig?.resendApiKeyPresent || !emailConfig.resendFromEmailPresent) {
    add(blockers, {
      priority: "high",
      area: "Email",
      title: "Resend sending is not configured",
      detail: "RESEND_API_KEY and/or RESEND_FROM_EMAIL are missing in this environment.",
      action: "Configure preview email safely, then repeat with production only during launch rehearsal.",
    });
  }

  if (!snapshot.emailEvents.some((event) => event.status === "sent")) {
    add(blockers, {
      priority: "medium",
      area: "Email",
      title: "No successful email test event",
      detail: "EmailEvent logging exists, but no successful sent event is recorded in the current store data.",
      action: "Run safe admin test-send after Resend preview settings are configured.",
    });
  }

  add(blockers, {
    priority: "critical",
    area: "Launch rehearsal",
    title: "Production payment/email/delivery rehearsal is not completed",
    detail: "The audit requires a final rehearsal after legal data, product stock, delivery and live-provider configuration are ready.",
    action: "Keep launch controls blocked until a documented launch rehearsal passes.",
  });

  add(blockers, {
    priority: "low",
    area: "SEO / indexing",
    title: "Preview noindex should be rechecked after each deploy",
    detail: "Preview/staging pages must remain noindex,nofollow; production SEO can be prepared separately.",
    action: "Verify preview metadata and robots headers after deployment.",
  });

  return {
    score: launchReadinessScore,
    blockers,
    counts: makeCounts(blockers),
    checkoutGated,
    visibleProductCount,
    realProductCount: realProducts.length,
    legalCopy,
  };
}
