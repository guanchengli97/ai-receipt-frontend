"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type UserProfile = {
  id: number | null;
  username: string;
  email: string;
  currency: string;
  isActive: boolean | null;
  createdAt: string;
  updatedAt: string;
};

function toObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function formatDate(value: string) {
  if (!value) {
    return "--";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(parsed));
}

function getAuthTokenFromCookie() {
  if (typeof document === "undefined") {
    return "";
  }
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const authToken = getAuthTokenFromCookie();
        const response = await fetch("/api/users/me", {
          method: "GET",
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        const payloadObject = toObject(payload);

        if (!response.ok || !payloadObject) {
          throw new Error("Failed to load profile.");
        }

        if (!isMounted) {
          return;
        }

        setProfile({
          id: toNumber(payloadObject.id),
          username: toString(payloadObject.username),
          email: toString(payloadObject.email),
          currency: toString(payloadObject.currency),
          isActive: toBoolean(payloadObject.isActive),
          createdAt: toString(payloadObject.createdAt),
          updatedAt: toString(payloadObject.updatedAt),
        });
        setStatus("success");
      } catch {
        if (!isMounted) {
          return;
        }
        setStatus("error");
      }
    };

    void fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const initials = useMemo(() => {
    const name = profile?.username?.trim() || "User";
    const parts = name.split(" ").filter(Boolean);
    const first = parts[0]?.[0] ?? "U";
    const second = parts[1]?.[0] ?? "";
    return `${first}${second}`.toUpperCase();
  }, [profile]);

  const handleLogout = () => {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `auth_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
    window.location.href = "/login";
  };

  return (
    <div className={styles.page}>
      <div className={styles.phone}>
        <header className={styles.header}>
          <Link className={styles.back} href="/dashboard" aria-label="Back to dashboard">
            ←
          </Link>
          <h1 className={styles.title}>Profile</h1>
          <span className={styles.action}>Save</span>
        </header>

        <section className={styles.hero}>
          <div className={styles.avatar}>{initials}</div>
          <button className={styles.editPhoto} type="button">
            Edit Photo
          </button>
        </section>

        {status === "loading" && <div className={styles.status}>Loading profile...</div>}
        {status === "error" && (
          <div className={styles.status}>Failed to load profile. Please try again.</div>
        )}

        {status === "success" && profile && (
          <>
            <div className={styles.identity}>
              <h2>{profile.username || "Unknown User"}</h2>
              <p>{profile.email || "--"}</p>
            </div>

            <section className={styles.list}>
              <div className={styles.listItem}>
                <span className={styles.label}>Full Name</span>
                <span className={styles.value}>{profile.username || "--"}</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{profile.email || "--"}</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.label}>Currency</span>
                <span className={styles.value}>{profile.currency || "--"}</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.label}>Status</span>
                <span className={styles.value}>
                  {profile.isActive === null ? "--" : profile.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.label}>Created</span>
                <span className={styles.value}>{formatDate(profile.createdAt)}</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.label}>Updated</span>
                <span className={styles.value}>{formatDate(profile.updatedAt)}</span>
              </div>
            </section>

            <button className={styles.logout} type="button" onClick={handleLogout}>
              Log Out
            </button>
          </>
        )}
      </div>
    </div>
  );
}
