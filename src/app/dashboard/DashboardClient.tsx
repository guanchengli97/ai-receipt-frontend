"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type ReceiptStats = {
  totalSpentThisMonth: number | null;
  receiptsProcessedThisMonth: number | null;
};

type CategoryStat = {
  category: string;
  amount: number;
};

type SpendingByCategoryStats = {
  currency: string;
  totalSpent: number | null;
  categories: CategoryStat[];
};

type UploadState = "idle" | "uploading" | "parsing" | "success" | "error";

const CATEGORY_COLOR_PALETTE = [
  "#f28b45",
  "#6ea8ff",
  "#9ed19d",
  "#b089f7",
  "#f3c969",
  "#6fd7cc",
];

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

function toDateString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
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
        receiptObject.receiptId ?? receiptObject.id ?? receiptObject._id ?? `receipt-${index}`;
      const id =
        typeof rawId === "string" || typeof rawId === "number" ? String(rawId) : `receipt-${index}`;
      const merchant =
        readFirstString(receiptObject, ["merchant", "merchantName", "store", "vendor", "name", "title"]) ??
        "Unknown Merchant";
      const amount = readFirstNumber(receiptObject, ["amount", "total", "totalAmount", "price", "sum"]);
      const reviewed = receiptObject.reviewed;
      const status =
        typeof reviewed === "boolean"
          ? reviewed
            ? "Reviewed"
            : "Unreview"
          : readFirstString(receiptObject, ["status", "processingStatus", "state"]) ?? "Unknown";
      const date = toDateString(
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

function formatAmountWithCurrency(amount: number, currency: string) {
  const normalizedCurrency = currency && currency.trim() ? currency.trim().toUpperCase() : "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

function formatDate(date: string | null) {
  if (!date) {
    return "--";
  }
  const trimmed = date.trim();
  if (!trimmed) {
    return "--";
  }
  const dateOnly = trimmed.split("T")[0];
  return dateOnly || trimmed;
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
  const [userInitials, setUserInitials] = useState("U");
  const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
  const [isLoadingRecentReceipts, setIsLoadingRecentReceipts] = useState(true);
  const [recentReceiptsError, setRecentReceiptsError] = useState("");
  const [stats, setStats] = useState<ReceiptStats>({
    totalSpentThisMonth: null,
    receiptsProcessedThisMonth: null,
  });
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [categoryStats, setCategoryStats] = useState<SpendingByCategoryStats>({
    currency: "USD",
    totalSpent: null,
    categories: [],
  });
  const [isLoadingCategoryStats, setIsLoadingCategoryStats] = useState(true);

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

      setRecentReceipts(normalizeReceipts(payload).slice(0, 15));
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

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const authToken = getAuthTokenFromCookie();
        const response = await fetch("/api/receipts/me/stats", {
          method: "GET",
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        const payloadObject = toObject(payload);

        if (!response.ok || !payloadObject) {
          throw new Error("Failed to load stats.");
        }

        if (!isMounted) {
          return;
        }

        setStats({
          totalSpentThisMonth: toNumber(payloadObject.totalSpentThisMonth),
          receiptsProcessedThisMonth: toNumber(payloadObject.receiptsProcessedThisMonth),
        });
      } catch {
        if (!isMounted) {
          return;
        }
        setStats({
          totalSpentThisMonth: null,
          receiptsProcessedThisMonth: null,
        });
      }
    };

    void fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCategoryStats = async () => {
      try {
        setIsLoadingCategoryStats(true);
        const authToken = getAuthTokenFromCookie();
        const response = await fetch("/api/receipts/me/stats/by-category", {
          method: "GET",
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        const payloadObject = toObject(payload);

        if (!response.ok || !payloadObject) {
          throw new Error("Failed to load category stats.");
        }

        if (!isMounted) {
          return;
        }

        const categoriesRaw = Array.isArray(payloadObject.categories) ? payloadObject.categories : [];
        const categories = categoriesRaw
          .map((item) => {
            const itemObject = toObject(item);
            if (!itemObject) {
              return null;
            }
            const category =
              typeof itemObject.category === "string" && itemObject.category.trim()
                ? itemObject.category.trim()
                : "Other";
            const amount = toNumber(itemObject.amount) ?? 0;
            return { category, amount };
          })
          .filter((item): item is CategoryStat => item !== null && item.amount > 0);

        setCategoryStats({
          currency:
            typeof payloadObject.currency === "string" && payloadObject.currency.trim()
              ? payloadObject.currency.trim()
              : "USD",
          totalSpent: toNumber(payloadObject.totalSpent),
          categories,
        });
      } catch {
        if (!isMounted) {
          return;
        }
        setCategoryStats({
          currency: "USD",
          totalSpent: null,
          categories: [],
        });
      } finally {
        if (!isMounted) {
          return;
        }
        setIsLoadingCategoryStats(false);
      }
    };

    void fetchCategoryStats();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
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
        const username =
          payloadObject && typeof payloadObject.username === "string"
            ? payloadObject.username.trim()
            : "";

        if (!response.ok || !isMounted || !username) {
          return;
        }

        const parts = username.split(" ").filter(Boolean);
        const first = parts[0]?.[0] ?? "U";
        const second = parts[1]?.[0] ?? "";
        setUserInitials(`${first}${second}`.toUpperCase());
      } catch {
        // Keep default initials when profile fetch fails.
      }
    };

    void fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (uploadState !== "success") {
      return;
    }

    const timer = window.setTimeout(() => {
      setUploadState("idle");
      setUploadMessage("");
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [uploadState]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setUploadState("uploading");
      setUploadMessage("Preparing direct upload...");

      const authToken = getAuthTokenFromCookie();
      const presignResponse = await fetch("/api/images/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "image/jpeg",
          sizeBytes: file.size,
        }),
      });
      const presignPayload = await presignResponse.json().catch(() => null);
      const uploadPayloadObject = toObject(presignPayload);
      const imageId = uploadPayloadObject?.imageId;
      const objectKey = uploadPayloadObject?.objectKey;
      const uploadUrl = uploadPayloadObject?.uploadUrl;

      if (
        !presignResponse.ok ||
        (typeof imageId !== "number" && typeof imageId !== "string") ||
        typeof objectKey !== "string" ||
        !objectKey.trim() ||
        typeof uploadUrl !== "string" ||
        !uploadUrl.trim()
      ) {
        const message =
          typeof uploadPayloadObject?.message === "string"
            ? String(uploadPayloadObject.message)
            : "Failed to create upload URL.";
        throw new Error(message);
      }

      setUploadMessage("Uploading receipt image...");

      const directUploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "image/jpeg",
        },
        body: file,
      });

      if (!directUploadResponse.ok) {
        throw new Error("Failed to upload image to storage.");
      }

      setUploadState("parsing");
      setUploadMessage("Image uploaded. Parsing receipt...");

      const parseResponse = await fetch("/api/receipts/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          imageId: typeof imageId === "number" ? imageId : imageId.trim(),
          objectKey: objectKey.trim(),
        }),
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

  const isNavigableReceipt = (receipt: Receipt) =>
    Boolean(receipt.id) && !["loading", "error", "empty"].includes(receipt.id);

  const donutStyle = useMemo(() => {
    const total =
      categoryStats.totalSpent !== null
        ? categoryStats.totalSpent
        : categoryStats.categories.reduce((sum, item) => sum + item.amount, 0);

    if (total <= 0 || categoryStats.categories.length === 0) {
      return { background: "conic-gradient(#dfe7fb 0 100%)" };
    }

    let current = 0;
    const segments = categoryStats.categories.map((item, index) => {
      const start = current;
      current += (item.amount / total) * 100;
      const color = CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length];
      return `${color} ${start}% ${Math.min(current, 100)}%`;
    });

    return { background: `conic-gradient(${segments.join(", ")})` };
  }, [categoryStats]);

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
            {/* <button className={styles.iconButton} type="button">
              <IconBell />
            </button> */}
            <Link className={styles.avatar} href="/profile" aria-label="Open profile">
              {userInitials}
            </Link>
          </div>
        </header>

        <section className={styles.cards}>
          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <h3>Total Spent</h3>
              <p>{formatAmount(stats.totalSpentThisMonth)}</p>
              <span>This Month</span>
            </div>
            <div className={styles.statIcon}>
              <IconReceipt />
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <h3>Receipts Processed</h3>
              <p>{stats.receiptsProcessedThisMonth ?? "--"}</p>
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
            <div className={styles.donut} style={donutStyle} />
            <div className={styles.donutLabels}>
              {isLoadingCategoryStats && <span>Loading categories...</span>}
              {!isLoadingCategoryStats && categoryStats.categories.length === 0 && (
                <span>No category data</span>
              )}
              {!isLoadingCategoryStats &&
                categoryStats.categories.map((item, index) => {
                  const color = CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length];
                  return (
                    <span key={`${item.category}-${index}`}>
                      <i
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: color,
                          marginRight: 6,
                          verticalAlign: "middle",
                        }}
                      />
                      {item.category}:{" "}
                      {formatAmountWithCurrency(item.amount, categoryStats.currency)}
                    </span>
                  );
                })}
            </div>
          </div>
        </section>

        <section>
          <div className={styles.recentHeader}>
            <span>Recent Documents</span>
            {/* <Link href="#">View All</Link> */}
          </div>
          <div className={styles.list}>
            {recentRows.map((receipt) => {
              const content = (
                <>
                  <div className={styles.thumb}>{receipt.merchant.slice(0, 1).toUpperCase()}</div>
                  <div className={styles.meta}>
                    <h4>{receipt.merchant}</h4>
                    <p>
                      {formatAmount(receipt.amount)} · {formatDate(receipt.date)}
                    </p>
                  </div>
                  <span
                    className={`${styles.statusTag} ${
                      receipt.status === "Reviewed" ? styles.statusReviewed : ""
                    }`}
                  >
                    {receipt.status}
                  </span>
                </>
              );

              return isNavigableReceipt(receipt) ? (
                <Link className={styles.listItem} href={`/receipts/${receipt.id}`} key={receipt.id}>
                  {content}
                </Link>
              ) : (
                <div className={styles.listItem} key={receipt.id}>
                  {content}
                </div>
              );
            })}
          </div>
        </section>

        {uploadState !== "idle" && (
          <div className={styles.uploadStatus} role="status" aria-live="polite">
            {uploadMessage}
          </div>
        )}

        <nav className={styles.bottomNav}>
          <div className={`${styles.navItem} ${styles.navItemActive}`}>
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
          <Link className={styles.navItem} href="/transactions">
            <IconLock />
            Transactions
          </Link>
        </nav>
      </div>
    </div>
  );
}
