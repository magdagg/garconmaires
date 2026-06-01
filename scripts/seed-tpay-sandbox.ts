import { updateStoreDatabase } from "@/lib/store/storage";
import { nowIso } from "@/lib/store/ids";

const productId = "prod-tpay-sandbox-test";
const variantId = "var-tpay-sandbox-test-one-size";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed the Tpay sandbox product in production.");
  }

  if (process.env.CHECKOUT_TEST_MODE !== "true") {
    throw new Error(
      "Set CHECKOUT_TEST_MODE=true before seeding the Tpay sandbox product.",
    );
  }

  const timestamp = nowIso();

  await updateStoreDatabase((database) => {
    const existingProduct = database.products.find((item) => item.id === productId);
    const product = {
      id: productId,
      name: "Garçonmaires Test Product",
      slug: "garconmaires-test-product",
      shortDescription: "Ukryty produkt do testów Tpay sandbox.",
      editorialDescription:
        "Produkt techniczny używany wyłącznie do lokalnych i stagingowych testów checkoutu.",
      technicalDescription: "ONE SIZE. Cena testowa 1.00 PLN.",
      price: 100,
      currency: "PLN" as const,
      status: "active" as const,
      isVisible: false,
      isFeatured: false,
      categoryId: null,
      dropId: null,
      createdAt: existingProduct?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    if (existingProduct) {
      Object.assign(existingProduct, product);
    } else {
      database.products.unshift(product);
    }

    const existingVariant = database.variants.find((item) => item.id === variantId);
    const variant = {
      id: variantId,
      productId,
      size: "ONE SIZE",
      sku: "GM-TPAY-SANDBOX-OS",
      stockQuantity: 1,
      reservedQuantity: 0,
      isAvailable: true,
      priceOverride: null,
      createdAt: existingVariant?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    if (existingVariant) {
      Object.assign(existingVariant, variant);
    } else {
      database.variants.unshift(variant);
    }

    database.settings.shopEnabled = false;
    database.settings.shopMode = "PRE_LAUNCH";
    database.settings.defaultDeliveryPrice = 0;
    database.settings.freeShippingThreshold = 0;
    database.settings.updatedAt = timestamp;
  });

  console.log("Seeded hidden Tpay sandbox test product.");
  console.log("Product ID: prod-tpay-sandbox-test");
  console.log("Variant: ONE SIZE, stockQuantity: 1, price: 1.00 PLN");
  console.log("Store remains shopEnabled=false and PRE_LAUNCH.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
