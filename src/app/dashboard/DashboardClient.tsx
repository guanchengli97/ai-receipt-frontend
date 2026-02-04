"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const IconBell = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
    <path
      d="M12 3a5 5 0 0 1 5 5v2.6c0 .7.3 1.4.8 1.9l1.2 1.2a1 1 0 0 1-.7 1.7H5.7a1 1 0 0 1-.7-1.7l1.2-1.2c.5-.5.8-1.2.8-1.9V8a5 5 0 0 1 5-5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M9.5 18a2.5 2.5 0 0 0 5 0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const IconReceipt = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
    <path
      d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5V3Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M9 8h6M9 12h6M9 16h4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
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

const IconCamera = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="26" height="26">
    <path
      d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const IconLogout = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
    <path
      d="M10 4h-3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M14 16l4-4-4-4M8 12h10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type Receipt = {
  id: string;
  merchant: string;
  amount: number | null;
  status: string;
  date: string | null;
};

type UploadState = "idle" | "uploading" | "parsing" | "success" | "error";

function toObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readFirstString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function readFirstNumber(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = toNumber(source[key]);
    if (value !== null) {
      return value;
    }
  }
  return null;
}

function toDateIso(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return new Date(parsed).toISOString();
}

function normalizeReceipts(payload: unknown): Receipt[] {
  const payloadObject = toObject(payload);
  const receiptsRaw = Array.isArray(payload)
    ? payload
    : Array.isArray(payloadObject?.data)
      ? payloadObject.data
      : Array.isArray(payloadObject?.items)
        ? payloadObject.items
        : Array.isArray(payloadObject?.receipts)
          ? payloadObject.receipts
          : [];

  return receiptsRaw
    .map((item, index) => {
      const receiptObject = toObject(item);
      if (!receiptObject) {
        return null;
      }

      const rawId =
        receiptObject.id ?? receiptObject._id ?? receiptObject.receiptId ?? `receipt-${index}`;
      const id =
        typeof rawId === "string" || typeof rawId === "number" ? String(rawId) : `receipt-${index}`;
      const merchant =
        readFirstString(receiptObject, ["merchant", "merchantName", "store", "vendor", "name", "title"]) ??
        "Unknown Merchant";
      const amount = readFirstNumber(receiptObject, ["amount", "total", "totalAmount", "price", "sum"]);
      const status =
        readFirstString(receiptObject, ["status", "processingStatus", "state"]) ?? "Unknown";
      const date = toDateIso(
        receiptObject.createdAt ??
          receiptObject.date ??
          receiptObject.receiptDate ??
          receiptObject.transactionDate
      );

      return { id, merchant, amount, status, date };
    })
    .filter((receipt): receipt is Receipt => receipt !== null)
    .sort((left, right) => {
      const leftTime = left.date ? Date.parse(left.date) : 0;
      const rightTime = right.date ? Date.parse(right.date) : 0;
      return rightTime - leftTime;
    });
}

