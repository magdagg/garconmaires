export type CustomerAccountMode = "enabled" | "placeholder";

export function isProductionRuntime() {
  return process.env.VERCEL_ENV === "production";
}

export function getCustomerAccountMode(): CustomerAccountMode {
  const explicitMode = process.env.CUSTOMER_ACCOUNT_MODE?.toLowerCase();
  if (explicitMode === "enabled") {
    return "enabled";
  }
  if (explicitMode === "placeholder" || explicitMode === "disabled") {
    return "placeholder";
  }

  const explicitEnabled = process.env.ACCOUNT_ENABLED?.toLowerCase();
  if (explicitEnabled === "true") {
    return "enabled";
  }
  if (explicitEnabled === "false") {
    return "placeholder";
  }

  return isProductionRuntime() ? "placeholder" : "enabled";
}

export function isCustomerAccountEnabled() {
  return getCustomerAccountMode() === "enabled";
}

export function isAccountDevSeedAllowed() {
  return isCustomerAccountEnabled() && !isProductionRuntime();
}
