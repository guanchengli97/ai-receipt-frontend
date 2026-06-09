"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { authFetch } from "../../lib/auth-client";
import SubscriptionCheckoutButton from "./SubscriptionCheckoutButton";
import styles from "./page.module.css";

const proFeatures = [
  "Up to 10 receipts per day",
  "Priority parsing queue",
  "Advanced analytics access",
];

type BillingUsage = {
  plan: string | null;
  subscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  dailyLimit: number | null;
  usedToday: number | null;
  remainingToday: number | null;
};

type SubscriptionStatusContentProps = {
  priceId: string;
};

function toObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatBillingDate(value: string | null) {
  if (!value) {
    return "";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(parsed));
}

export default function SubscriptionStatusContent({
  priceId,
}: SubscriptionStatusContentProps) {
  const [billingUsage, setBillingUsage] = useState<BillingUsage>({
    plan: null,
    subscriptionStatus: null,
    subscriptionCurrentPeriodEnd: null,
    dailyLimit: null,
    usedToday: null,
    remainingToday: null,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchBillingUsage = async () => {
      try {
        const response = await authFetch("/api/billing/me/usage", {
          method: "GET",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        const payloadObject = toObject(payload);

        if (!response.ok || !payloadObject || !isMounted) {
          return;
        }

        setBillingUsage({
          plan:
            typeof payloadObject.plan === "string" && payloadObject.plan.trim()
              ? payloadObject.plan.trim()
              : null,
          subscriptionStatus:
            typeof payloadObject.subscriptionStatus === "string" &&
            payloadObject.subscriptionStatus.trim()
              ? payloadObject.subscriptionStatus.trim()
              : null,
          subscriptionCurrentPeriodEnd:
            typeof payloadObject.subscriptionCurrentPeriodEnd === "string" &&
            payloadObject.subscriptionCurrentPeriodEnd.trim()
              ? payloadObject.subscriptionCurrentPeriodEnd.trim()
              : null,
          dailyLimit: toNumber(payloadObject.dailyLimit),
          usedToday: toNumber(payloadObject.usedToday),
          remainingToday: toNumber(payloadObject.remainingToday),
        });
      } catch {
        // Keep the default upgrade copy when usage cannot be loaded.
      }
    };

    void fetchBillingUsage();

    return () => {
      isMounted = false;
    };
  }, []);

  const isSubscribed = ["active", "trialing"].includes(
    billingUsage.subscriptionStatus?.toLowerCase() ?? ""
  );
  const periodEnd = formatBillingDate(billingUsage.subscriptionCurrentPeriodEnd);
  const quotaComparison = useMemo(
    () => [
      ["Used today", String(billingUsage.usedToday ?? 0), "receipts"],
      [
        "Remaining",
        billingUsage.remainingToday === null ? "--" : String(billingUsage.remainingToday),
        "receipts today",
      ],
    ],
    [billingUsage.remainingToday, billingUsage.usedToday]
  );

  return (
    <>
      <section className={styles.planTile}>
        <div className={styles.planInner}>
          <div className={styles.planIntro}>
            <p className={styles.kickerDark}>{isSubscribed ? "Current Plan" : "Pro Plan"}</p>
            <h2>{isSubscribed ? "Pro is active." : "10 receipts every day."}</h2>
            <p>
              {isSubscribed
                ? "Your subscription is already raising the ceiling for daily receipt processing."
                : "Built for heavier receipt workflows where quota should stay out of the way."}
            </p>
          </div>

          <div className={styles.planPanel}>
            <div className={styles.priceRow}>
              <h3>{isSubscribed ? "Pro" : "$9.99"}</h3>
              <span>{isSubscribed ? "active" : "/ month"}</span>
            </div>

            {isSubscribed ? (
              <div className={styles.currentPlan}>
                <span className={styles.statusBadge}>Subscribed</span>
                <p>
                  {periodEnd
                    ? `Current period renews on ${periodEnd}.`
                    : "Your Pro subscription is active."}
                </p>
                <p>
                  Daily limit: <strong>{billingUsage.dailyLimit ?? 10}</strong> receipts.
                </p>
                <Link className={styles.subscribeButton} href="/dashboard" prefetch>
                  Back to Dashboard
                </Link>
              </div>
            ) : (
              <>
                <ul className={styles.featureList}>
                  {proFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <SubscriptionCheckoutButton priceId={priceId} />
                <p className={styles.note}>
                  You will be redirected to Stripe Checkout to complete payment.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className={styles.quotaSection} aria-labelledby="quota-heading">
        <div className={styles.quotaInner}>
          <div className={styles.quotaIntro}>
            <h2 id="quota-heading">Daily quota</h2>
            <p>
              {isSubscribed
                ? "Your Pro quota is available for today's receipt processing."
                : "Your current free plan includes 3 receipt scans per day."}
            </p>
          </div>
          <div className={styles.quotaGrid}>
            {isSubscribed
              ? quotaComparison.map(([plan, value, label]) => (
                  <article className={styles.quotaCard} key={plan}>
                    <p>{plan}</p>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </article>
                ))
              : [
                  ["Free", "3", "receipts/day"],
                  ["Pro", "10", "receipts/day"],
                ].map(([plan, value, label]) => (
                  <article className={styles.quotaCard} key={plan}>
                    <p>{plan}</p>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </article>
                ))}
          </div>
        </div>
      </section>
    </>
  );
}
