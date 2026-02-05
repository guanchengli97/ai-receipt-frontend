"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../auth.module.css";

const IconMail = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.inputIcon}>
    <path
      d="M4.5 6.75h15A1.5 1.5 0 0 1 21 8.25v7.5A1.5 1.5 0 0 1 19.5 17.25h-15A1.5 1.5 0 0 1 3 15.75v-7.5A1.5 1.5 0 0 1 4.5 6.75Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="m4 8 8 5 8-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.inputIcon}>
    <path
      d="M7 10V8a5 5 0 0 1 10 0v2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <rect
      x="5"
      y="10"
      width="14"
      height="10"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const IconGoogle = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
    <path
      d="M21.35 12.2c0-.68-.06-1.35-.2-2H12v3.78h5.3a4.54 4.54 0 0 1-1.96 2.98v2.46h3.17c1.86-1.71 2.84-4.22 2.84-7.22Z"
      fill="#4285F4"
    />
    <path
      d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.17-2.46c-.88.6-2 .95-3.45.95-2.65 0-4.9-1.79-5.7-4.2H2.99v2.64A10 10 0 0 0 12 22Z"
      fill="#34A853"
    />
    <path
      d="M6.3 13.85a5.96 5.96 0 0 1 0-3.7V7.5H2.99a10 10 0 0 0 0 9l3.31-2.65Z"
      fill="#FBBC05"
    />
    <path
      d="M12 6.5c1.47 0 2.79.5 3.83 1.49l2.86-2.86C16.96 3.6 14.7 2.5 12 2.5A10 10 0 0 0 2.99 7.5l3.31 2.65C7.1 8.29 9.35 6.5 12 6.5Z"
      fill="#EA4335"
    />
  </svg>
);

const IconApple = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
    <path
      d="M16.7 12.9c.02 2.4 2.1 3.2 2.12 3.21-.02.06-.33 1.1-1.1 2.17-.67.95-1.37 1.9-2.46 1.92-1.06.02-1.4-.63-2.61-.63-1.2 0-1.58.61-2.58.65-1.05.04-1.85-1.05-2.53-2-1.38-1.97-2.44-5.56-1.02-8 1.04-1.78 2.9-2.91 4.93-2.94 1.03-.02 2 .68 2.61.68.62 0 1.78-.84 3-.72.51.02 1.95.2 2.88 1.55-.07.04-1.72 1-1.7 3.11Z"
      fill="#111111"
    />
    <path
      d="M14.8 4.3c.56-.67.94-1.6.84-2.53-.81.03-1.78.54-2.35 1.2-.52.6-.97 1.55-.85 2.46.9.07 1.8-.45 2.36-1.13Z"
      fill="#111111"
    />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (match && match[1]) {
      window.location.replace("/dashboard");
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Login failed. Please try again.");
      }

      if (data?.token) {
        const maxAge = 60 * 60 * 24 * 7;
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `auth_token=${data.token}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
      }

      setStatus("success");
      setMessage("Logged in successfully. Redirecting...");
      window.location.href = "/dashboard";
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again."
      );
    }
  };

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
            alt="Receipts dashboard illustration"
            width={320}
            height={200}
            className={styles.heroImage}
            priority
          />
        </div>

        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>
          Sign in to track and organize your receipts in seconds.
        </p>

        <form
          className={`${styles.form} ${styles.stagger}`}
          onSubmit={handleSubmit}
        >
          <label className={styles.inputRow}>
            <IconMail />
            <input
              className={styles.input}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className={styles.inputRow}>
            <IconLock />
            <input
              className={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Link className={styles.inlineLink} href="#">
              Forgot password?
            </Link>
          </label>

          <button
            className={styles.primaryButton}
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Logging In..." : "Log In"}
          </button>

          {status !== "idle" && message && (
            <div
              className={`${styles.status} ${
                status === "success" ? styles.statusSuccess : styles.statusError
              }`}
            >
              {message}
            </div>
          )}
        </form>

        <p className={styles.helper}>
          Don&apos;t have an account? <Link href="/register">Sign Up</Link>
        </p>

        <div className={styles.divider}>Or sign in with</div>

        <div className={`${styles.form} ${styles.stagger}`}>
          <button className={styles.socialButton} type="button">
            <IconGoogle />
            Continue with Google
          </button>
          <button className={styles.socialButton} type="button">
            <IconApple />
            Continue with Apple
          </button>
        </div>

        <div className={styles.footer}>
          By continuing, you agree to our Terms &amp; Privacy Policy.
        </div>
      </div>
    </div>
  );
}