function formatAmount(amount: number | null) {
  if (amount === null) {
    return "--";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) {
    return "--";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function getAuthTokenFromCookie() {
  if (typeof document === "undefined") {
    return "";
  }
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export default function DashboardClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
  const [isLoadingRecentReceipts, setIsLoadingRecentReceipts] = useState(true);
  const [recentReceiptsError, setRecentReceiptsError] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadMessage, setUploadMessage] = useState("");

  const fetchRecentReceipts = useCallback(async () => {
    setIsLoadingRecentReceipts(true);
    setRecentReceiptsError("");

    try {
      const authToken = getAuthTokenFromCookie();
      const response = await fetch("/api/receipts/me", {
        method: "GET",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        credentials: "include",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const payloadMessage = toObject(payload)?.message;
        const message =
          typeof payloadMessage === "string" && payloadMessage.trim()
            ? payloadMessage
            : "Failed to load recent documents.";
        throw new Error(message);
      }

      setRecentReceipts(normalizeReceipts(payload).slice(0, 5));
    } catch (error) {
      setRecentReceipts([]);
      setRecentReceiptsError(
        error instanceof Error ? error.message : "Failed to load recent documents."
      );
    } finally {
      setIsLoadingRecentReceipts(false);
    }
  }, []);

  useEffect(() => {
    void fetchRecentReceipts();
  }, [fetchRecentReceipts]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setUploadState("uploading");
      setUploadMessage("Uploading receipt image...");

      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/s3-upload", {
        method: "POST",
        body: formData,
      });
      const uploadPayload = await uploadResponse.json().catch(() => null);
      const imageUrl = toObject(uploadPayload)?.url;

      if (!uploadResponse.ok || typeof imageUrl !== "string" || !imageUrl.trim()) {
        const message =
          typeof toObject(uploadPayload)?.message === "string"
            ? String(toObject(uploadPayload)?.message)
            : "Failed to upload receipt image.";
        throw new Error(message);
      }

      setUploadState("parsing");
      setUploadMessage("Image uploaded. Parsing receipt...");

      const authToken = getAuthTokenFromCookie();
      const parseResponse = await fetch("/api/receipts/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ url: imageUrl }),
      });
      const parsePayload = await parseResponse.json().catch(() => null);

      if (!parseResponse.ok) {
        const parseMessage = toObject(parsePayload)?.message;
        const message =
          typeof parseMessage === "string" && parseMessage.trim()
            ? parseMessage
            : "Failed to parse receipt.";
        throw new Error(message);
      }

      setUploadState("success");
      setUploadMessage("Receipt uploaded and sent for parsing.");
      await fetchRecentReceipts();
    } catch (error) {
      setUploadState("error");
      setUploadMessage(
        error instanceof Error ? error.message : "Receipt upload failed."
      );
    }
  };

  const recentRows: Receipt[] =
    isLoadingRecentReceipts
      ? [{ id: "loading", merchant: "Loading...", amount: null, date: null, status: "Loading" }]
      : recentReceiptsError
        ? [{ id: "error", merchant: recentReceiptsError, amount: null, date: null, status: "Error" }]
        : recentReceipts.length > 0
          ? recentReceipts
          : [{ id: "empty", merchant: "No recent documents", amount: null, date: null, status: "Empty" }];

  const handleLogout = () => {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `auth_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
    window.location.href = "/login";
  };

  return (
    <div className={styles.page}>
      <div className={styles.phone}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <span>AI</span>
            <span>Receipts</span>
          </div>
          <div className={styles.headerIcons}>
            <button
              className={styles.logoutIcon}
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
            >
              <IconLogout />
            </button>
            <button className={styles.iconButton} type="button">
              <IconBell />
            </button>
            <div className={styles.avatar}>AL</div>
          </div>
        </header>

        <section className={styles.cards}>
          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <h3>Total Spent</h3>
              <p>$2,845</p>
              <span>This Month</span>
            </div>
            <div className={styles.statIcon}>
              <IconReceipt />
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <h3>Receipts Processed</h3>
              <p>32</p>
              <span>This Month</span>
            </div>
            <div className={styles.statIcon}>
              <IconLock />
            </div>
          </div>
        </section>

        <section className={styles.chartCard}>
          <div className={styles.chartHeader}>Spending by Category</div>
          <div className={styles.chartBody}>
            <div className={styles.donut} />
            <div className={styles.lineChart}>
              <div className={styles.line} />
            </div>
          </div>
        </section>

        <section>
          <div className={styles.recentHeader}>
            <span>Recent Documents</span>
            <Link href="#">View All</Link>
          </div>
          <div className={styles.list}>
            {recentRows.map((receipt) => (
              <div className={styles.listItem} key={receipt.id}>
                <div className={styles.thumb}>{receipt.merchant.slice(0, 1).toUpperCase()}</div>
                <div className={styles.meta}>
                  <h4>{receipt.merchant}</h4>
                  <p>
                    {formatAmount(receipt.amount)} · {formatDate(receipt.date)}
                  </p>
                </div>
                <span className={styles.statusTag}>{receipt.status}</span>
              </div>
            ))}
          </div>
        </section>

        {uploadState !== "idle" && (
          <div className={styles.uploadStatus} role="status" aria-live="polite">
            {uploadMessage}
          </div>
        )}

        <nav className={styles.bottomNav}>
          <div className={styles.navItem}>
            <IconReceipt />
            Dashboard
          </div>
          <div className={styles.navItem}>
            <button
              className={styles.fab}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadState === "uploading" || uploadState === "parsing"}
              aria-label="Take photo and upload receipt"
              title="Take photo and upload receipt"
            >
              <IconCamera />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className={styles.hiddenInput}
              onChange={handleFileSelect}
            />
          </div>
          <div className={styles.navItem}>
            <IconLock />
            Transactions
          </div>
        </nav>
      </div>
    </div>
  );
}
