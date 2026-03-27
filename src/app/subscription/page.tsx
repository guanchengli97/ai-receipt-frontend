import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SubscriptionCheckoutButton from "./SubscriptionCheckoutButton";
import styles from "./page.module.css";

export default async function SubscriptionPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    redirect("/login");
  }

  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "";

  return (
    <div className={styles.page}>
      <div className={styles.phone}>
        <header className={styles.header}>
          <Link className={styles.back} href="/dashboard" prefetch aria-label="Back to dashboard">
            ←
          </Link>
          <h1 className={styles.title}>Subscription</h1>
          <div className={styles.headerSpacer} />
        </header>

        <section className={styles.hero}>
          <h2>Unlock more scans</h2>
          <p>Upgrade your plan to increase your daily receipt processing quota.</p>
        </section>

        <section className={styles.freeQuotaCard}>
          <h3>Current Free Plan</h3>
          <p>
            Daily quota: <strong>3 receipts/day</strong>
          </p>
        </section>

        <section className={styles.planCard}>
          <div className={styles.planTop}>
            <h3>Pro Plan</h3>
            <span>$9.99 / month</span>
          </div>
          <ul className={styles.featureList}>
            <li>Up to 200 receipts per day</li>
            <li>Priority parsing queue</li>
            <li>Advanced analytics access</li>
          </ul>
          <SubscriptionCheckoutButton priceId={priceId} />
          <p className={styles.note}>You will be redirected to Stripe Checkout to complete payment.</p>
        </section>
      </div>
    </div>
  );
}
