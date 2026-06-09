import Link from "next/link";
import styles from "./page.module.css";

const nextSteps = [
  ["Dashboard", "Review the latest receipts and upload new documents."],
  ["Daily quota", "Your Pro quota is available for heavier receipt workflows."],
  ["Transactions", "Export reviewed receipt rows when your records are ready."],
];

export default function BillingSuccessPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.back} href="/dashboard" prefetch aria-label="Back to dashboard">
            Back
          </Link>
          <p className={styles.title}>Payment Success</p>
          <div className={styles.headerSpacer} />
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Subscription started</p>
            <h1>You&apos;re all set.</h1>
            <p>
              Your payment completed successfully. Pro receipt processing is
              ready for your next upload.
            </p>
            <div className={styles.actions}>
              <Link className={styles.primaryButton} href="/dashboard" prefetch>
                Back to Dashboard
              </Link>
              <Link className={styles.secondaryButton} href="/transactions" prefetch>
                View Transactions
              </Link>
            </div>
          </div>

          <div className={styles.confirmationPanel} aria-label="Subscription confirmation">
            <div className={styles.checkmark} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="44" height="44">
                <path
                  d="M5 12.5l4.2 4.2L19.5 6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2>Pro Plan</h2>
            <p>Activated successfully</p>
            <div className={styles.quota}>
              <strong>10</strong>
              <span>receipts/day</span>
            </div>
          </div>
        </section>

        <section className={styles.nextSection} aria-labelledby="next-heading">
          <div className={styles.nextIntro}>
            <p className={styles.kickerDark}>What&apos;s next</p>
            <h2 id="next-heading">Continue where you left off.</h2>
            <p>
              Your workspace is unchanged; the subscription simply raises the
              ceiling for daily receipt processing.
            </p>
          </div>

          <div className={styles.stepGrid}>
            {nextSteps.map(([title, copy]) => (
              <article className={styles.stepCard} key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
