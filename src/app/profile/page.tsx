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

function formatDate(value: string) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
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

  const accountMeta = useMemo(() => {
    if (!profile) {
      return [];
    }

    return [
      ["Status", profile.isActive === false ? "Inactive" : "Active"],
      ["User ID", profile.id ? `#${profile.id}` : "--"],
      ["Member since", formatDate(profile.createdAt)],
      ["Last updated", formatDate(profile.updatedAt)],
    ];
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
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.back} href="/dashboard" prefetch aria-label="Back to dashboard">
            Back
          </Link>
          <p className={styles.title}>Profile</p>
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
        </div>
      </header>

      <main className={styles.main}>
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
            <section className={styles.hero}>
              <div className={styles.heroCopy}>
                <p className={styles.kicker}>Personal profile</p>
                <h1>{profile.username || "Unknown User"}</h1>
                <p>
                  Manage the account details used across receipt uploads,
                  review flows, and exported transaction records.
                </p>
              </div>

              <div className={styles.identityPanel}>
                <div className={styles.avatar}>{initials}</div>
                <div className={styles.identity}>
                  <h2>{profile.username || "Unknown User"}</h2>
                  <p>{profile.email || "--"}</p>
                </div>
                <button className={styles.editPhoto} type="button">
                  Edit Photo
                </button>
              </div>
            </section>

            <section className={styles.detailsSection}>
              <div className={styles.detailsIntro}>
                <p className={styles.kickerDark}>Account</p>
                <h2>Keep your receipt workspace current.</h2>
                <p>
                  Profile changes apply to the signed-in account and are saved
                  after confirmation.
                </p>
              </div>

              <div className={styles.detailsPanel}>
                <div className={styles.list}>
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
                </div>

                <div className={styles.metaGrid}>
                  {accountMeta.map(([label, value]) => (
                    <article className={styles.metaCard} key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </article>
                  ))}
                </div>

                <div className={styles.footerActions}>
                  {isEditing && (
                    <button className={styles.cancel} type="button" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  )}

                  <button className={styles.logout} type="button" onClick={logoutAndRedirect}>
                    Log Out
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
