"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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

type EditableItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
};

type EditableReceipt = {
  merchantName: string;
  receiptDate: string;
  currency: string;
  subtotal: string;
  tax: string;
  total: string;
  items: EditableItem[];
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
  const trimmed = value.trim();
  if (!trimmed) {
    return "--";
  }
  const dateOnly = trimmed.split("T")[0];
  return dateOnly || trimmed;
}

function toDateInputValue(value: string) {
  if (!value) {
    return "";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed).toISOString().slice(0, 10);
}

function getAuthTokenFromCookie() {
  if (typeof document === "undefined") {
    return "";
  }
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function buildReceiptDetail(payloadObject: Record<string, unknown>): ReceiptDetail {
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

  return {
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
  };
}

function buildEditableReceipt(source: ReceiptDetail): EditableReceipt {
  return {
    merchantName: source.merchantName,
    receiptDate: toDateInputValue(source.receiptDate),
    currency: source.currency,
    subtotal: source.subtotal === null ? "" : String(source.subtotal),
    tax: source.tax === null ? "" : String(source.tax),
    total: source.total === null ? "" : String(source.total),
    items: source.items.map((item, index) => ({
      id: `${item.description}-${index}-${Date.now()}`,
      description: item.description,
      quantity: item.quantity === null ? "" : String(item.quantity),
      unitPrice: item.unitPrice === null ? "" : String(item.unitPrice),
      totalPrice: item.totalPrice === null ? "" : String(item.totalPrice),
    })),
  };
}

function toComparableNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isReceiptEdited(detail: ReceiptDetail, editDetail: EditableReceipt) {
  if (detail.merchantName !== editDetail.merchantName.trim()) {
    return true;
  }
  if (toDateInputValue(detail.receiptDate) !== editDetail.receiptDate) {
    return true;
  }
  if ((detail.currency || "") !== editDetail.currency.trim()) {
    return true;
  }
  if (detail.subtotal !== toComparableNumber(editDetail.subtotal)) {
    return true;
  }
  if (detail.tax !== toComparableNumber(editDetail.tax)) {
    return true;
  }
  if (detail.total !== toComparableNumber(editDetail.total)) {
    return true;
  }
  if (detail.items.length !== editDetail.items.length) {
    return true;
  }
  for (let index = 0; index < detail.items.length; index += 1) {
    const left = detail.items[index];
    const right = editDetail.items[index];
    if (!right) {
      return true;
    }
    if (left.description !== right.description.trim()) {
      return true;
    }
    if (left.quantity !== toComparableNumber(right.quantity)) {
      return true;
    }
    if (left.unitPrice !== toComparableNumber(right.unitPrice)) {
      return true;
    }
    if (left.totalPrice !== toComparableNumber(right.totalPrice)) {
      return true;
    }
  }
  return false;
}

export default function ReceiptDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const receiptId = params?.id;
  const from = searchParams?.get("from");
  const fromTab = searchParams?.get("tab");
  const backHref =
    from === "transactions"
      ? fromTab === "all" || fromTab === "month"
        ? `/transactions?tab=${fromTab}`
        : "/transactions"
      : "/dashboard";
  const [detail, setDetail] = useState<ReceiptDetail | null>(null);
  const [editDetail, setEditDetail] = useState<EditableReceipt | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [imageFailed, setImageFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentStatus, setAttachmentStatus] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");
  const [reviewStatus, setReviewStatus] = useState<"idle" | "saving" | "error">("idle");
  const [reviewMessage, setReviewMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

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

        const nextDetail = buildReceiptDetail(payloadObject);
        setDetail(nextDetail);
        setEditDetail(buildEditableReceipt(nextDetail));
        setImageFailed(false);
        setStatus("success");
        setReviewStatus("idle");
        setReviewMessage("");
        setSaveStatus("idle");
        setSaveMessage("");
        setIsEditing(false);
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

  const fetchPresignedUrl = async (imageId: number) => {
    const authToken = getAuthTokenFromCookie();
    const response = await fetch(`/api/images/${imageId}/presigned-url`, {
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

    return url;
  };

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
        const url = await fetchPresignedUrl(detail.imageId);

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

  const handleReviewToggle = async () => {
    if (!detail?.receiptId || reviewStatus === "saving") {
      return;
    }

    try {
      setReviewStatus("saving");
      setReviewMessage("");

      const authToken = getAuthTokenFromCookie();
      const response = await fetch(`/api/receipts/${detail.receiptId}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ reviewed: !detail.reviewed }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof toObject(payload)?.message === "string"
            ? String(toObject(payload)?.message)
            : "Failed to update review status.";
        throw new Error(message);
      }

      setDetail((current) =>
        current ? { ...current, reviewed: !current.reviewed } : current
      );
      setReviewStatus("idle");
      setReviewMessage("Review status updated.");
    } catch (error) {
      setReviewStatus("error");
      setReviewMessage(
        error instanceof Error ? error.message : "Failed to update review status."
      );
    }
  };

  const handleSaveReceipt = async () => {
    if (!detail?.receiptId || !editDetail || saveStatus === "saving") {
      return;
    }

    if (!isReceiptEdited(detail, editDetail)) {
      setSaveStatus("idle");
      setSaveMessage("No changes to save.");
      return;
    }

    try {
      setSaveStatus("saving");
      setSaveMessage("");

      const payload = {
        merchantName: editDetail.merchantName.trim(),
        receiptDate: editDetail.receiptDate,
        currency: editDetail.currency.trim(),
        subtotal: toNumber(editDetail.subtotal),
        tax: toNumber(editDetail.tax),
        total: toNumber(editDetail.total),
        items: editDetail.items.map((item) => ({
          description: item.description.trim() || "Item",
          quantity: toNumber(item.quantity),
          unitPrice: toNumber(item.unitPrice),
          totalPrice: toNumber(item.totalPrice),
        })),
      };

      const authToken = getAuthTokenFromCookie();
      const response = await fetch(`/api/receipts/${detail.receiptId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      const dataObject = toObject(data);

      if (!response.ok) {
        const message =
          typeof dataObject?.error === "string"
            ? dataObject.error
            : typeof dataObject?.message === "string"
              ? dataObject.message
              : "Failed to update receipt.";
        throw new Error(message);
      }

      if (!dataObject) {
        throw new Error("Failed to update receipt.");
      }

      const nextDetail = buildReceiptDetail(dataObject);
      setDetail(nextDetail);
      setEditDetail(buildEditableReceipt(nextDetail));
      setSaveStatus("success");
      setSaveMessage("Receipt updated.");
      setIsEditing(false);
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(error instanceof Error ? error.message : "Failed to update receipt.");
    }
  };

  const handleStartEdit = () => {
    if (!detail) {
      return;
    }
    setEditDetail(buildEditableReceipt(detail));
    setSaveStatus("idle");
    setSaveMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!detail) {
      setIsEditing(false);
      return;
    }
    setEditDetail(buildEditableReceipt(detail));
    setSaveStatus("idle");
    setSaveMessage("");
    setIsEditing(false);
  };

  const handleItemChange = (
    index: number,
    field: keyof EditableItem,
    value: string
  ) => {
    setEditDetail((current) => {
      if (!current) {
        return current;
      }
      const nextItems = [...current.items];
      nextItems[index] = { ...nextItems[index], [field]: value };
      return { ...current, items: nextItems };
    });
  };

  const handleItemAdd = () => {
    setEditDetail((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        items: [
          ...current.items,
          {
            id: `item-${Date.now()}`,
            description: "",
            quantity: "",
            unitPrice: "",
            totalPrice: "",
          },
        ],
      };
    });
  };

  const handleItemRemove = (index: number) => {
    setEditDetail((current) => {
      if (!current) {
        return current;
      }
      const nextItems = current.items.filter((_, itemIndex) => itemIndex !== index);
      return { ...current, items: nextItems };
    });
  };

  const handleOpenPreview = async () => {
    if (!detail) {
      return;
    }

    if (!detail.imageId) {
      setPreviewOpen(Boolean(attachmentUrl));
      return;
    }

    try {
      setAttachmentStatus("loading");
      const url = await fetchPresignedUrl(detail.imageId);
      setAttachmentUrl(url);
      setImageFailed(false);
      setAttachmentStatus("success");
      setPreviewOpen(true);
    } catch {
      setAttachmentStatus("error");
      setPreviewOpen(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.phone}>
        <header className={styles.header}>
          <Link className={styles.back} href={backHref} aria-label="Back">
            ←
          </Link>
          <div className={styles.headerMain}>
            <div className={styles.headerTitle}>{detail?.merchantName || "Receipt"}</div>
            <div className={styles.headerDate}>
              {detail ? formatDate(detail.receiptDate) : ""}
            </div>
          </div>
          {isEditing ? (
            <button className={styles.editButton} type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          ) : (
            <button
              className={styles.editButton}
              type="button"
              onClick={handleStartEdit}
              disabled={status !== "success" || !detail}
            >
              Edit
            </button>
          )}
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
                {isEditing ? (
                  <input
                    className={styles.detailInput}
                    type="text"
                    value={editDetail?.merchantName ?? ""}
                    onChange={(event) =>
                      setEditDetail((current) =>
                        current ? { ...current, merchantName: event.target.value } : current
                      )
                    }
                  />
                ) : (
                  <span>{detail.merchantName || "--"}</span>
                )}
              </div>
              <div className={styles.detailRow}>
                <span>Receipt Date</span>
                {isEditing ? (
                  <input
                    className={styles.detailInput}
                    type="date"
                    value={editDetail?.receiptDate ?? ""}
                    onChange={(event) =>
                      setEditDetail((current) =>
                        current ? { ...current, receiptDate: event.target.value } : current
                      )
                    }
                  />
                ) : (
                  <span>{formatDate(detail.receiptDate)}</span>
                )}
              </div>
              <div className={styles.detailRow}>
                <span>Currency</span>
                {isEditing ? (
                  <select
                    className={styles.detailInput}
                    value={editDetail?.currency ?? "USD"}
                    onChange={(event) =>
                      setEditDetail((current) =>
                        current ? { ...current, currency: event.target.value } : current
                      )
                    }
                  >
                    <option value="USD">USD</option>
                  </select>
                ) : (
                  <span>{detail.currency || "--"}</span>
                )}
              </div>
              <div className={styles.detailRow}>
                <span>Subtotal</span>
                {isEditing ? (
                  <input
                    className={styles.detailInput}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={editDetail?.subtotal ?? ""}
                    onChange={(event) =>
                      setEditDetail((current) =>
                        current ? { ...current, subtotal: event.target.value } : current
                      )
                    }
                  />
                ) : (
                  <span>{totals.subtotal}</span>
                )}
              </div>
              <div className={styles.detailRow}>
                <span>Tax</span>
                {isEditing ? (
                  <input
                    className={styles.detailInput}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={editDetail?.tax ?? ""}
                    onChange={(event) =>
                      setEditDetail((current) =>
                        current ? { ...current, tax: event.target.value } : current
                      )
                    }
                  />
                ) : (
                  <span>{totals.tax}</span>
                )}
              </div>
              <div className={styles.detailRow}>
                <span>Total</span>
                {isEditing ? (
                  <input
                    className={styles.detailInput}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={editDetail?.total ?? ""}
                    onChange={(event) =>
                      setEditDetail((current) =>
                        current ? { ...current, total: event.target.value } : current
                      )
                    }
                  />
                ) : (
                  <span>{totals.total}</span>
                )}
              </div>
              <div className={styles.detailRow}>
                <span>Status</span>
                <span>{detail.reviewed ? "Reviewed" : "Unreviewed"}</span>
              </div>
            </section>

            <section className={styles.card}>
              <h3>Items</h3>
              {editDetail && editDetail.items.length === 0 && (
                <div className={styles.empty}>No items yet.</div>
              )}
              {editDetail?.items.map((item, index) => (
                <div className={styles.itemEditor} key={item.id}>
                  <div className={isEditing ? styles.itemGrid : styles.itemViewGrid}>
                    {isEditing ? (
                      <>
                        <label className={styles.itemField}>
                          <span>Description</span>
                          <input
                            className={styles.itemInput}
                            type="text"
                            placeholder="Description"
                            value={item.description}
                            onChange={(event) =>
                              handleItemChange(index, "description", event.target.value)
                            }
                          />
                        </label>
                        <label className={styles.itemField}>
                          <span>Qty</span>
                          <input
                            className={styles.itemInput}
                            type="number"
                            inputMode="decimal"
                            step="1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(event) =>
                              handleItemChange(index, "quantity", event.target.value)
                            }
                          />
                        </label>
                        <label className={styles.itemField}>
                          <span>Unit</span>
                          <input
                            className={styles.itemInput}
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            placeholder="Unit"
                            value={item.unitPrice}
                            onChange={(event) =>
                              handleItemChange(index, "unitPrice", event.target.value)
                            }
                          />
                        </label>
                        <label className={styles.itemField}>
                          <span>Total</span>
                          <input
                            className={styles.itemInput}
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            placeholder="Total"
                            value={item.totalPrice}
                            onChange={(event) =>
                              handleItemChange(index, "totalPrice", event.target.value)
                            }
                          />
                        </label>
                      </>
                    ) : (
                      <>
                        <div className={styles.itemViewCell}>
                          <span>Description</span>
                          <strong>{item.description || "--"}</strong>
                        </div>
                        <div className={styles.itemViewCell}>
                          <span>Qty</span>
                          <strong>{item.quantity || "--"}</strong>
                        </div>
                        <div className={styles.itemViewCell}>
                          <span>Unit</span>
                          <strong>{item.unitPrice || "--"}</strong>
                        </div>
                        <div className={styles.itemViewCell}>
                          <span>Total</span>
                          <strong>{item.totalPrice || "--"}</strong>
                        </div>
                      </>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      className={styles.itemRemove}
                      type="button"
                      onClick={() => handleItemRemove(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {isEditing && (
                <button className={styles.itemAdd} type="button" onClick={handleItemAdd}>
                  Add Item
                </button>
              )}
            </section>

            {isEditing && (
              <button
                className={styles.saveButton}
                type="button"
                onClick={handleSaveReceipt}
                disabled={saveStatus === "saving" || !editDetail}
              >
                {saveStatus === "saving" ? "Saving..." : "Save Changes"}
              </button>
            )}
            {saveMessage && (
              <p className={styles.saveMessage}>{saveMessage}</p>
            )}

            <button
              className={styles.reviewButton}
              type="button"
              onClick={handleReviewToggle}
              disabled={reviewStatus === "saving"}
            >
              {detail.reviewed ? "Mark as Unreviewed" : "Mark as Reviewed"}
            </button>
            {reviewMessage && (
              <p className={styles.reviewMessage}>{reviewMessage}</p>
            )}

            <section className={styles.card}>
              <h3>Attachment</h3>
              {attachmentUrl ? (
                <div className={styles.attachment}>
                  <button
                    className={styles.thumbnailButton}
                    type="button"
                    onClick={handleOpenPreview}
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

