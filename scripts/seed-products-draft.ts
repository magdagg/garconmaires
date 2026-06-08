import { seedDraftProducts } from "@/lib/store/draft-products";
import { updateStoreDatabase } from "@/lib/store/storage";

async function main() {
  const productIds = await updateStoreDatabase((database) => {
    return seedDraftProducts(database);
  });

  console.log("Seeded Garçonmaires draft products.");
  console.log(`Products: ${productIds.join(", ")}`);
  console.log("Products remain draft, hidden, not featured and not publicly exposed.");
  console.log("Store remains shopEnabled=false and PRE_LAUNCH.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
