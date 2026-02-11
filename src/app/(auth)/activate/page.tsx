"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "../auth.module.css";

type ActivateStatus = "loading" | "success" | "error";

export default function ActivatePage() {
  const [status, setStatus] = useState<ActivateStatus>("loading");
  const [message, setMessage] = useState("Activating your email...");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const run = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Activation token is missing. Please register again or request a new activation email.");
        return;
      }

      try {
        const response = await fetch(`/api/auth/activate?token=${encodeURIComponent(token)}`, {
          method: "GET",
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Activation link is invalid or expired");
        }

        setStatus("success");
        setMessage("Email activated successfully. You can now log in.");
        timeoutRef.current = window.setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Activation link is invalid or expired"
        );
      }
    };

    run();

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>AI</span>
          <span className={styles.brandText}>Receipts</span>
        </div>

        <div className={styles.hero}>
          <span className={styles.heroGlow} />
          <Image
            src="/hero-illustration.svg"
            alt="Email activation illustration"
            width={320}
            height={200}
            className={styles.heroImage}
            priority
          />
        </div>

        <h1 className={styles.title}>Activate Email</h1>
        <p className={styles.subtitle}>
          {status === "loading"
            ? "Please wait while we verify your activation link."
            : status === "success"
            ? "Your account is now active. Redirecting to login..."
            : "We could not activate your email with this link."}
        </p>

        <div className={`${styles.form} ${styles.stagger}`}>
          <div
            className={`${styles.status} ${
              status === "success" ? styles.statusSuccess : status === "error" ? styles.statusError : ""
            }`}
          >
            {message}
          </div>

          {status === "success" && (
            <Link className={styles.primaryButton} href="/login">
              Go to Login
            </Link>
          )}

          {status === "error" && (
            <Link className={styles.primaryButton} href="/register">
              Register Again / Resend Email
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

