"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import styles from "./page.module.css";

type ReceiptItem = {
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
};

type ReceiptDetail = {
  receiptId: number | null;
  merchantName: string;
  receiptDate: string;
  currency: string;
  imageId: number | null;
  imageUrl: string;
  reviewed: boolean | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  items: ReceiptItem[];
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
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function formatCurrency(amount: number | null, currencySymbol: string) {
  if (amount === null) {
    return "--";
  }
  if (currencySymbol) {
    return `${currencySymbol}${amount.toFixed(2)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
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

export default function ReceiptDetailPage() {
  const params = useParams<{ id: string }>();
  const receiptId = params?.id;
  const [detail, setDetail] = useState<ReceiptDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [imageFailed, setImageFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentStatus, setAttachmentStatus] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");

  useEffect(() => {
    let isMounted = true;

    const fetchReceipt = async () => {
      try {
        if (!receiptId) {
          throw new Error("Missing receipt id.");
        }
        const authToken = getAuthTokenFromCookie();
        const response = await fetch(`/api/receipts/${receiptId}`, {
          method: "GET",
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        const payloadObject = toObject(payload);

        if (!response.ok || !payloadObject) {
          throw new Error("Failed to load receipt.");
        }

        if (!isMounted) {
          return;
        }

        const itemsRaw = Array.isArray(payloadObject.items) ? payloadObject.items : [];
        const items = itemsRaw
          .map((item) => {
            const itemObject = toObject(item);
            if (!itemObject) {
              return null;
            }
            return {
              description: toString(itemObject.description) || "Item",
              quantity: toNumber(itemObject.quantity),
              unitPrice: toNumber(itemObject.unitPrice),
              totalPrice: toNumber(itemObject.totalPrice),
            };
          })
          .filter((item): item is ReceiptItem => item !== null);

        const imageObject = toObject(payloadObject.image);
        const imageId = toNumber(
          payloadObject.imageId ??
            payloadObject.image_id ??
            imageObject?.id ??
            imageObject?.imageId
        );

        setDetail({
          receiptId: toNumber(payloadObject.receiptId),
          merchantName: toString(payloadObject.merchantName) || "Unknown Merchant",
          receiptDate: toString(payloadObject.receiptDate),
          currency: toString(payloadObject.currency),
          imageId,
          imageUrl: toString(payloadObject.imageUrl),
          reviewed: toBoolean(payloadObject.reviewed),
          subtotal: toNumber(payloadObject.subtotal),
          tax: toNumber(payloadObject.tax),
          total: toNumber(payloadObject.total),
          items,
        });
        setImageFailed(false);
        setStatus("success");
      } catch {
        if (!isMounted) {
          return;
        }
        setStatus("error");
      }
    };

    void fetchReceipt();

    return () => {
      isMounted = false;
    };
  }, [receiptId]);

  useEffect(() => {
    let isMounted = true;

    const fetchAttachment = async () => {
      if (!detail) {
        setAttachmentUrl("");
        setAttachmentStatus("idle");
        return;
      }

      const rawUrl = detail.imageUrl;
      if (rawUrl && (rawUrl.startsWith("http://") || rawUrl.startsWith("https://"))) {
        setAttachmentUrl(rawUrl);
        setAttachmentStatus("success");
        return;
      }

      if (!detail.imageId) {
        setAttachmentUrl("");
        setAttachmentStatus("idle");
        return;
      }

      try {
        setAttachmentStatus("loading");
        const authToken = getAuthTokenFromCookie();
        const response = await fetch(`/api/images/${detail.imageId}/presigned-url`, {
          method: "GET",
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        const payloadObject = toObject(payload);
        const url = payloadObject && typeof payloadObject.url === "string" ? payloadObject.url : "";

        if (!response.ok || !url) {
          throw new Error("Failed to load attachment.");
        }

        if (!isMounted) {
          return;
        }

        setAttachmentUrl(url);
        setImageFailed(false);
        setAttachmentStatus("success");
      } catch {
        if (!isMounted) {
          return;
        }
        setAttachmentUrl("");
        setAttachmentStatus("error");
      }
    };

    void fetchAttachment();

    return () => {
      isMounted = false;
    };
  }, [detail?.imageId, detail?.imageUrl]);

  const totals = useMemo(() => {
    if (!detail) {
      return null;
    }
    return {
      subtotal: formatCurrency(detail.subtotal, detail.currency),
      tax: formatCurrency(detail.tax, detail.currency),
      total: formatCurrency(detail.total, detail.currency),
    };
  }, [detail]);

  return (
    <div className={styles.page}>
      <div className={styles.phone}>
        <header className={styles.header}>
          <Link className={styles.back} href="/dashboard" aria-label="Back to dashboard">
            ←
          </Link>
          <div className={styles.headerTitle}>
            {detail?.merchantName || "Receipt"}
          </div>
          <div className={styles.headerDate}>
            {detail ? formatDate(detail.receiptDate) : ""}
          </div>
        </header>

        {status === "loading" && <div className={styles.status}>Loading receipt...</div>}
        {status === "error" && (
          <div className={styles.status}>Failed to load receipt. Please try again.</div>
        )}

        {status === "success" && detail && totals && (
          <>
            <section className={styles.summaryCard}>
              <div>
                <p className={styles.summaryLabel}>Total</p>
                <p className={styles.summaryValue}>{totals.total}</p>
                <p className={styles.summaryMeta}>
                  {detail.reviewed === null
                    ? "Review status unknown"
                    : detail.reviewed
                      ? "Reviewed"
                      : "Unreviewed"}
                </p>
              </div>
              <div className={styles.summaryIcon}>🧾</div>
            </section>

            <section className={styles.card}>
              <h3>Receipt Details</h3>
              <div className={styles.detailRow}>
                <span>Merchant</span>
                <span>{detail.merchantName}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Receipt Date</span>
                <span>{formatDate(detail.receiptDate)}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Currency</span>
                <span>{detail.currency || "--"}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Status</span>
                <span>{detail.reviewed ? "Reviewed" : "Unreviewed"}</span>
              </div>
            </section>

            <section className={styles.card}>
              <h3>Items</h3>
              {detail.items.length === 0 && (
                <div className={styles.empty}>No items yet.</div>
              )}
              {detail.items.map((item, index) => (
                <div className={styles.itemRow} key={`${item.description}-${index}`}>
                  <span>{item.description}</span>
                  <span>
                    {item.totalPrice !== null
                      ? formatCurrency(item.totalPrice, detail.currency)
                      : formatCurrency(
                          (item.unitPrice ?? 0) * (item.quantity ?? 0),
                          detail.currency
                        )}
                  </span>
                </div>
              ))}
              <div className={styles.itemTotal}>
                <span>Total</span>
                <span>{totals.total}</span>
              </div>
            </section>

            <section className={styles.card}>
              <h3>Attachment</h3>
              {attachmentUrl ? (
                <div className={styles.attachment}>
                  <button
                    className={styles.thumbnailButton}
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    aria-label="Preview receipt image"
                  >
                    <div className={styles.thumbnail}>
                      {!imageFailed ? (
                        <Image
                          src={attachmentUrl}
                          alt="Receipt"
                          fill
                          sizes="72px"
                          onError={() => setImageFailed(true)}
                        />
                      ) : (
                        <div className={styles.placeholder}>🧾</div>
                      )}
                    </div>
                  </button>
                  <div>
                    <p className={styles.attachmentTitle}>Receipt</p>
                    <p className={styles.attachmentMeta}>{totals.total}</p>
                  </div>
                </div>
              ) : attachmentStatus === "loading" ? (
                <div className={styles.empty}>Loading attachment...</div>
              ) : attachmentStatus === "error" ? (
                <div className={styles.empty}>Failed to load attachment.</div>
              ) : (
                <div className={styles.empty}>No attachment.</div>
              )}
            </section>

            {previewOpen && (
              <>
                <button
                  className={styles.previewBackdrop}
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  aria-label="Close receipt preview"
                />
                <dialog className={styles.previewDialog} open>
                  <div className={styles.previewHeader}>
                    <span>Receipt Attachment</span>
                    <button
                      className={styles.previewClose}
                      type="button"
                      onClick={() => setPreviewOpen(false)}
                      aria-label="Close receipt preview"
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles.previewBody}>
                    {!imageFailed ? (
                      <Image
                        src={attachmentUrl}
                        alt="Receipt preview"
                        fill
                        sizes="(max-width: 768px) 92vw, 560px"
                        onError={() => setImageFailed(true)}
                      />
                    ) : (
                      <div className={styles.previewPlaceholder}>🧾</div>
                    )}
                  </div>
                </dialog>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

