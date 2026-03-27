import Link from "next/link";
import styles from "../../subscription/page.module.css";

export default function BillingSuccessPage() {
  return (
    <div className={styles.page}>
      <div className={styles.phone}>
        <header className={styles.header}>
          <Link className={styles.back} href="/dashboard" prefetch aria-label="Back to dashboard">
            ←
          </Link>
          <h1 className={styles.title}>Payment Success</h1>
          <div className={styles.headerSpacer} />
        </header>

        <section className={styles.hero}>
          <h2>Subscription started</h2>
          <p>Your payment completed successfully. You can return to the dashboard now.</p>
        </section>

        <section className={styles.planCard}>
          <Link className={styles.subscribeButton} href="/dashboard" prefetch>
            Back to Dashboard
          </Link>
        </section>
      </div>
    </div>
  );
}
