import {
  REQUIRED_NEWSLETTER_ENV_KEYS,
  askYesNo,
  commandExists,
  createInterface,
  ensureEnvLocalExists,
  ensureEnvLocalGitignored,
  loadEnvLocal,
  maskSecret,
  runCommand,
  validateRequiredEnv,
} from "./newsletter-shared.mjs";

const ENVIRONMENTS = ["production", "preview", "development"];

function printInstallHelp() {
  console.error("Vercel CLI is not installed.");
  console.error("Install it with one of these commands:");
  console.error("npm install -g vercel");
  console.error("or");
  console.error("npx vercel --version");
}

function ensureVercelCli() {
  if (!commandExists("vercel")) {
    printInstallHelp();
    process.exit(1);
  }

  const whoami = runCommand("vercel", ["whoami"]);
  if (whoami.status !== 0) {
    console.error("Vercel CLI is installed but not logged in.");
    console.error("Run: vercel login");
    process.exit(1);
  }
}

function addOrUpdateEnvVar(key, value, environment) {
  const branchResult = runCommand("git", ["branch", "--show-current"]);
  const currentBranch = (branchResult.stdout ?? "").trim();
  const addArgs =
    environment === "preview" && currentBranch
      ? ["env", "add", key, environment, currentBranch, `--value=${value}`, "--yes"]
      : ["env", "add", key, environment, `--value=${value}`, "--yes"];

  const removeResult = runCommand(
    "vercel",
    ["env", "rm", key, environment, "--yes"],
    { input: "y\n" },
  );

  const removeOutput = `${removeResult.stdout ?? ""}\n${removeResult.stderr ?? ""}`;
  const removeAllowed =
    removeResult.status === 0 ||
    removeOutput.includes("was removed") ||
    removeOutput.includes("does not exist") ||
    removeOutput.includes("env_not_found") ||
    removeOutput.includes("was not found");

  if (!removeAllowed) {
    throw new Error(`Unable to remove existing ${key} for ${environment}: ${removeOutput.trim()}`);
  }

  const addResult = runCommand(
    "vercel",
    addArgs,
  );

  if (addResult.status !== 0) {
    const output = `${addResult.stdout ?? ""}\n${addResult.stderr ?? ""}`.trim();
    if (
      environment === "preview" &&
      output.includes('does not have a connected Git repository')
    ) {
      return {
        skipped: true,
        reason: "Preview env sync skipped because the Vercel project has no connected Git repository.",
      };
    }

    throw new Error(`Unable to add ${key} for ${environment}: ${output}`);
  }

  return {
    skipped: false,
    reason: null,
  };
}

async function main() {
  ensureEnvLocalExists();
  ensureEnvLocalGitignored();
  loadEnvLocal();

  const validation = validateRequiredEnv();
  if (!validation.ok) {
    console.error(
      `Missing required newsletter environment variables in .env.local: ${validation.missing.join(", ")}`,
    );
    console.error("Run: npm run newsletter:setup");
    process.exit(1);
  }

  ensureVercelCli();

  console.log("The following newsletter variables will be synced to Vercel:");
  for (const key of REQUIRED_NEWSLETTER_ENV_KEYS) {
    console.log(`- ${key}: ${maskSecret(String(process.env[key] ?? ""))}`);
  }
  console.log(`Target environments: ${ENVIRONMENTS.join(", ")}`);

  const rl = createInterface();

  try {
    const confirmed = await askYesNo(
      rl,
      "Push these newsletter secrets to Vercel for production, preview, and development?",
      false,
    );

    if (!confirmed) {
      console.log("Cancelled Vercel env sync.");
      return;
    }

    for (const environment of ENVIRONMENTS) {
      for (const key of REQUIRED_NEWSLETTER_ENV_KEYS) {
        const result = addOrUpdateEnvVar(key, String(process.env[key] ?? ""), environment);
        if (result.skipped) {
          console.log(`${result.reason} Skipped ${key} (${environment}).`);
          continue;
        }

        console.log(`Synced ${key} to Vercel (${environment}).`);
      }
    }

    console.log("Newsletter environment variables are synced to Vercel.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Vercel env sync failed: ${message}`);
    console.error("If needed, you can add them manually with commands like:");
    for (const environment of ENVIRONMENTS) {
      for (const key of REQUIRED_NEWSLETTER_ENV_KEYS) {
        console.error(`printf '%s' '<value>' | vercel env add ${key} ${environment}`);
      }
    }
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

await main();
