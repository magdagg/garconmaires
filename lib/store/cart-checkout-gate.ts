import { getDeliveryMethods } from "./delivery";
import { readStoreDatabase } from "./storage";
import type { DeliveryMethodSetting, StoreDatabase } from "./types";

export type CartCheckoutGateState = {
  storefrontLive: boolean;
  shopEnabled: boolean;
  shopMode: string;
  deliveryMethods: DeliveryMethodSetting[];
  freeShippingThreshold: number;
  defaultDeliveryPrice: number;
};

export function getCartCheckoutGateFromDatabase(
  database: StoreDatabase,
): CartCheckoutGateState {
  return {
    storefrontLive:
      database.settings.shopEnabled &&
      database.settings.shopMode === "PUBLIC_DROP" &&
      !database.settings.maintenanceMode &&
      database.drops.some((drop) => drop.status === "live"),
    shopEnabled: database.settings.shopEnabled,
    shopMode: database.settings.shopMode,
    deliveryMethods: getDeliveryMethods(database.settings).filter(
      (method) => method.enabled,
    ),
    freeShippingThreshold: database.settings.freeShippingThreshold,
    defaultDeliveryPrice: database.settings.defaultDeliveryPrice,
  };
}

export async function getCartCheckoutGate() {
  return getCartCheckoutGateFromDatabase(await readStoreDatabase());
}

export function cartCheckoutNoindexMetadata({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}
