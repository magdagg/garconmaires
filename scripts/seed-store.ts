import { ensurePostgresDefaults } from "@/lib/store/postgres";

async function main() {
  await ensurePostgresDefaults();
  console.log("Seeded Garçonmaires store defaults.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
