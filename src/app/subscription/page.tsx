import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SubscriptionStatusContent from "./SubscriptionStatusContent";
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

        <SubscriptionStatusContent priceId={priceId} />
      </main>
    </div>
  );
}
