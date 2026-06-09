"use client";

import { useEffect, useMemo, useState } from "react";

const sandboxProductId = "prod-tpay-sandbox-test";

type StoreSnapshot = {
  products: {
    id: string;
    name: string;
    slug: string;
    status: string;
    isVisible: boolean;
    isFeatured: boolean;
    price: number;
    shortDescription: string;
    editorialDescription: string;
    technicalDescription: string;
    seoTitle?: string;
    seoDescription?: string;
    internalNotes?: string;
    specifications?: Record<string, string>;
    sizeGuide?: {
      apparel?: {
        size: string;
        chestWidth: string;
        length: string;
        sleeveLength?: string;
        shoulderWidth?: string;
      }[];
      eyewear?: {
        lensWidth: string;
        bridgeWidth: string;
        templeLength: string;
        frameWidth?: string;
      };
    };
    categoryId: string | null;
    dropId: string | null;
  }[];
  variants: {
    id: string;
    productId: string;
    size: string;
    sku: string;
    stockQuantity: number;
    reservedQuantity: number;
    isAvailable: boolean;
    priceOverride?: number | null;
  }[];
  images: {
    id: string;
    productId: string;
    url: string;
    alt: string;
    sortOrder: number;
    isPrimary: boolean;
    createdAt: string;
  }[];
  categories: { id: string; name: string; slug: string }[];
  drops: { id: string; name: string; status: string; launchDate: string | null }[];
  orders: {
    id: string;
    orderNumber: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    orderStatus: string;
    total: number;
    provider: string;
    providerTransactionId?: string | null;
    providerPaymentId?: string | null;
    paidAt?: string | null;
    rawEventIds?: string[];
    lastWebhookEvent?: {
      id: string;
      status: string | null;
      amount: number | null;
      currency: string | null;
      createdAt: string | null;
    } | null;
    timeline?: {
      type: string;
      status: string | null;
      at: string;
      details: string | null;
    }[];
    delivery: {
      deliveryMethod: string;
      deliveryPrice: number;
      deliveryStatus: string;
      shipmentProvider: string;
      trackingNumber: string | null;
      trackingUrl: string | null;
      parcelLockerId: string | null;
      parcelLockerName: string | null;
      parcelLockerAddress: string | null;
      shippedAt: string | null;
      adminNote: string | null;
    };
    shipments?: {
      id: string;
      orderId: string;
      provider: string;
      providerShipmentId: string | null;
      providerTrackingNumber: string | null;
      trackingUrl: string | null;
      labelUrl: string | null;
      labelFormat: string | null;
      status: string;
      serviceCode: string | null;
      parcelLockerId: string | null;
      parcelLockerName: string | null;
      parcelLockerAddress: string | null;
      providerErrorSummary: string | null;
      createdAt: string;
      shippedAt: string | null;
      deliveredAt: string | null;
      cancelledAt: string | null;
    }[];
    stock?: {
      productName: string;
      sku: string;
      size: string;
      orderedQuantity: number;
      currentStock: number | null;
      currentReserved: number | null;
    }[];
    customer: { email: string };
    createdAt: string;
  }[];
  webhookEvents: {
    id: string;
    provider: string | null;
    orderId: string | null;
    providerTransactionId: string | null;
    providerPaymentId: string | null;
    status: string | null;
    amount: number | null;
    currency: string | null;
    createdAt: string | null;
  }[];
  returns: { id: string; orderId: string; status: string; customerEmail: string }[];
  complaints: { id: string; orderId: string; status: string; customerEmail: string }[];
  newsletterSubscribers: { id: string; email: string; status: string; earlyAccess: boolean }[];
  emailEvents: {
    id: string;
    orderId?: string | null;
    recipientEmail: string;
    template: string;
    provider: string;
    status: string;
    providerMessageId?: string | null;
    errorSummary?: string | null;
    createdAt: string;
    sentAt?: string | null;
  }[];
  discounts: { id: string; code: string; type: string; value: number; isActive: boolean }[];
  settings: {
    shopEnabled: boolean;
    maintenanceMode: boolean;
    shopMode: string;
    defaultDeliveryPrice: number;
    freeShippingThreshold: number;
    contactEmail: string;
    supportEmail: string;
    sellerName: string;
    sellerAddress: string;
    nip: string;
    regon: string;
    returnAddress: string;
    defaultCurrency: string;
    defaultCountry: string;
    legalDocumentVersion: string;
    deliveryMethods: {
      id: string;
      name: string;
      type: "parcel_locker" | "courier" | "manual_pickup";
      provider: "inpost" | "manual";
      price: number;
      currency: "PLN";
      estimatedDeliveryTime: string;
      enabled: boolean;
      displayOrder: number;
    }[];
  };
  diagnostics?: {
    tpaySandbox: {
      environment: {
        nodeEnv: string | null;
        vercelEnv: string | null;
      };
      isStagingLike: boolean;
      isProductionDeployment: boolean;
      ready: boolean;
      envChecks: ReadinessCheck[];
      databaseChecks: ReadinessCheck[];
      warnings: ReadinessCheck[];
      missing: string[];
      invalid: string[];
      webhookPath: string;
      webhookUrl: string | null;
      siteUrl: {
        present: boolean;
        originalLength: number;
        sanitized: string | null;
        strippedKeyPrefix: boolean;
      };
    };
    email: {
      config: {
        resendApiKeyPresent: boolean;
        resendFromEmailPresent: boolean;
        resendReplyToPresent: boolean;
        emailTestMode: boolean;
        emailTestRecipientPresent: boolean;
        vercelEnv: string | null;
        nodeEnv: string | null;
        warnings: string[];
      };
      templates: { id: string; label: string }[];
    };
    shipping: {
      providers: {
        provider: string;
        configured: boolean;
        enabled: boolean;
        environment: string;
        testMode: boolean;
        apiTokenPresent: boolean;
        organizationIdPresent: boolean;
        defaultSenderIdPresent?: boolean;
        defaultService: string | null;
        labelFormat: string;
        missing: string[];
        warnings: string[];
      }[];
    };
  };
};

type ReadinessStatus = "pass" | "warn" | "fail";

type ReadinessCheck = {
  label: string;
  status: ReadinessStatus;
  detail: string;
};

type TpaySandboxDiagnostics = NonNullable<StoreSnapshot["diagnostics"]>["tpaySandbox"];

const tabs = [
  "dashboard",
  "products",
  "inventory",
  "drops",
  "orders",
  "returns",
  "complaints",
  "newsletter",
  "emails",
  "discounts",
  "settings",
] as const;

type Tab = (typeof tabs)[number];

function money(amount: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount / 100);
}

function providerLabel(provider: string) {
  if (provider === "tpay") {
    return "Tpay";
  }

  if (provider === "przelewy24") {
    return "Przelewy24";
  }

  if (provider === "payu") {
    return "PayU";
  }

  return provider;
}

function readinessDetail(
  diagnostics: TpaySandboxDiagnostics | undefined,
  label: string,
) {
  return (
    diagnostics?.envChecks.find((check) => check.label === label)?.detail ?? "-"
  );
}

