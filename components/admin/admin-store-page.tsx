"use client";

import { useMemo, useState } from "react";

type StoreSnapshot = {
  products: { id: string; name: string; status: string; isVisible: boolean; price: number }[];
  variants: {
    id: string;
    productId: string;
    size: string;
    sku: string;
    stockQuantity: number;
    reservedQuantity: number;
    isAvailable: boolean;
  }[];
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

export function AdminStorePage() {
  const [token, setToken] = useState("");
  const [snapshot, setSnapshot] = useState<StoreSnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
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
                {snapshot.products.map((product) => (
                  <div key={product.id} className="grid gap-4 border border-white/10 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                    <div>
                      <p className="text-lg">{product.name}</p>
                      <p className="text-sm text-white/45">
                        {product.status} / {product.isVisible ? "visible" : "hidden"} / {money(product.price)}
                      </p>
                    </div>
                    <button type="button" onClick={() => action("product.status", { id: product.id, status: "hidden", isVisible: false })} className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]">
                      Hide
                    </button>
                    <button type="button" onClick={() => action("product.status", { id: product.id, status: "active", isVisible: false })} className="bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-black">
                      Activate hidden
                    </button>
                  </div>
                ))}
              </section>
            ) : null}

            {activeTab === "inventory" ? (
              <section className="mt-8 grid gap-3">
                {snapshot.variants.map((variant) => (
                  <div key={variant.id} className="grid gap-3 border border-white/10 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                    <p>
                      {variant.sku} / {variant.size}
                      <span className="ml-3 text-white/45">
                        stock {variant.stockQuantity}, reserved {variant.reservedQuantity}
                      </span>
                    </p>
                    <button type="button" onClick={() => action("variant.upsert", { ...variant, stockQuantity: variant.stockQuantity + 1, isAvailable: true })} className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]">
                      + Stock
                    </button>
                    <button type="button" onClick={() => action("variant.upsert", { ...variant, isAvailable: !variant.isAvailable })} className="bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-black">
                      {variant.isAvailable ? "Disable" : "Enable"}
                    </button>
                  </div>
                ))}
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
                        <DiagnosticField label="paidAt" value={order.paidAt ?? "-"} />
                        <DiagnosticField label="last webhook status" value={order.lastWebhookEvent?.status ?? "-"} />
                        <DiagnosticField label="last webhook id" value={order.lastWebhookEvent?.id ?? "-"} />
                      </div>

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
                      <button type="button" onClick={() => action("order.status", { id: order.id, orderStatus: "processing", fulfillmentStatus: "packing" })} className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]">
                        Packing
                      </button>
                      <button type="button" onClick={() => action("order.status", { id: order.id, orderStatus: "completed", fulfillmentStatus: "shipped", deliveryStatus: "shipped" })} className="bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-black">
                        Shipped
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            ) : null}

            {activeTab === "returns" ? <SimpleList rows={snapshot.returns} /> : null}
            {activeTab === "complaints" ? <SimpleList rows={snapshot.complaints} /> : null}
            {activeTab === "newsletter" ? <SimpleList rows={snapshot.newsletterSubscribers} /> : null}
            {activeTab === "discounts" ? <SimpleList rows={snapshot.discounts} /> : null}

            {activeTab === "settings" ? (
              <section className="mt-8 grid gap-4 md:grid-cols-2">
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
