"use client";

import { useState } from "react";
import { authFetch } from "../../lib/auth-client";
import styles from "./page.module.css";

type SubscriptionCheckoutButtonProps = {
  priceId: string;
};

function toObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export default function SubscriptionCheckoutButton({
  priceId,
}: SubscriptionCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubscribe = async () => {
    if (!priceId.trim()) {
      setMessage("Stripe price is not configured. Set NEXT_PUBLIC_STRIPE_PRO_PRICE_ID.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      const origin = window.location.origin;
      const response = await authFetch("/api/billing/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: priceId.trim(),
          successUrl: `${origin}/billing/success`,
          cancelUrl: `${origin}/billing/cancel`,
        }),
      });
      const payload = await response.json().catch(() => null);
      const payloadObject = toObject(payload);
      const checkoutUrl = payloadObject?.url;

      if (!response.ok || typeof checkoutUrl !== "string" || !checkoutUrl.trim()) {
        const payloadMessage = payloadObject?.message;
        const errorMessage =
          typeof payloadMessage === "string" && payloadMessage.trim()
            ? payloadMessage
            : "Failed to create checkout session.";
        throw new Error(errorMessage);
      }

      window.location.href = checkoutUrl.trim();
    } catch (error) {
      setIsLoading(false);
      setMessage(
        error instanceof Error ? error.message : "Failed to create checkout session."
      );
    }
  };

  return (
    <>
      <button
        className={styles.subscribeButton}
        type="button"
        onClick={handleSubscribe}
        disabled={isLoading}
      >
        {isLoading ? "Redirecting..." : "Subscribe Now"}
      </button>
      {message ? (
        <p className={styles.note} role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </>
  );
}