export function AdminStorePage() {
  const [token, setToken] = useState("");
  const [snapshot, setSnapshot] = useState<StoreSnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [productStatusFilter, setProductStatusFilter] = useState("all");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productDropFilter, setProductDropFilter] = useState("all");
  const [productVisibilityFilter, setProductVisibilityFilter] = useState("all");
  const [productCompletenessFilter, setProductCompletenessFilter] = useState("all");
  const [previewProductId, setPreviewProductId] = useState<string | null>(null);
  const [emailTemplate, setEmailTemplate] = useState("order_created");
  const [emailSample, setEmailSample] = useState("synthetic");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailPreview, setEmailPreview] = useState<{
    subject: string;
    html: string;
    text: string;
  } | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    setMessage("");
    const response = await fetch("/api/admin/store", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      setMessage("Brak dostępu albo niepoprawny token.");
      return;
    }

    setSnapshot((await response.json()) as StoreSnapshot);
  }

  async function action(actionName: string, payload: Record<string, unknown>) {
    const response = await fetch("/api/admin/store", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: actionName, payload }),
    });

    const data = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setMessage(data.error ?? "Nie udało się zapisać zmian.");
      return;
    }

    setMessage(data.message ?? "Zapisano.");
    await load();
  }

  async function previewEmail() {
    const response = await fetch("/api/admin/store", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "email.preview",
        payload: { template: emailTemplate, sample: emailSample },
      }),
    });
    const data = (await response.json()) as {
      error?: string;
      result?: { preview: { subject: string; html: string; text: string } };
    };

    if (!response.ok) {
      setMessage(data.error ?? "Nie udało się wyrenderować maila.");
      return;
    }

    setEmailPreview(data.result?.preview ?? null);
    setMessage("Preview maila gotowy.");
  }

  async function sendEmailTest() {
    const response = await fetch("/api/admin/store", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "email.testSend",
        payload: { template: emailTemplate, recipient: emailRecipient },
      }),
    });
    const data = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setMessage(data.error ?? "Nie udało się wysłać testu.");
      return;
    }

    setMessage(data.message ?? "Test mail obsłużony.");
    await load();
  }

  async function uploadProductImage(productId: string, file: File, alt: string, isPrimary: boolean) {
    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("alt", alt);
    formData.set("isPrimary", String(isPrimary));
    formData.set("file", file);

    const response = await fetch("/api/admin/store/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(data.error ?? "Nie udało się wgrać obrazu.");
      return;
    }

    setMessage("Obraz dodany.");
    await load();
  }

  function exportOrdersCsv() {
    if (!snapshot) {
      return;
    }

    const rows = [
      ["orderNumber", "email", "total", "provider", "providerTransactionId", "paymentStatus", "fulfillmentStatus", "paidAt", "lastWebhookStatus", "createdAt"],
      ...snapshot.orders.map((order) => [
        order.orderNumber,
        order.customer.email,
        String(order.total / 100),
        providerLabel(order.provider),
        order.providerTransactionId ?? "",
        order.paymentStatus,
        order.fulfillmentStatus,
        order.paidAt ?? "",
        order.lastWebhookEvent?.status ?? "",
        order.createdAt,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "garconmaires-orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const metrics = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    return [
      ["Orders", snapshot.orders.length],
      ["Products", snapshot.products.length],
      ["Reservations", snapshot.variants.reduce((sum, item) => sum + item.reservedQuantity, 0)],
      ["Newsletter", snapshot.newsletterSubscribers.length],
    ];
  }, [snapshot]);
  const filteredProducts = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    return snapshot.products.filter((product) => {
      const productImages = snapshot.images.filter((image) => image.productId === product.id);
      const productVariants = snapshot.variants.filter((variant) => variant.productId === product.id);
      const warnings = productWarnings(product, productVariants, productImages, snapshot);
      const stockState = productVariants.some((variant) => variant.stockQuantity > 0)
        ? "has_stock"
        : "no_stock";

      return (
        (productStatusFilter === "all" || product.status === productStatusFilter) &&
        (productCategoryFilter === "all" || product.categoryId === productCategoryFilter) &&
        (productDropFilter === "all" || product.dropId === productDropFilter) &&
        (productVisibilityFilter === "all" ||
          (productVisibilityFilter === "visible" ? product.isVisible : !product.isVisible) ||
          productVisibilityFilter === stockState) &&
        (productCompletenessFilter === "all" ||
          (productCompletenessFilter === "missing_images" && productImages.length === 0) ||
          (productCompletenessFilter === "incomplete_specs" &&
            warnings.some((warning) => warning.code === "placeholder_specs")))
      );
    });
  }, [
    productCategoryFilter,
    productCompletenessFilter,
    productDropFilter,
    productStatusFilter,
    productVisibilityFilter,
    snapshot,
  ]);
  const previewProduct = snapshot?.products.find(
    (product) => product.id === previewProductId,
  );

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-white/38">
              Garçonmaires admin
            </p>
            <h1 className="mt-3 font-display text-5xl leading-none">
              Store backend
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="ORDER_ADMIN_TOKEN"
              className="border border-white/15 bg-black px-4 py-3 text-sm text-white outline-none"
              type="password"
            />
            <button
              type="button"
              onClick={load}
              className="bg-white px-5 py-3 text-xs uppercase tracking-[0.24em] text-black"
            >
              Open
            </button>
          </div>
        </div>

        {message ? <p className="mt-5 text-sm text-white/60">{message}</p> : null}

        {snapshot ? (
          <>
            <TpayDiagnostics
              diagnostics={snapshot.diagnostics?.tpaySandbox}
              onReset={() => action("tpaySandbox.reset", {})}
            />

            <nav className="mt-8 flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={
                    activeTab === tab
                      ? "border border-white bg-white px-3 py-2 text-xs uppercase tracking-[0.18em] text-black"
                      : "border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/55 hover:text-white"
                  }
                >
                  {tab}
                </button>
              ))}
            </nav>

            {activeTab === "dashboard" ? (
              <section className="mt-8 grid gap-4 md:grid-cols-4">
                {metrics.map(([label, value]) => (
                  <div key={label} className="border border-white/10 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/38">
                      {label}
                    </p>
                    <p className="mt-4 text-3xl">{value}</p>
                  </div>
                ))}
              </section>
            ) : null}

            {activeTab === "products" ? (
              <section className="mt-8 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {["all", "draft", "hidden", "active", "sold_out", "archived"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setProductStatusFilter(status)}
                      className={
                        productStatusFilter === status
                          ? "border border-white bg-white px-3 py-2 text-xs uppercase tracking-[0.18em] text-black"
                          : "border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/55"
                      }
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <SelectField
                    label="category"
                    value={productCategoryFilter}
                    options={[
                      { value: "all", label: "all categories" },
                      ...snapshot.categories.map((category) => ({
                        value: category.id,
                        label: category.name,
                      })),
                    ]}
                    onChange={setProductCategoryFilter}
                  />
                  <SelectField
                    label="drop"
                    value={productDropFilter}
                    options={[
                      { value: "all", label: "all drops" },
                      ...snapshot.drops.map((drop) => ({
                        value: drop.id,
                        label: drop.name,
                      })),
                    ]}
                    onChange={setProductDropFilter}
                  />
                  <SelectField
                    label="visibility/stock"
                    value={productVisibilityFilter}
                    options={[
                      { value: "all", label: "all" },
                      { value: "visible", label: "visible" },
                      { value: "hidden", label: "hidden" },
                      { value: "has_stock", label: "has stock" },
                      { value: "no_stock", label: "no stock" },
                    ]}
                    onChange={setProductVisibilityFilter}
                  />
                  <SelectField
                    label="completeness"
                    value={productCompletenessFilter}
                    options={[
                      { value: "all", label: "all" },
                      { value: "missing_images", label: "missing images" },
                      { value: "incomplete_specs", label: "incomplete specs" },
                    ]}
                    onChange={setProductCompletenessFilter}
                  />
                </div>

                {previewProduct ? (
                  <ProductPreview
                    product={previewProduct}
                    variants={snapshot.variants.filter((variant) => variant.productId === previewProduct.id)}
                    images={snapshot.images.filter((image) => image.productId === previewProduct.id)}
                    onClose={() => setPreviewProductId(null)}
                  />
                ) : null}

                {filteredProducts.map((product) => (
                  <ProductEditor
                    key={product.id}
                    product={product}
                    variants={snapshot.variants.filter((variant) => variant.productId === product.id)}
                    images={snapshot.images.filter((image) => image.productId === product.id)}
                    categories={snapshot.categories}
                    drops={snapshot.drops}
                    snapshot={snapshot}
                    onAction={action}
                    onUploadImage={uploadProductImage}
                    onPreview={() => setPreviewProductId(product.id)}
                  />
                ))}
              </section>
            ) : null}

            {activeTab === "inventory" ? (
              <section className="mt-8 grid gap-3">
                {snapshot.variants.map((variant) => {
                  const duplicate = snapshot.variants.some(
                    (item) => item.id !== variant.id && item.sku === variant.sku,
                  );
                  const availableStock = variant.stockQuantity - variant.reservedQuantity;
                  const product = snapshot.products.find((item) => item.id === variant.productId);

                  return (
                    <div key={variant.id} className="grid gap-3 border border-white/10 p-4 xl:grid-cols-[1fr_0.7fr_0.5fr_0.5fr_0.5fr_auto_auto] xl:items-end">
                      <div>
                        <p>{variant.sku} / {variant.size}</p>
                        <p className="mt-1 text-xs text-white/45">
                          {product?.name ?? variant.productId} / stock {variant.stockQuantity}, reserved {variant.reservedQuantity}, available {availableStock}
                        </p>
                        {duplicate ? <p className="mt-2 text-xs text-red-200">Duplicate SKU warning.</p> : null}
                        {variant.reservedQuantity > variant.stockQuantity ? <p className="mt-2 text-xs text-red-200">Reserved exceeds stock.</p> : null}
                        {variant.stockQuantity < 0 ? <p className="mt-2 text-xs text-red-200">Stock is negative.</p> : null}
                      </div>
                      <SettingsField label="SKU" value={variant.sku} onSave={(value) => action("variant.upsert", { ...variant, sku: value })} />
                      <SettingsField label="size" value={variant.size} onSave={(value) => action("variant.upsert", { ...variant, size: value })} />
                      <SettingsField label="stock" value={String(variant.stockQuantity)} onSave={(value) => action("variant.upsert", { ...variant, stockQuantity: Number(value) || 0 })} />
                      <SettingsField label="price override PLN" value={variant.priceOverride ? String(variant.priceOverride / 100) : ""} onSave={(value) => action("variant.upsert", { ...variant, priceOverride: value ? Math.round(Number(value) * 100) : null })} />
                      <button type="button" onClick={() => action("variant.upsert", { ...variant, isAvailable: !variant.isAvailable })} className="bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-black">
                        {variant.isAvailable ? "Disable" : "Enable"}
                      </button>
                      <button type="button" onClick={() => action("variant.delete", { id: variant.id })} className="border border-red-300/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-red-100">
                        Delete
                      </button>
                    </div>
                  );
                })}
              </section>
            ) : null}

            {activeTab === "drops" ? (
              <section className="mt-8 space-y-3">
                {snapshot.drops.map((drop) => (
                  <div key={drop.id} className="flex flex-wrap items-center justify-between gap-4 border border-white/10 p-4">
                    <p>{drop.name} <span className="text-white/45">/ {drop.status}</span></p>
                    <div className="flex gap-2">
                      {["draft", "upcoming", "early_access", "live", "closed"].map((status) => (
                        <button key={status} type="button" onClick={() => action("drop.upsert", { ...drop, status })} className="border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.18em]">
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ) : null}

            {activeTab === "orders" ? (
              <section className="mt-8 space-y-3">
                <button type="button" onClick={exportOrdersCsv} className="bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-black">
                  Export CSV
                </button>
                {snapshot.orders.map((order) => (
                  <div key={order.id} className="grid gap-4 border border-white/10 p-4 lg:grid-cols-[1fr_auto] lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <p className="text-lg">{order.orderNumber}</p>
                        <p className="text-sm text-white/45">{order.customer.email}</p>
                        <p className="text-sm text-white/45">{money(order.total)}</p>
                      </div>

                      <div className="mt-4 grid gap-2 text-xs text-white/55 md:grid-cols-2 xl:grid-cols-3">
                        <DiagnosticField label="payment provider" value={providerLabel(order.provider)} />
                        <DiagnosticField label="providerTransactionId" value={order.providerTransactionId ?? "-"} />
                        <DiagnosticField label="providerPaymentId" value={order.providerPaymentId ?? "-"} />
                        <DiagnosticField label="payment status" value={order.paymentStatus} />
                        <DiagnosticField label="fulfillmentStatus" value={order.fulfillmentStatus} />
                        <DiagnosticField label="delivery method" value={order.delivery.deliveryMethod} />
                        <DiagnosticField label="delivery price" value={money(order.delivery.deliveryPrice)} />
                        <DiagnosticField label="delivery status" value={order.delivery.deliveryStatus} />
                        <DiagnosticField label="shipment provider" value={order.delivery.shipmentProvider} />
                        <DiagnosticField label="tracking number" value={order.delivery.trackingNumber ?? "-"} />
                        <DiagnosticField label="tracking URL" value={order.delivery.trackingUrl ?? "-"} />
                        <DiagnosticField label="parcel locker ID" value={order.delivery.parcelLockerId ?? "-"} />
                        <DiagnosticField label="parcel locker name" value={order.delivery.parcelLockerName ?? "-"} />
                        <DiagnosticField label="parcel locker address" value={order.delivery.parcelLockerAddress ?? "-"} />
                        <DiagnosticField label="shippedAt" value={order.delivery.shippedAt ?? "-"} />
                        <DiagnosticField label="paidAt" value={order.paidAt ?? "-"} />
                        <DiagnosticField label="last webhook status" value={order.lastWebhookEvent?.status ?? "-"} />
                        <DiagnosticField label="last webhook id" value={order.lastWebhookEvent?.id ?? "-"} />
                      </div>

                      {order.shipments?.length ? (
                        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/38">
                            Shipments
                          </p>
                          {order.shipments.map((shipment) => (
                            <div key={shipment.id} className="grid gap-2 text-xs text-white/55 md:grid-cols-2 xl:grid-cols-3">
                              <DiagnosticField label="shipment status" value={shipment.status} />
                              <DiagnosticField label="provider" value={shipment.provider} />
                              <DiagnosticField label="providerShipmentId" value={shipment.providerShipmentId ?? "-"} />
                              <DiagnosticField label="tracking number" value={shipment.providerTrackingNumber ?? "-"} />
                              <DiagnosticField label="tracking URL" value={shipment.trackingUrl ?? "-"} />
                              <DiagnosticField label="label" value={shipment.labelUrl ? `${shipment.labelFormat ?? "label"} ready` : "-"} />
                              <DiagnosticField label="service" value={shipment.serviceCode ?? "-"} />
                              <DiagnosticField label="last provider error" value={shipment.providerErrorSummary ?? "-"} />
                              <DiagnosticField label="createdAt" value={shipment.createdAt} />
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {order.stock?.length ? (
                        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                          {order.stock.map((item) => (
                            <div key={`${order.id}-${item.sku}`} className="grid gap-2 text-xs text-white/55 md:grid-cols-4">
                              <DiagnosticField label="sku" value={item.sku} />
                              <DiagnosticField label="ordered" value={String(item.orderedQuantity)} />
                              <DiagnosticField label="stockQuantity" value={String(item.currentStock ?? "-")} />
                              <DiagnosticField label="reservedQuantity" value={String(item.currentReserved ?? "-")} />
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {order.timeline?.length ? (
                        <div className="mt-4 border-t border-white/10 pt-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/38">
                            Order timeline
                          </p>
                          <div className="mt-3 space-y-1 text-xs text-white/50">
                            {order.timeline.map((event) => (
                              <p key={`${order.id}-${event.type}-${event.at}-${event.details ?? ""}`}>
                                {event.at} / {event.type} / {event.status ?? "-"}
                                {event.details ? ` / ${event.details}` : ""}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:flex-col">
                      <button
                        type="button"
                        onClick={() => {
                          const provider =
                            window.prompt("Provider: inpost or manual", order.delivery.shipmentProvider || "inpost") ||
                            "inpost";
                          action("shipment.create", { orderId: order.id, provider });
                        }}
                        className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]"
                      >
                        Create shipment
                      </button>
                      <button
                        type="button"
                        onClick={() => action("shipment.label", { orderId: order.id, shipmentId: order.shipments?.[0]?.id })}
                        className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]"
                      >
                        Generate label
                      </button>
                      <button
                        type="button"
                        onClick={() => action("shipment.track", { orderId: order.id, shipmentId: order.shipments?.[0]?.id })}
                        className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]"
                      >
                        Refresh tracking
                      </button>
                      <button
                        type="button"
                        onClick={() => action("shipment.cancel", { orderId: order.id, shipmentId: order.shipments?.[0]?.id })}
                        className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]"
                      >
                        Cancel shipment
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          action("order.delivery.update", {
                            id: order.id,
                            parcelLockerId:
                              window.prompt("Parcel locker ID", order.delivery.parcelLockerId ?? "") ??
                              order.delivery.parcelLockerId,
                            parcelLockerName:
                              window.prompt("Parcel locker name", order.delivery.parcelLockerName ?? "") ??
                              order.delivery.parcelLockerName,
                            parcelLockerAddress:
                              window.prompt("Parcel locker address", order.delivery.parcelLockerAddress ?? "") ??
                              order.delivery.parcelLockerAddress,
                          });
                        }}
                        className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]"
                      >
                        Edit locker
                      </button>
                      <button type="button" onClick={() => action("order.status", { id: order.id, orderStatus: "new", fulfillmentStatus: "unfulfilled", deliveryStatus: "pending" })} className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]">
                        Pending
                      </button>
                      <button type="button" onClick={() => action("order.status", { id: order.id, orderStatus: "processing", fulfillmentStatus: "packing" })} className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]">
                        Packing
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const trackingNumber =
                            order.delivery.trackingNumber ||
                            window.prompt("Tracking number") ||
                            "";

                          if (!trackingNumber.trim()) {
                            setMessage("Tracking number is required before marking shipped.");
                            return;
                          }

                          action("order.status", {
                            id: order.id,
                            orderStatus: "completed",
                            fulfillmentStatus: "shipped",
                            deliveryStatus: "shipped",
                            shipmentProvider: "inpost",
                            trackingNumber,
                          });
                        }}
                        className="bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-black"
                      >
                        Shipped
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const trackingNumber =
                            order.delivery.trackingNumber ||
                            window.prompt("InPost tracking number") ||
                            "";

                          if (!trackingNumber.trim()) {
                            setMessage("Tracking number is required before marking shipped.");
                            return;
                          }

                          action("order.status", {
                            id: order.id,
                            orderStatus: "completed",
                            fulfillmentStatus: "shipped",
                            deliveryStatus: "shipped",
                            shipmentProvider: "inpost",
                            trackingNumber,
                          });
                        }}
                        className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]"
                      >
                        Shipped InPost
                      </button>
                      <button type="button" onClick={() => action("order.status", { id: order.id, orderStatus: "completed", fulfillmentStatus: "delivered", deliveryStatus: "delivered" })} className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]">
                        Delivered
                      </button>
                      <button type="button" onClick={() => action("order.status", { id: order.id, orderStatus: "cancelled", fulfillmentStatus: "unfulfilled", deliveryStatus: "pending" })} className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]">
                        Cancelled
                      </button>
                      <button type="button" onClick={() => action("order.status", { id: order.id, orderStatus: "completed", fulfillmentStatus: "returned", deliveryStatus: "returned" })} className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]">
                        Returned
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            ) : null}

            {activeTab === "returns" ? <SimpleList rows={snapshot.returns} /> : null}
            {activeTab === "complaints" ? <SimpleList rows={snapshot.complaints} /> : null}
            {activeTab === "newsletter" ? <SimpleList rows={snapshot.newsletterSubscribers} /> : null}
            {activeTab === "emails" ? (
              <EmailAdminPanel
                snapshot={snapshot}
                template={emailTemplate}
                sample={emailSample}
                recipient={emailRecipient}
                preview={emailPreview}
                onTemplateChange={setEmailTemplate}
                onSampleChange={setEmailSample}
                onRecipientChange={setEmailRecipient}
                onPreview={previewEmail}
                onTestSend={sendEmailTest}
              />
            ) : null}
            {activeTab === "discounts" ? <SimpleList rows={snapshot.discounts} /> : null}

            {activeTab === "settings" ? (
              <section className="mt-8 space-y-8">
                <div className="grid gap-4 md:grid-cols-2">
                  <button type="button" onClick={() => action("settings.update", { shopEnabled: !snapshot.settings.shopEnabled })} className="border border-white/15 p-5 text-left">
                    shopEnabled: {String(snapshot.settings.shopEnabled)}
                  </button>
                  <button type="button" onClick={() => action("settings.update", { maintenanceMode: !snapshot.settings.maintenanceMode })} className="border border-white/15 p-5 text-left">
                    maintenanceMode: {String(snapshot.settings.maintenanceMode)}
                  </button>
                  <button type="button" onClick={() => action("settings.update", { shopMode: "PRE_LAUNCH" })} className="border border-white/15 p-5 text-left">
                    PRE_LAUNCH
                  </button>
                  <button type="button" onClick={() => action("settings.update", { shopMode: "PUBLIC_DROP" })} className="border border-white/15 p-5 text-left">
                    PUBLIC_DROP
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <SettingsField label="seller legal name" value={snapshot.settings.sellerName} onSave={(value) => action("settings.update", { sellerName: value })} />
                  <SettingsField label="seller address" value={snapshot.settings.sellerAddress} onSave={(value) => action("settings.update", { sellerAddress: value })} />
                  <SettingsField label="seller email" value={snapshot.settings.contactEmail} onSave={(value) => action("settings.update", { contactEmail: value })} />
                  <SettingsField label="support email" value={snapshot.settings.supportEmail} onSave={(value) => action("settings.update", { supportEmail: value })} />
                  <SettingsField label="return address" value={snapshot.settings.returnAddress} onSave={(value) => action("settings.update", { returnAddress: value })} />
                  <SettingsField label="NIP" value={snapshot.settings.nip} onSave={(value) => action("settings.update", { nip: value })} />
                  <SettingsField label="REGON" value={snapshot.settings.regon} onSave={(value) => action("settings.update", { regon: value })} />
                  <SettingsField label="free shipping threshold PLN" value={String(snapshot.settings.freeShippingThreshold / 100)} onSave={(value) => action("settings.update", { freeShippingThreshold: Math.round(Number(value) * 100) || 0 })} />
                  <SettingsField label="standard shipping price PLN" value={String(snapshot.settings.defaultDeliveryPrice / 100)} onSave={(value) => action("settings.update", { defaultDeliveryPrice: Math.round(Number(value) * 100) || 0 })} />
                  <SettingsField label="legal document version" value={snapshot.settings.legalDocumentVersion} onSave={(value) => action("settings.update", { legalDocumentVersion: value })} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <SettingsReadOnly label="default currency" value={snapshot.settings.defaultCurrency} />
                  <SettingsReadOnly label="default country" value={snapshot.settings.defaultCountry} />
                  <SettingsReadOnly label="payment provider" value={readinessDetail(snapshot.diagnostics?.tpaySandbox, "PAYMENT_PROVIDER")} />
                  <SettingsReadOnly label="delivery provider placeholder" value="InPost courier, InPost parcel locker, manual tracking" />
                  {snapshot.diagnostics?.shipping.providers.map((provider) => (
                    <SettingsReadOnly
                      key={provider.provider}
                      label={`${provider.provider} config`}
                      value={[
                        `configured=${String(provider.configured)}`,
                        `enabled=${String(provider.enabled)}`,
                        `env=${provider.environment}`,
                        `test=${String(provider.testMode)}`,
                        `token=${String(provider.apiTokenPresent)}`,
                        `org=${String(provider.organizationIdPresent)}`,
                        provider.missing.length ? `missing=${provider.missing.join(",")}` : null,
                        provider.warnings.length ? `warnings=${provider.warnings.join("; ")}` : null,
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                    />
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/38">
                    Delivery methods
                  </p>
                  {snapshot.settings.deliveryMethods.map((method) => (
                    <div key={method.id} className="grid gap-4 border border-white/10 p-5 lg:grid-cols-[1fr_0.7fr_0.7fr_auto] lg:items-end">
                      <div>
                        <p className="text-sm text-white">{method.name}</p>
                        <p className="mt-1 text-xs text-white/45">
                          {method.id} / {method.type} / {method.provider} / order {method.displayOrder}
                        </p>
                      </div>
                      <SettingsField
                        label="price PLN"
                        value={String(method.price / 100)}
                        onSave={(value) =>
                          action("settings.update", {
                            deliveryMethods: snapshot.settings.deliveryMethods.map((item) =>
                              item.id === method.id
                                ? { ...item, price: Math.round(Number(value) * 100) || 0 }
                                : item,
                            ),
                          })
                        }
                      />
                      <SettingsField
                        label="estimated time"
                        value={method.estimatedDeliveryTime}
                        onSave={(value) =>
                          action("settings.update", {
                            deliveryMethods: snapshot.settings.deliveryMethods.map((item) =>
                              item.id === method.id
                                ? { ...item, estimatedDeliveryTime: value }
                                : item,
                            ),
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          action("settings.update", {
                            deliveryMethods: snapshot.settings.deliveryMethods.map((item) =>
                              item.id === method.id
                                ? { ...item, enabled: !item.enabled }
                                : item,
                            ),
                          })
                        }
                        className="border border-white/15 px-4 py-3 text-xs uppercase tracking-[0.2em]"
                      >
                        {method.enabled ? "Disable" : "Enable"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}

function DiagnosticField({ label, value }: { label: string; value: string }) {
  return (
    <p className="min-w-0">
      <span className="block uppercase tracking-[0.18em] text-white/30">{label}</span>
      <span className="mt-1 block break-words text-white/68">{value}</span>
    </p>
  );
}

function EmailAdminPanel({
  snapshot,
  template,
  sample,
  recipient,
  preview,
  onTemplateChange,
  onSampleChange,
  onRecipientChange,
  onPreview,
  onTestSend,
}: {
  snapshot: StoreSnapshot;
  template: string;
  sample: string;
  recipient: string;
  preview: { subject: string; html: string; text: string } | null;
  onTemplateChange: (value: string) => void;
  onSampleChange: (value: string) => void;
  onRecipientChange: (value: string) => void;
  onPreview: () => void;
  onTestSend: () => void;
}) {
  const config = snapshot.diagnostics?.email.config;
  const templates = snapshot.diagnostics?.email.templates ?? [];

  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="border border-white/10 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-white/38">
            Email configuration
          </p>
          <div className="mt-4 grid gap-2 text-xs text-white/58 md:grid-cols-2">
            <DiagnosticField
              label="RESEND_API_KEY"
              value={config?.resendApiKeyPresent ? "present" : "missing"}
            />
            <DiagnosticField
              label="RESEND_FROM_EMAIL"
              value={config?.resendFromEmailPresent ? "present" : "missing"}
            />
            <DiagnosticField
              label="RESEND_REPLY_TO"
              value={config?.resendReplyToPresent ? "present" : "not set"}
            />
            <DiagnosticField
              label="EMAIL_TEST_MODE"
              value={config?.emailTestMode ? "true" : "false"}
            />
            <DiagnosticField
              label="EMAIL_TEST_RECIPIENT"
              value={config?.emailTestRecipientPresent ? "present" : "not set"}
            />
            <DiagnosticField label="VERCEL_ENV" value={config?.vercelEnv ?? "-"} />
          </div>
          {config?.warnings.length ? (
            <div className="mt-4 space-y-1 text-xs text-yellow-100">
              {config.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
        </div>

        <div className="border border-white/10 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-white/38">
            Preview and test send
          </p>
          <div className="mt-4 grid gap-3">
            <SelectField
              label="template"
              value={template}
              options={templates.map((item) => ({
                value: item.id,
                label: `${item.id} / ${item.label}`,
              }))}
              onChange={onTemplateChange}
            />
            <SelectField
              label="sample data"
              value={sample}
              options={[
                { value: "synthetic", label: "synthetic sample order" },
                { value: "latest_order", label: "latest order if available" },
              ]}
              onChange={onSampleChange}
            />
            <label className="block border border-white/10 p-5">
              <span className="text-xs uppercase tracking-[0.22em] text-white/35">
                optional test recipient
              </span>
              <input
                value={recipient}
                onChange={(event) => onRecipientChange(event.target.value)}
                className="mt-3 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none"
                placeholder="test@example.com"
              />
              <p className="mt-2 text-xs leading-5 text-white/35">
                Preview never sends. Test send uses EMAIL_TEST_RECIPIENT when configured; production test sends stay blocked unless explicitly enabled.
              </p>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onPreview}
                className="bg-white px-4 py-3 text-xs uppercase tracking-[0.2em] text-black"
              >
                Render preview
              </button>
              <button
                type="button"
                onClick={onTestSend}
                className="border border-white/15 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/70"
              >
                Send safe test
              </button>
            </div>
          </div>
        </div>
      </div>

      {preview ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-4 border border-white/10 p-5">
            <DiagnosticField label="subject" value={preview.subject} />
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                Plain text
              </p>
              <pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap border border-white/10 p-4 text-xs leading-6 text-white/62">
                {preview.text}
              </pre>
            </div>
          </div>
          <div className="border border-white/10 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">
              HTML preview
            </p>
            <iframe
              title="Email HTML preview"
              srcDoc={preview.html}
              className="mt-3 h-[420px] w-full border border-white/10 bg-white"
            />
          </div>
        </div>
      ) : null}

      <div className="border border-white/10 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-white/38">
          Email event log
        </p>
        <div className="mt-4 grid gap-2">
          {snapshot.emailEvents.length === 0 ? (
            <p className="text-sm text-white/45">No email events recorded yet.</p>
          ) : null}
          {snapshot.emailEvents.slice(0, 30).map((event) => (
            <div
              key={event.id}
              className="grid gap-2 border-t border-white/10 pt-3 text-xs text-white/55 md:grid-cols-[0.8fr_0.8fr_0.7fr_0.7fr_1fr]"
            >
              <DiagnosticField label="template" value={event.template} />
              <DiagnosticField label="recipient" value={event.recipientEmail} />
              <DiagnosticField label="status" value={event.status} />
              <DiagnosticField label="provider id" value={event.providerMessageId ?? "-"} />
              <DiagnosticField label="error" value={event.errorSummary ?? "-"} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type ProductSnapshot = StoreSnapshot["products"][number];
type VariantSnapshot = StoreSnapshot["variants"][number];
type ImageSnapshot = StoreSnapshot["images"][number];
type CategorySnapshot = StoreSnapshot["categories"][number];
type DropSnapshot = StoreSnapshot["drops"][number];

function productWarnings(
  product: ProductSnapshot,
  variants: VariantSnapshot[],
  images: ImageSnapshot[],
  snapshot: StoreSnapshot,
) {
  const warnings: { code: string; message: string; critical?: boolean }[] = [];
  const specText = [
    product.technicalDescription,
    ...Object.values(product.specifications ?? {}),
  ].join("\n");

  if (product.isVisible && snapshot.settings.shopMode === "PRE_LAUNCH") {
    warnings.push({
      code: "visible_prelaunch",
      critical: true,
      message: "Product is visible while shopMode=PRE_LAUNCH.",
    });
  }

  if (product.status === "active" && !snapshot.settings.shopEnabled) {
    warnings.push({
      code: "active_shop_disabled",
      message: "Product is active while shopEnabled=false.",
    });
  }

  if (!product.isVisible && variants.some((variant) => variant.stockQuantity > 0)) {
    warnings.push({
      code: "stock_hidden",
      message: "Product has stock but is hidden.",
    });
  }

  if (images.length === 0) {
    warnings.push({
      code: "missing_images",
      message: "Product has no images.",
    });
  }

  if (/POTWIERDZIĆ|placeholder|to confirm/i.test(specText)) {
    warnings.push({
      code: "placeholder_specs",
      message: "Material/care/specs still include placeholders to confirm before launch.",
    });
  }

  for (const variant of variants) {
    if (variant.stockQuantity < 0) {
      warnings.push({
        code: `negative_stock_${variant.id}`,
        critical: true,
        message: `${variant.sku} has negative stock.`,
      });
    }

    if (variant.reservedQuantity > variant.stockQuantity) {
      warnings.push({
        code: `reserved_stock_${variant.id}`,
        critical: true,
        message: `${variant.sku} reservedQuantity exceeds stockQuantity.`,
      });
    }
  }

  const duplicateSkus = new Set(
    variants
      .map((variant) => variant.sku)
      .filter((sku, index, all) => sku && all.indexOf(sku) !== index),
  );

  for (const sku of duplicateSkus) {
    warnings.push({
      code: `duplicate_${sku}`,
      critical: true,
      message: `Duplicate SKU: ${sku}.`,
    });
  }

  return warnings;
}

function ProductEditor({
  product,
  variants,
  images,
  categories,
  drops,
  snapshot,
  onAction,
  onUploadImage,
  onPreview,
}: {
  product: ProductSnapshot;
  variants: VariantSnapshot[];
  images: ImageSnapshot[];
  categories: CategorySnapshot[];
  drops: DropSnapshot[];
  snapshot: StoreSnapshot;
  onAction: (actionName: string, payload: Record<string, unknown>) => void;
  onUploadImage: (productId: string, file: File, alt: string, isPrimary: boolean) => void;
  onPreview: () => void;
}) {
  const warnings = productWarnings(product, variants, images, snapshot);
  const sortedImages = [...images].sort((left, right) => left.sortOrder - right.sortOrder);

  return (
    <div className="space-y-5 border border-white/10 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-lg">{product.name}</p>
          <p className="mt-1 text-sm text-white/45">
            {product.id === sandboxProductId ? "sandbox test product" : "real product"} / {product.status} / {product.isVisible ? "visible" : "hidden"} / {money(product.price)}
          </p>
          {warnings.length ? (
            <div className="mt-3 space-y-1 text-xs">
              {warnings.map((warning) => (
                <p key={warning.code} className={warning.critical ? "text-red-200" : "text-yellow-100"}>
                  {warning.message}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-emerald-200">No admin completeness warnings.</p>
          )}
        </div>
        <button type="button" onClick={onPreview} className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]">
          Admin preview
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SettingsField label="name" value={product.name} onSave={(value) => onAction("product.upsert", { ...product, name: value })} />
        <SettingsField label="slug" value={product.slug} onSave={(value) => onAction("product.upsert", { ...product, slug: value })} />
        <SettingsField label="price PLN gross" value={String(product.price / 100)} onSave={(value) => onAction("product.upsert", { ...product, price: Math.round(Number(value) * 100) || 0 })} />
        <SelectField
          label="category"
          value={product.categoryId ?? ""}
          options={[{ value: "", label: "none" }, ...categories.map((category) => ({ value: category.id, label: category.name }))]}
          onChange={(value) => onAction("product.upsert", { ...product, categoryId: value || null })}
        />
        <SelectField
          label="drop"
          value={product.dropId ?? ""}
          options={[{ value: "", label: "none" }, ...drops.map((drop) => ({ value: drop.id, label: drop.name }))]}
          onChange={(value) => onAction("product.upsert", { ...product, dropId: value || null })}
        />
        <SettingsField label="SEO title" value={product.seoTitle ?? ""} onSave={(value) => onAction("product.upsert", { ...product, seoTitle: value })} />
        <SettingsField label="SEO description" value={product.seoDescription ?? ""} onSave={(value) => onAction("product.upsert", { ...product, seoDescription: value })} />
        <SettingsField label="internal admin notes" value={product.internalNotes ?? ""} onSave={(value) => onAction("product.upsert", { ...product, internalNotes: value })} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SettingsTextarea label="short description" value={product.shortDescription} onSave={(value) => onAction("product.upsert", { ...product, shortDescription: value })} />
        <SettingsTextarea label="editorial description" value={product.editorialDescription} onSave={(value) => onAction("product.upsert", { ...product, editorialDescription: value })} />
        <SettingsTextarea label="technical/material/care" value={product.technicalDescription} onSave={(value) => onAction("product.upsert", { ...product, technicalDescription: value })} />
      </div>

      <SpecEditor
        key={`${product.id}-specs-${JSON.stringify(product.specifications ?? {})}`}
        product={product}
        onSave={(specifications) => onAction("product.upsert", { ...product, specifications })}
      />
      <SizeGuideEditor
        key={`${product.id}-size-${JSON.stringify(product.sizeGuide ?? {})}`}
        product={product}
        onSave={(sizeGuide) => onAction("product.upsert", { ...product, sizeGuide })}
      />

      <div className="flex flex-wrap gap-2">
        {["draft", "hidden", "active", "sold_out", "archived"].map((status) => (
          <button key={status} type="button" onClick={() => onAction("product.status", { id: product.id, status, isVisible: false })} className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]">
            {status}
          </button>
        ))}
        <button type="button" onClick={() => onAction("product.status", { id: product.id, status: product.status, isVisible: !product.isVisible })} className="bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-black">
          {product.isVisible ? "Hide public" : "Set visible"}
        </button>
        <button type="button" onClick={() => onAction("product.upsert", { ...product, isFeatured: !product.isFeatured })} className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]">
          {product.isFeatured ? "Unfeature" : "Feature"}
        </button>
      </div>

      <div className="border-t border-white/10 pt-5">
        <p className="text-xs uppercase tracking-[0.24em] text-white/38">Media</p>
        <ImageUploadForm productId={product.id} onUpload={onUploadImage} />
        {sortedImages.length === 0 ? (
          <p className="mt-3 text-xs text-yellow-100">No images yet. Do not use placeholder or random stock photos.</p>
        ) : null}
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {sortedImages.map((image) => (
            <div key={image.id} className="grid gap-3 border border-white/10 p-3 md:grid-cols-[80px_1fr_auto]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.alt} className="h-20 w-20 object-cover" />
              <div className="grid gap-2 md:grid-cols-2">
                <SettingsField label="alt" value={image.alt} onSave={(value) => onAction("product.image.update", { ...image, alt: value })} />
                <SettingsField label="order" value={String(image.sortOrder)} onSave={(value) => onAction("product.image.update", { ...image, sortOrder: Number(value) || 0 })} />
              </div>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => onAction("product.image.primary", { id: image.id })} className="border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.18em]">
                  {image.isPrimary ? "Primary" : "Set primary"}
                </button>
                <button type="button" onClick={() => onAction("product.image.delete", { id: image.id })} className="border border-red-300/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-red-100">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 pt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.24em] text-white/38">Variants</p>
          <button
            type="button"
            onClick={() =>
              onAction("variant.upsert", {
                productId: product.id,
                size: "NEW",
                sku: `GM-${product.id.replace("prod-", "").toUpperCase()}-NEW`,
                stockQuantity: 0,
                isAvailable: false,
              })
            }
            className="border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.18em]"
          >
            Add variant
          </button>
        </div>
        <div className="mt-3 grid gap-2">
          {variants.map((variant) => (
            <div key={variant.id} className="grid gap-3 border border-white/10 p-3 xl:grid-cols-[1fr_0.6fr_0.6fr_0.6fr_0.6fr_auto] xl:items-end">
              <SettingsField label="SKU" value={variant.sku} onSave={(value) => onAction("variant.upsert", { ...variant, sku: value })} />
              <SettingsField label="size" value={variant.size} onSave={(value) => onAction("variant.upsert", { ...variant, size: value })} />
              <SettingsField label="stock" value={String(variant.stockQuantity)} onSave={(value) => onAction("variant.upsert", { ...variant, stockQuantity: Number(value) || 0 })} />
              <SettingsReadOnly label="reserved" value={String(variant.reservedQuantity)} />
              <SettingsReadOnly label="available" value={String(variant.stockQuantity - variant.reservedQuantity)} />
              <button type="button" onClick={() => onAction("variant.upsert", { ...variant, isAvailable: !variant.isAvailable })} className="bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-black">
                {variant.isAvailable ? "Disable" : "Enable"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductPreview({
  product,
  variants,
  images,
  onClose,
}: {
  product: ProductSnapshot;
  variants: VariantSnapshot[];
  images: ImageSnapshot[];
  onClose: () => void;
}) {
  const primaryImage =
    images.find((image) => image.isPrimary) ??
    [...images].sort((left, right) => left.sortOrder - right.sortOrder)[0];

  return (
    <section className="border border-white/15 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/38">Admin-only preview / noindex</p>
          <h2 className="mt-3 text-3xl">{product.name}</h2>
          <p className="mt-2 text-white/55">{money(product.price)}</p>
        </div>
        <button type="button" onClick={onClose} className="border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.18em]">
          Close
        </button>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-[0.8fr_1fr]">
        {primaryImage ? (
          <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={primaryImage.url} alt={primaryImage.alt} className="aspect-[4/5] w-full object-cover" />
          </>
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center border border-white/10 text-xs uppercase tracking-[0.18em] text-white/35">
            Missing image
          </div>
        )}
        <div className="space-y-4">
          <p className="text-sm text-white/70">{product.shortDescription}</p>
          <p className="text-sm leading-6 text-white/55">{product.editorialDescription}</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <span key={variant.id} className="border border-white/15 px-3 py-2 text-xs">
                {variant.size} / available {variant.stockQuantity - variant.reservedQuantity}
              </span>
            ))}
          </div>
          <pre className="overflow-auto border border-white/10 p-3 text-xs leading-6 text-white/50">
            {JSON.stringify({ specifications: product.specifications, sizeGuide: product.sizeGuide }, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}

function SettingsReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">{label}</p>
      <p className="mt-3 break-words text-sm text-white/68">{value || "-"}</p>
    </div>
  );
}

function SettingsField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <label className="block border border-white/10 p-5">
      <span className="text-xs uppercase tracking-[0.22em] text-white/35">{label}</span>
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="mt-3 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none"
      />
      <button
        type="button"
        onClick={() => onSave(draft)}
        className="mt-3 border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/70"
      >
        Save
      </button>
    </label>
  );
}

function SettingsTextarea({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <label className="block border border-white/10 p-5">
      <span className="text-xs uppercase tracking-[0.22em] text-white/35">{label}</span>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={7}
        className="mt-3 w-full resize-y border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none"
      />
      <button
        type="button"
        onClick={() => onSave(draft)}
        className="mt-3 border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/70"
      >
        Save
      </button>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block border border-white/10 p-5">
      <span className="text-xs uppercase tracking-[0.22em] text-white/35">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SpecEditor({
  product,
  onSave,
}: {
  product: ProductSnapshot;
  onSave: (specifications: Record<string, string>) => void;
}) {
  const keys =
    product.id.includes("eyewear")
      ? [
          "frameMaterial",
          "lensMaterial",
          "lensCategoryUv",
          "dimensions",
          "color",
          "care",
          "countryOfManufacture",
          "packageContents",
          "productWeight",
          "packagingWeight",
        ]
      : [
          "material",
          "fit",
          "color",
          "care",
          "countryOfManufacture",
          "packageContents",
          "modelSize",
          "productWeight",
          "packagingWeight",
        ];
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      keys.map((key) => [key, product.specifications?.[key] ?? ""]),
    ),
  );

  return (
    <div className="border border-white/10 p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">Specifications to confirm before launch</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {keys.map((key) => (
          <label key={key} className="block">
            <span className="text-xs text-white/35">{key}</span>
            <input
              value={draft[key] ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
              className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none"
            />
          </label>
        ))}
      </div>
      <button type="button" onClick={() => onSave(draft)} className="mt-4 border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/70">
        Save specs
      </button>
    </div>
  );
}

function SizeGuideEditor({
  product,
  onSave,
}: {
  product: ProductSnapshot;
  onSave: (sizeGuide: ProductSnapshot["sizeGuide"]) => void;
}) {
  const isEyewear = product.id.includes("eyewear");
  const [apparelRows, setApparelRows] = useState(
    product.sizeGuide?.apparel ?? [],
  );
  const [eyewear, setEyewear] = useState(
    product.sizeGuide?.eyewear ?? {
      lensWidth: "",
      bridgeWidth: "",
      templeLength: "",
      frameWidth: "",
    },
  );

  if (isEyewear) {
    return (
      <div className="border border-white/10 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-white/35">Eyewear dimensions</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {(["lensWidth", "bridgeWidth", "templeLength", "frameWidth"] as const).map((key) => (
            <label key={key} className="block">
              <span className="text-xs text-white/35">{key}</span>
              <input
                value={eyewear[key] ?? ""}
                onChange={(event) => setEyewear((current) => ({ ...current, [key]: event.target.value }))}
                className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none"
              />
            </label>
          ))}
        </div>
        <button type="button" onClick={() => onSave({ eyewear })} className="mt-4 border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/70">
          Save dimensions
        </button>
      </div>
    );
  }

  return (
    <div className="border border-white/10 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-white/35">Apparel size guide</p>
        <button
          type="button"
          onClick={() =>
            setApparelRows((current) => [
              ...current,
              {
                size: "",
                chestWidth: "",
                length: "",
                sleeveLength: "",
                shoulderWidth: "",
              },
            ])
          }
          className="border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.18em]"
        >
          Add row
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {apparelRows.map((row, index) => (
          <div key={`${row.size}-${index}`} className="grid gap-3 md:grid-cols-5">
            {(["size", "chestWidth", "length", "sleeveLength", "shoulderWidth"] as const).map((key) => (
              <label key={key} className="block">
                <span className="text-xs text-white/35">{key}</span>
                <input
                  value={row[key] ?? ""}
                  onChange={(event) =>
                    setApparelRows((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, [key]: event.target.value } : item,
                      ),
                    )
                  }
                  className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none"
                />
              </label>
            ))}
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onSave({ apparel: apparelRows })} className="mt-4 border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/70">
        Save size guide
      </button>
    </div>
  );
}

function ImageUploadForm({
  productId,
  onUpload,
}: {
  productId: string;
  onUpload: (productId: string, file: File, alt: string, isPrimary: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  return (
    <div className="mt-4 grid gap-3 border border-white/10 p-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
      <label className="block">
        <span className="text-xs text-white/35">image file</span>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-2 w-full text-sm text-white/55"
        />
      </label>
      <label className="block">
        <span className="text-xs text-white/35">alt text</span>
        <input
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none"
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-white/55">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(event) => setIsPrimary(event.target.checked)}
        />
        primary
      </label>
      <button
        type="button"
        onClick={() => {
          if (file) {
            onUpload(productId, file, alt, isPrimary);
            setFile(null);
            setAlt("");
            setIsPrimary(false);
          }
        }}
        className="bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-black"
      >
        Upload
      </button>
    </div>
  );
}

function TpayDiagnostics({
  diagnostics,
  onReset,
}: {
  diagnostics: TpaySandboxDiagnostics | undefined;
  onReset: () => void;
}) {
  if (!diagnostics) {
    return null;
  }

  const hasFailures =
    diagnostics.envChecks.some((check) => check.status === "fail") ||
    diagnostics.databaseChecks.some((check) => check.status === "fail") ||
    diagnostics.warnings.some((check) => check.status === "fail");
  const hasWarnings = diagnostics.warnings.length > 0;

  return (
    <section className={hasFailures ? "mt-8 border border-red-400/50 p-4" : "mt-8 border border-white/10 p-4"}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/38">
            Tpay sandbox readiness
          </p>
          {hasFailures ? (
            <p className="mt-2 text-sm text-red-200">
              Staging is not ready. Fix the failed checks before starting a Tpay sandbox checkout.
            </p>
          ) : hasWarnings ? (
            <p className="mt-2 text-sm text-yellow-100">
              Core checks pass, but review the warnings before payment.
            </p>
          ) : (
            <p className="mt-2 text-sm text-white/55">
              Ready for a controlled Tpay sandbox payment test.
            </p>
          )}
        </div>
        <div className="text-xs text-white/45 md:text-right">
          <p>NODE_ENV={diagnostics.environment.nodeEnv ?? "-"}</p>
          <p>VERCEL_ENV={diagnostics.environment.vercelEnv ?? "-"}</p>
          <p>{diagnostics.isProductionDeployment ? "production" : "staging/local"}</p>
        </div>
      </div>

      {diagnostics.warnings.length ? (
        <div className="mt-4 space-y-2">
          {diagnostics.warnings.map((check) => (
            <ReadinessRow key={check.label} check={check} />
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ReadinessGroup title="Environment" checks={diagnostics.envChecks} />
        <ReadinessGroup title="Database and seed" checks={diagnostics.databaseChecks} />
      </div>

      <div className="mt-4 space-y-1 text-xs text-white/45">
        <p>Webhook path: {diagnostics.webhookPath}</p>
        {diagnostics.webhookUrl ? (
          <p className="break-all">Webhook URL: {diagnostics.webhookUrl}</p>
        ) : null}
        <p>NEXT_PUBLIC_SITE_URL present: {diagnostics.siteUrl.present ? "true" : "false"}</p>
        <p>NEXT_PUBLIC_SITE_URL raw length: {diagnostics.siteUrl.originalLength}</p>
        {diagnostics.siteUrl.sanitized ? (
          <p className="break-all">Sanitized site URL: {diagnostics.siteUrl.sanitized}</p>
        ) : null}
        <p>
          NEXT_PUBLIC_SITE_URL key prefix stripped:{" "}
          {diagnostics.siteUrl.strippedKeyPrefix ? "true" : "false"}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-white/45">
          Reset only touches {`prod-tpay-sandbox-test`} / {`var-tpay-sandbox-test-one-size`} and refuses production.
        </p>
        <button
          type="button"
          onClick={onReset}
          disabled={diagnostics.isProductionDeployment}
          className={
            diagnostics.isProductionDeployment
              ? "border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/30"
              : "border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white hover:border-white/45"
          }
        >
          Reset test product
        </button>
      </div>
    </section>
  );
}

function ReadinessGroup({
  title,
  checks,
}: {
  title: string;
  checks: ReadinessCheck[];
}) {
  return (
    <div className="border border-white/10 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/38">{title}</p>
      <div className="mt-4 space-y-2">
        {checks.map((check) => (
          <ReadinessRow key={check.label} check={check} />
        ))}
      </div>
    </div>
  );
}

function ReadinessRow({ check }: { check: ReadinessCheck }) {
  const color =
    check.status === "pass"
      ? "text-emerald-200"
      : check.status === "warn"
        ? "text-yellow-100"
        : "text-red-200";

  return (
    <div className="grid gap-2 text-xs md:grid-cols-[auto_1fr]">
      <span className={`uppercase tracking-[0.18em] ${color}`}>
        {check.status}
      </span>
      <p className="min-w-0 text-white/58">
        <span className="text-white/78">{check.label}</span>
        <span className="text-white/35"> / </span>
        <span className="break-words">{check.detail}</span>
      </p>
    </div>
  );
}

function SimpleList({ rows }: { rows: Record<string, unknown>[] }) {
  return (
    <section className="mt-8 space-y-3">
      {rows.length === 0 ? <p className="text-white/45">No records yet.</p> : null}
      {rows.map((row) => (
        <pre key={String(row.id)} className="overflow-auto border border-white/10 p-4 text-xs leading-6 text-white/68">
          {JSON.stringify(row, null, 2)}
        </pre>
      ))}
    </section>
  );
}
