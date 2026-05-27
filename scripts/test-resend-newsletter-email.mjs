import {
  askQuestion,
  createInterface,
  ensureEnvLocalExists,
  ensureEnvLocalGitignored,
  loadEnvLocal,
  sendResendEmail,
} from "./newsletter-shared.mjs";

async function main() {
  ensureEnvLocalExists();
  ensureEnvLocalGitignored();
  loadEnvLocal();

  const rl = createInterface();

  try {
    const recipient = String(
      await askQuestion(rl, "Recipient email for test message: "),
    ).trim();

    if (!recipient) {
      throw new Error("Recipient email is required.");
    }

    await sendResendEmail({
      to: recipient,
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

    console.log(`Test email sent successfully to ${recipient}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Newsletter test email failed: ${message}`);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

await main();
