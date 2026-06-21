"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  cancelAtPeriodEnd: boolean;
  dailyLimit: number | null;
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

function toTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toDateValue(value: unknown) {
  const stringValue = toTrimmedString(value);
  if (stringValue) {
    const normalized = stringValue
      .replace(" ", "T")
      .replace(/(\.\d{3})\d+/, "$1");
    return normalized;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const milliseconds = value < 1000000000000 ? value * 1000 : value;
    return new Date(milliseconds).toISOString();
  }

  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    if (
      [year, month, day, hour, minute, second].every(
        (part) => typeof part === "number" && Number.isFinite(part)
      )
    ) {
      return new Date(year, month - 1, day, hour, minute, second).toISOString();
    }
  }

  const objectValue = toObject(value);
  if (objectValue) {
    const year = toNumber(objectValue.year);
    const month = toNumber(objectValue.monthValue ?? objectValue.month);
    const day = toNumber(objectValue.dayOfMonth ?? objectValue.day);
    const hour = toNumber(objectValue.hour) ?? 0;
    const minute = toNumber(objectValue.minute) ?? 0;
    const second = toNumber(objectValue.second) ?? 0;

    if (year && month && day) {
      return new Date(year, month - 1, day, hour, minute, second).toISOString();
    }
  }

  return null;
}

const periodEndKeys = new Set([
  "subscriptionCurrentPeriodEnd",
  "currentPeriodEnd",
  "subscription_current_period_end",
  "current_period_end",
  "periodEnd",
  "period_end",
  "expiresAt",
  "expires_at",
  "cancelAt",
  "cancel_at",
]);

function readPeriodEndDate(value: unknown, seen = new WeakSet<object>()): string | null {
  const payload = toObject(value);
  if (!payload) {
    return null;
  }

  if (seen.has(payload)) {
    return null;
  }
  seen.add(payload);

  for (const [key, fieldValue] of Object.entries(payload)) {
    if (periodEndKeys.has(key)) {
      const dateValue = toDateValue(fieldValue);
      if (dateValue) {
        return dateValue;
      }
    }
  }

  for (const fieldValue of Object.values(payload)) {
    const nestedPayload = toObject(fieldValue);
    if (!nestedPayload) {
      continue;
    }

    const dateValue = readPeriodEndDate(nestedPayload, seen);
    if (dateValue) {
      return dateValue;
    }
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
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(parsed));
}

