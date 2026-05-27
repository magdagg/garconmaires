import {
  askQuestion,
  createInterface,
  ensureEnvLocalExists,
  ensureEnvLocalGitignored,
  loadEnvLocal,
  sendResendEmail,
} from "./newsletter-shared.mjs";

async function postSubscribe(baseUrl, email) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/newsletter/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-agent": "newsletter-test-script",
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify({
      email,
      source: "setup-test",
      language: "pl",
      consent: true,
      website: "",
    }),
  });

  const payload = await response.json().catch(() => null);
  return { status: response.status, payload };
}

async function main() {
  ensureEnvLocalExists();
  ensureEnvLocalGitignored();
  loadEnvLocal();

  const rl = createInterface();

  try {
    const baseUrlInput = String(
      await askQuestion(rl, "Local app URL for newsletter API [http://localhost:3003]: "),
    ).trim();
    const baseUrl = baseUrlInput || "http://localhost:3003";

    const email = String(
      await askQuestion(rl, "Test email address for newsletter subscribe flow: "),
    ).trim();

    if (!email) {
      throw new Error("A test email address is required.");
    }

    const firstAttempt = await postSubscribe(baseUrl, email);
    console.log(`First subscribe attempt HTTP ${firstAttempt.status}:`, firstAttempt.payload);

    const secondAttempt = await postSubscribe(baseUrl, email);
    console.log(`Second subscribe attempt HTTP ${secondAttempt.status}:`, secondAttempt.payload);

    const firstOk = firstAttempt.payload?.ok === true;
    const duplicateOk = secondAttempt.payload?.ok === true;

    if (!firstOk || !duplicateOk) {
      throw new Error(
        "Newsletter subscribe API did not return success twice. Start the local dev server and verify credentials.",
      );
    }

    console.log("Duplicate handling looks correct if the second response status is already_subscribed.");

    await sendResendEmail({
      to: email,
      subject: "Test Garçonmaires Newsletter",
      text: "This is a test email for the Garçonmaires newsletter setup.",
      html: `
        <div style="background:#ffffff;color:#111111;font-family:Arial,sans-serif;padding:40px 24px;">
          <div style="margin:0 auto;max-width:560px;">
            <p style="margin:0 0 16px;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#555555;">
              Garçonmaires
            </p>
            <p style="margin:0;font-size:16px;line-height:1.8;">
              This is a test email for the Garçonmaires newsletter setup.
            </p>
          </div>
        </div>
      `.trim(),
    });

    console.log("Resend direct send succeeded with the same newsletter sender configuration.");
    console.log("End-to-end newsletter setup test finished.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Newsletter subscribe test failed: ${message}`);
    console.error("If the API request failed, make sure the local dev server is running with: npm run dev");
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

await main();
