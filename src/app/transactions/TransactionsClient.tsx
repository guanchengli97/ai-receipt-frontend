"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Transaction = {
  id: string;
  merchant: string;
  amount: number | null;
  date: string | null;
};

type ReceiptStats = {
  totalSpentThisMonth: number | null;
  receiptsProcessedThisMonth: number | null;
};

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

function parseReceiptDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  // Keep YYYY-MM-DD in local time to avoid timezone shift.
  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const monthIndex = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    return new Date(year, monthIndex, day);
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return new Date(parsed);
}

function normalizeTransactions(payload: unknown): Transaction[] {
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
      const date = toDateString(
        receiptObject.createdAt ??
          receiptObject.date ??
          receiptObject.receiptDate ??
          receiptObject.transactionDate
      );

      return { id, merchant, amount, date };
    })
    .filter((receipt): receipt is Transaction => receipt !== null)
    .sort((left, right) => {
      const leftTime = parseReceiptDate(left.date)?.getTime() ?? 0;
      const rightTime = parseReceiptDate(right.date)?.getTime() ?? 0;
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

function getAuthTokenFromCookie() {
  if (typeof document === "undefined") {
    return "";
  }
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function getDateLabel(value: string | null) {
  if (!value) {
    return "--";
  }
  const parsedDate = parseReceiptDate(value);
  if (!parsedDate) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

function getMonthLabel(value: string | null) {
  const parsedDate = parseReceiptDate(value);
  if (!parsedDate) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(parsedDate).toUpperCase();
}

type GroupedTransactions = {
  year: string;
  months: { month: string; items: Transaction[] }[];
}[];

function groupTransactionsByYearAndMonth(transactions: Transaction[]): GroupedTransactions {
  const groupedMap = new Map<string, Map<string, Transaction[]>>();

  for (const item of transactions) {
    const parsedDate = parseReceiptDate(item.date);
    const year = parsedDate ? String(parsedDate.getFullYear()) : "Unknown";
    const month = getMonthLabel(item.date);

    if (!groupedMap.has(year)) {
      groupedMap.set(year, new Map<string, Transaction[]>());
    }
    const monthsMap = groupedMap.get(year)!;
    if (!monthsMap.has(month)) {
      monthsMap.set(month, []);
    }
    monthsMap.get(month)!.push(item);
  }

  return [...groupedMap.entries()]
    .sort((left, right) => {
      if (left[0] === "Unknown") return 1;
      if (right[0] === "Unknown") return -1;
      return Number(right[0]) - Number(left[0]);
    })
    .map(([year, monthsMap]) => {
      const months = [...monthsMap.entries()]
        .sort((left, right) => {
          const monthOrder = [
            "JANUARY",
            "FEBRUARY",
            "MARCH",
            "APRIL",
            "MAY",
            "JUNE",
            "JULY",
            "AUGUST",
            "SEPTEMBER",
            "OCTOBER",
            "NOVEMBER",
            "DECEMBER",
            "UNKNOWN",
          ];
          return monthOrder.indexOf(left[0]) - monthOrder.indexOf(right[0]);
        })
        .map(([month, items]) => ({ month, items }));

      return { year, months };
    });
}

export default function TransactionsClient() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") === "all" ? "all" : "month";
  const [tab, setTab] = useState<"month" | "all">(initialTab);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<ReceiptStats>({
    totalSpentThisMonth: null,
    receiptsProcessedThisMonth: null,
  });
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteStatus, setBulkDeleteStatus] = useState<"idle" | "deleting" | "error" | "success">("idle");
  const [bulkDeleteMessage, setBulkDeleteMessage] = useState("");
  const [exportMessage, setExportMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setStatus("loading");
        const authToken = getAuthTokenFromCookie();
        const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;

        const [receiptsResponse, statsResponse] = await Promise.all([
          fetch("/api/receipts/me", {
            method: "GET",
            headers,
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/receipts/me/stats", {
            method: "GET",
            headers,
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const receiptsPayload = await receiptsResponse.json().catch(() => null);
        const statsPayload = await statsResponse.json().catch(() => null);

        if (!receiptsResponse.ok) {
          throw new Error("Failed to load transactions.");
        }

        if (!isMounted) {
          return;
        }

        setTransactions(normalizeTransactions(receiptsPayload));

        const statsObject = toObject(statsPayload);
        setStats({
          totalSpentThisMonth: toNumber(statsObject?.totalSpentThisMonth),
          receiptsProcessedThisMonth: toNumber(statsObject?.receiptsProcessedThisMonth),
        });
        setStatus("success");
      } catch {
        if (!isMounted) {
          return;
        }
        setTransactions([]);
        setStats({
          totalSpentThisMonth: null,
          receiptsProcessedThisMonth: null,
        });
        setStatus("error");
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayedTransactions = useMemo(() => {
    if (tab === "all") {
      return transactions;
    }
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    return transactions.filter((item) => {
      const parsedDate = parseReceiptDate(item.date);
      if (!parsedDate) {
        return false;
      }
      return parsedDate.getFullYear() === year && parsedDate.getMonth() === month;
    });
  }, [tab, transactions]);

  const grouped = useMemo(
    () => groupTransactionsByYearAndMonth(displayedTransactions),
    [displayedTransactions]
  );

  const totalSpent = useMemo(() => {
    if (tab === "month") {
      return formatAmount(stats.totalSpentThisMonth);
    }
    const sum = displayedTransactions.reduce((acc, item) => acc + (item.amount ?? 0), 0);
    return formatAmount(sum);
  }, [displayedTransactions, stats.totalSpentThisMonth, tab]);

  const totalCount =
    tab === "month"
      ? (stats.receiptsProcessedThisMonth ?? displayedTransactions.length)
      : displayedTransactions.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleDelete = () => {
    if (selectedIds.length === 0 || bulkDeleteStatus === "deleting") {
      return;
    }

    const parsedIds = selectedIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (parsedIds.length !== selectedIds.length) {
      setBulkDeleteStatus("error");
      setBulkDeleteMessage("Some selected receipts have invalid ids and cannot be deleted.");
      return;
    }

    const deleteReceipts = async () => {
      try {
        setBulkDeleteStatus("deleting");
        setBulkDeleteMessage("");

        const authToken = getAuthTokenFromCookie();
        const response = await fetch("/api/receipts", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({ ids: parsedIds }),
        });
        const payload = await response.json().catch(() => null);
        const payloadObject = toObject(payload);

        if (!response.ok || !payloadObject) {
          const message =
            typeof payloadObject?.message === "string"
              ? payloadObject.message
              : typeof payloadObject?.error === "string"
                ? payloadObject.error
                : "Failed to delete selected receipts.";
          throw new Error(message);
        }

        const deletedIdsRaw = Array.isArray(payloadObject.deletedIds) ? payloadObject.deletedIds : [];
        const deletedIds = deletedIdsRaw
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value));

        setTransactions((current) =>
          current.filter((item) => !deletedIds.includes(Number(item.id)))
        );
        setSelectedIds([]);
        setBulkDeleteStatus("success");
        setBulkDeleteMessage(
          typeof payloadObject.deletedCount === "number"
            ? `Deleted ${payloadObject.deletedCount} receipt(s).`
            : "Receipts deleted."
        );
      } catch (error) {
        setBulkDeleteStatus("error");
        setBulkDeleteMessage(
          error instanceof Error ? error.message : "Failed to delete selected receipts."
        );
      }
    };

    void deleteReceipts();
  };

  const handleExport = () => {
    if (selectedIds.length === 0) {
      return;
    }

    const exportRows = transactions.filter((item) => selectedIds.includes(item.id));
    const escapeCsvValue = (value: string | number | null) => {
      if (value === null) {
        return "";
      }
      const text = String(value);
      if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
        return `"${text.replace(/"/g, "\"\"")}"`;
      }
      return text;
    };

    const csv = [
      "id,merchant,amount,date",
      ...exportRows.map((item) =>
        [
          escapeCsvValue(item.id),
          escapeCsvValue(item.merchant),
          escapeCsvValue(item.amount),
          escapeCsvValue(item.date),
        ].join(",")
      ),
    ].join("\n");

    const today = new Date();
    const fileDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;
    const fileName = `transactions-${fileDate}.csv`;
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });

    const shareWithSystem = async () => {
      if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
        return false;
      }
      try {
        const file = new File([blob], fileName, { type: "text/csv;charset=utf-8;" });
        if (
          typeof navigator.canShare === "function" &&
          !navigator.canShare({ files: [file] })
        ) {
          return false;
        }
        await navigator.share({
          title: "Transactions CSV",
          files: [file],
        });
        return true;
      } catch {
        return false;
      }
    };

    const downloadFile = () => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const exportCsv = async () => {
      setExportMessage("");
      const shared = await shareWithSystem();
      if (shared) {
        setExportMessage("Exported successfully.");
        return;
      }
      downloadFile();
      setExportMessage("CSV download started.");
    };

    void exportCsv();
  };

  return (
    <div className={styles.page}>
      <div className={styles.phone}>
        <header className={styles.header}>
          <Link className={styles.back} href="/dashboard" aria-label="Back to dashboard">
            ←
          </Link>
          <h1>Transactions</h1>
        </header>

        <section className={styles.filters}>
          <button
            className={`${styles.filterButton} ${tab === "month" ? styles.filterButtonActive : ""}`}
            type="button"
            onClick={() => setTab("month")}
          >
            This Month
          </button>
          <button
            className={`${styles.filterButton} ${tab === "all" ? styles.filterButtonActive : ""}`}
            type="button"
            onClick={() => setTab("all")}
          >
            All
          </button>
        </section>

        <section className={styles.stats}>
          <article className={styles.statCard}>
            <p>Total Spent</p>
            <h2>{totalSpent}</h2>
          </article>
          <article className={styles.statCard}>
            <p>Receipts</p>
            <h2>{totalCount}</h2>
          </article>
        </section>

        {status === "loading" && <div className={styles.status}>Loading transactions...</div>}
        {status === "error" && (
          <div className={styles.status}>Failed to load transactions. Please refresh.</div>
        )}

        {status === "success" && grouped.length === 0 && (
          <div className={styles.status}>No transactions yet.</div>
        )}

        {status === "success" && grouped.length > 0 && (
          <section className={styles.listSection}>
            {grouped.map((yearGroup) => (
              <div key={yearGroup.year}>
                <h3 className={styles.yearTitle}>{yearGroup.year}</h3>
                {yearGroup.months.map((monthGroup) => (
                  <article className={styles.monthCard} key={`${yearGroup.year}-${monthGroup.month}`}>
                    <h4 className={styles.monthTitle}>{monthGroup.month}</h4>
                    <div className={styles.monthList}>
                      {monthGroup.items.map((item, index) => (
                        <div className={styles.transactionRow} key={item.id}>
                          <Link
                            className={styles.rowText}
                            href={`/receipts/${item.id}?from=transactions&tab=${tab}`}
                          >
                            <span className={styles.merchant}>{item.merchant}</span>
                            <span className={styles.meta}>
                              {formatAmount(item.amount)} · {getDateLabel(item.date)}
                            </span>
                          </Link>
                          <input
                            className={styles.checkbox}
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            aria-label={`Select ${item.merchant}`}
                          />
                          {index < monthGroup.items.length - 1 && <div className={styles.separator} />}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </section>
        )}

        <footer className={styles.actions}>
          <button
            className={styles.deleteButton}
            type="button"
            disabled={selectedIds.length === 0 || bulkDeleteStatus === "deleting"}
            onClick={handleDelete}
          >
            {bulkDeleteStatus === "deleting" ? "Deleting..." : "Delete"}
          </button>
          <button
            className={styles.exportButton}
            type="button"
            disabled={selectedIds.length === 0}
            onClick={handleExport}
          >
            Export
          </button>
        </footer>
        {bulkDeleteMessage && (
          <p
            className={`${styles.actionMessage} ${
              bulkDeleteStatus === "error" ? styles.actionMessageError : ""
            }`}
          >
            {bulkDeleteMessage}
          </p>
        )}
        {exportMessage && <p className={styles.actionMessage}>{exportMessage}</p>}
      </div>
    </div>
  );
}
