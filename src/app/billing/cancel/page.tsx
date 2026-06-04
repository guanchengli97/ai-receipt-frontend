import Link from "next/link";
import styles from "../../subscription/page.module.css";

export default function BillingCancelPage() {
  return (
    <div className={styles.page}>
      <div className={styles.phone}>
        <header className={styles.header}>
          <Link className={styles.back} href="/subscription" prefetch aria-label="Back to subscription">
            Back
          </Link>
          <h1 className={styles.title}>Payment Cancelled</h1>
          <div className={styles.headerSpacer} />
        </header>

        <section className={styles.hero}>
          <h2>Checkout not completed</h2>
          <p>No charge was made. You can review the plan and try again when ready.</p>
        </section>

        <section className={styles.planCard}>
          <Link className={styles.subscribeButton} href="/subscription" prefetch>
            Try Again
          </Link>
        </section>
      </div>
    </div>
  );
}