export default function SubscriptionStatusContent({
  priceId,
}: SubscriptionStatusContentProps) {
  const [billingUsage, setBillingUsage] = useState<BillingUsage>({
    plan: null,
    subscriptionStatus: null,
    subscriptionCurrentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    dailyLimit: null,
  });
  const [portalMessage, setPortalMessage] = useState("");
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const fetchBillingUsage = useCallback(async () => {
    const response = await authFetch("/api/billing/me", {
      method: "GET",
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    const payloadObject = toObject(payload);

    if (!response.ok || !payloadObject) {
      throw new Error("Failed to load billing status.");
    }

    let subscriptionCurrentPeriodEnd = readPeriodEndDate(payloadObject);

    if (!subscriptionCurrentPeriodEnd) {
      const usageResponse = await authFetch("/api/billing/me/usage", {
        method: "GET",
        cache: "no-store",
      });
      const usagePayload = await usageResponse.json().catch(() => null);
      const usagePayloadObject = toObject(usagePayload);
      if (usageResponse.ok && usagePayloadObject) {
        subscriptionCurrentPeriodEnd = readPeriodEndDate(usagePayloadObject);
      }
    }

    const nextBillingUsage = {
      plan: toTrimmedString(payloadObject.plan),
      subscriptionStatus: toTrimmedString(payloadObject.subscriptionStatus),
      subscriptionCurrentPeriodEnd,
      cancelAtPeriodEnd: payloadObject.cancelAtPeriodEnd === true,
      dailyLimit: toNumber(payloadObject.dailyLimit),
    };

    setBillingUsage(nextBillingUsage);
    return nextBillingUsage;
  }, []);

  useEffect(() => {
    void fetchBillingUsage().catch(() => {
      // Keep the default upgrade copy when billing status cannot be loaded.
    });
  }, [fetchBillingUsage]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("portal") !== "return") {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void fetchBillingUsage()
        .then((data) => {
          if (data.cancelAtPeriodEnd) {
            window.clearInterval(timer);
          }
        })
        .catch(() => {
          // Stripe webhook propagation can lag; retry until the timeout below.
        });
    }, 2000);

    const timeout = window.setTimeout(() => {
      window.clearInterval(timer);
    }, 15000);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };
  }, [fetchBillingUsage]);

  const normalizedPlan = billingUsage.plan?.toUpperCase() ?? "";
  const normalizedStatus = billingUsage.subscriptionStatus?.toLowerCase() ?? "";
  const isSubscribed =
    normalizedPlan === "PRO" && normalizedStatus !== "canceled";
  const isEndingAtPeriodEnd = isSubscribed && billingUsage.cancelAtPeriodEnd;
  const canCancelSubscription = isSubscribed && !isEndingAtPeriodEnd;
  const periodEnd = formatBillingDate(billingUsage.subscriptionCurrentPeriodEnd);
  const quotaComparison = useMemo(
    () => [
      ["Free", "3", "receipts/day"],
      ["Pro", String(billingUsage.dailyLimit ?? 10), "receipts/day"],
    ],
    [billingUsage.dailyLimit]
  );

  const handleCancelSubscription = async () => {
    try {
      setIsPortalLoading(true);
      setPortalMessage("");

      const origin = window.location.origin;
      const response = await authFetch("/api/billing/portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnUrl: `${origin}/settings/billing`,
        }),
      });
      const payload = await response.json().catch(() => null);
      const payloadObject = toObject(payload);
      const portalUrl = payloadObject?.url;

      if (!response.ok || typeof portalUrl !== "string" || !portalUrl.trim()) {
        const payloadMessage = payloadObject?.message;
        const errorMessage =
          typeof payloadMessage === "string" && payloadMessage.trim()
            ? payloadMessage
            : "Failed to open Stripe customer portal.";
        throw new Error(errorMessage);
      }

      window.location.assign(portalUrl.trim());
    } catch (error) {
      setIsPortalLoading(false);
      setPortalMessage(
        error instanceof Error
          ? error.message
          : "Failed to open Stripe customer portal."
      );
    }
  };

  return (
    <>
      <section className={styles.planTile}>
        <div className={styles.planInner}>
          <div className={styles.planIntro}>
            <p className={styles.kickerDark}>{isSubscribed ? "Current Plan" : "Pro Plan"}</p>
            <h2>
              {isEndingAtPeriodEnd
                ? "Pro access ends soon."
                : isSubscribed
                ? "Pro is active."
                : "10 receipts every day."}
            </h2>
            <p>
              {isEndingAtPeriodEnd
                ? "Your cancellation is scheduled. You can keep using Pro until the current period ends."
                : isSubscribed
                ? "Your subscription is already raising the ceiling for daily receipt processing."
                : "Built for heavier receipt workflows where quota should stay out of the way."}
            </p>
          </div>

          <div className={styles.planPanel}>
            <div className={styles.priceRow}>
              <h3>{isSubscribed ? "Pro" : "$0.99"}</h3>
              <span>
                {isEndingAtPeriodEnd ? "ending" : isSubscribed ? "active" : "/ month"}
              </span>
            </div>

            {isSubscribed ? (
              <div className={styles.currentPlan}>
                <span className={styles.statusBadge}>
                  {isEndingAtPeriodEnd ? "Ending" : "Subscribed"}
                </span>
                <p>
                  {isEndingAtPeriodEnd
                    ? periodEnd
                      ? `Your Pro access ends on ${periodEnd}.`
                      : "Your Pro access remains active until the current period ends."
                    : periodEnd
                    ? `Current period renews on ${periodEnd}.`
                    : "Your Pro subscription is active."}
                </p>
                <p>
                  Daily limit: <strong>{billingUsage.dailyLimit ?? 10}</strong> receipts.
                </p>
                {canCancelSubscription ? (
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={handleCancelSubscription}
                    disabled={isPortalLoading}
                  >
                    {isPortalLoading ? "Opening portal..." : "Cancel subscription"}
                  </button>
                ) : null}
                {isEndingAtPeriodEnd ? (
                  <p className={styles.note} role="status" aria-live="polite">
                    {periodEnd
                      ? `Subscription will expire on ${periodEnd}.`
                      : "Subscription cancellation is scheduled. Waiting for the period end date from billing."}
                  </p>
                ) : null}
                {portalMessage ? (
                  <p className={styles.note} role="status" aria-live="polite">
                    {portalMessage}
                  </p>
                ) : null}
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
    </>
  );
}
