import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SubscriptionCheckoutButton from "./SubscriptionCheckoutButton";
import styles from "./page.module.css";

const proFeatures = [
  "Up to 200 receipts per day",
  "Priority parsing queue",
  "Advanced analytics access",
];

const quotaComparison = [
  ["Free", "3", "receipts/day"],
  ["Pro", "200", "receipts/day"],
];

export default async function SubscriptionPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    redirect("/login");
  }

  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link
            className={styles.back}
            href="/dashboard"
            prefetch
            aria-label="Back to dashboard"
          >
            Back
          </Link>
          <p className={styles.title}>AI Receipts Pro</p>
          <div className={styles.headerSpacer} />
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Subscription</p>
              <h1>Unlock more scans.</h1>
              <p>
                Upgrade your plan to increase your daily receipt processing
                quota without changing the way your team uploads, reviews, and
                exports.
              </p>
            </div>
            <div className={styles.heroVisual} aria-hidden="true">
              <Image
                src="/receipt-sync-dashboard.png"
                alt=""
                width={920}
                height={690}
                priority
                className={styles.productImage}
              />
            </div>
          </div>
        </section>

        <section className={styles.planTile}>
          <div className={styles.planInner}>
            <div className={styles.planIntro}>
              <p className={styles.kickerDark}>Pro Plan</p>
              <h2>200 receipts every day.</h2>
              <p>
                Built for heavier receipt workflows where quota should stay out
                of the way.
              </p>
            </div>

            <div className={styles.planPanel}>
              <div className={styles.priceRow}>
                <h3>$9.99</h3>
                <span>/ month</span>
              </div>
              <ul className={styles.featureList}>
                {proFeatures.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <SubscriptionCheckoutButton priceId={priceId} />
              <p className={styles.note}>
                You will be redirected to Stripe Checkout to complete payment.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.quotaSection} aria-labelledby="quota-heading">
          <div className={styles.quotaInner}>
            <div className={styles.quotaIntro}>
              <h2 id="quota-heading">Daily quota</h2>
              <p>Your current free plan includes 3 receipt scans per day.</p>
            </div>
            <div className={styles.quotaGrid}>
              {quotaComparison.map(([plan, value, label]) => (
                <article className={styles.quotaCard} key={plan}>
                  <p>{plan}</p>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
