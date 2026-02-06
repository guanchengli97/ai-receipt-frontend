"use client";

import Link from "next/link";
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
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(parsed));
}

function getMonthLabel(value: string | null) {
  if (!value) {
    return "Unknown";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(parsed)).toUpperCase();
}

type GroupedTransactions = {
  year: string;
  months: { month: string; items: Transaction[] }[];
}[];

function groupTransactionsByYearAndMonth(transactions: Transaction[]): GroupedTransactions {
  const groupedMap = new Map<string, Map<string, Transaction[]>>();

  for (const item of transactions) {
    const parsed = item.date ? Date.parse(item.date) : Number.NaN;
    const year = Number.isNaN(parsed) ? "Unknown" : String(new Date(parsed).getFullYear());
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
  const [tab, setTab] = useState<"month" | "all">("month");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<ReceiptStats>({
    totalSpentThisMonth: null,
    receiptsProcessedThisMonth: null,
  });
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
      const parsed = item.date ? Date.parse(item.date) : Number.NaN;
      if (Number.isNaN(parsed)) {
        return false;
      }
      const itemDate = new Date(parsed);
      return itemDate.getFullYear() === year && itemDate.getMonth() === month;
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
    if (selectedIds.length === 0) {
      return;
    }
    setTransactions((current) => current.filter((item) => !selectedIds.includes(item.id)));
    setSelectedIds([]);
  };

  const handleExport = () => {
    if (selectedIds.length === 0) {
      return;
    }

    const exportRows = transactions.filter((item) => selectedIds.includes(item.id));
    const csv = [
      "id,merchant,amount,date",
      ...exportRows.map((item) =>
        [
          item.id,
          `"${item.merchant.replace(/"/g, '""')}"`,
          item.amount ?? "",
          item.date ?? "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "transactions.csv";
    anchor.click();
    URL.revokeObjectURL(url);
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
                            href={`/receipts/${item.id}?from=transactions`}
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
            disabled={selectedIds.length === 0}
            onClick={handleDelete}
          >
            Delete
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
      </div>
    </div>
  );
}
