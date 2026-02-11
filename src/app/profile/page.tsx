"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { authFetch, logoutAndRedirect } from "../../lib/auth-client";
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

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [isEditing, setIsEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [currencyInput, setCurrencyInput] = useState("$");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error" | "success">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const response = await authFetch("/api/users/me", {
          method: "GET",
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

  const handleStartEdit = () => {
    if (!profile) {
      return;
    }
    setUsernameInput(profile.username || "");
    setCurrencyInput(profile.currency || "$");
    setSaveStatus("idle");
    setSaveMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveStatus("idle");
    setSaveMessage("");
  };

  const handleSaveProfile = async () => {
    if (!profile) {
      return;
    }

    const nextUsername = usernameInput.trim();
    const nextCurrency = currencyInput.trim() || "USD";

    if (!nextUsername) {
      setSaveStatus("error");
      setSaveMessage("Username is required.");
      return;
    }

    try {
      setSaveStatus("saving");
      setSaveMessage("");

      const response = await authFetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: nextUsername,
          currency: nextCurrency,
        }),
      });
      const payload = await response.json().catch(() => null);
      const payloadObject = toObject(payload);

      if (!response.ok || !payloadObject) {
        const message =
          typeof payloadObject?.message === "string" && payloadObject.message.trim()
            ? payloadObject.message
            : "Failed to update profile.";
        throw new Error(message);
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
      setIsEditing(false);
      setSaveStatus("success");
      setSaveMessage("Profile updated.");
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(error instanceof Error ? error.message : "Failed to update profile.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.phone}>
        <header className={styles.header}>
          <Link className={styles.back} href="/dashboard" prefetch aria-label="Back to dashboard">
            ←
          </Link>
          <h1 className={styles.title}>Profile</h1>
          {!isEditing ? (
            <button
              className={styles.action}
              type="button"
              onClick={handleStartEdit}
              disabled={status !== "success" || !profile}
            >
              Edit
            </button>
          ) : (
            <button className={styles.action} type="button" onClick={handleSaveProfile}>
              {saveStatus === "saving" ? "Saving..." : "Save"}
            </button>
          )}
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
        {saveMessage && (
          <div className={styles.status} data-state={saveStatus}>
            {saveMessage}
          </div>
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
                {isEditing ? (
                  <input
                    className={styles.input}
                    type="text"
                    value={usernameInput}
                    onChange={(event) => setUsernameInput(event.target.value)}
                    placeholder="Enter username"
                    maxLength={60}
                  />
                ) : (
                  <span className={styles.value}>{profile.username || "--"}</span>
                )}
              </div>
              <div className={styles.listItem}>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{profile.email || "--"}</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.label}>Currency</span>
                {isEditing ? (
                  <select
                    className={styles.select}
                    value={currencyInput}
                    onChange={(event) => setCurrencyInput(event.target.value)}
                  >
                    <option value="$">USD</option>
                  </select>
                ) : (
                  <span className={styles.value}>{profile.currency || "--"}</span>
                )}
              </div>
            </section>

            {isEditing && (
              <button className={styles.cancel} type="button" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}

            <button className={styles.logout} type="button" onClick={logoutAndRedirect}>
              Log Out
            </button>
          </>
        )}
      </div>
    </div>
  );
}
