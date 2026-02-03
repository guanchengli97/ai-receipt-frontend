"use client";

import Link from "next/link";
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

export default function DashboardClient() {
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
            <div className={styles.listItem}>
              <div className={styles.thumb}>S</div>
              <div className={styles.meta}>
                <h4>Starbucks</h4>
                <p>$12.46 · Oct 3</p>
              </div>
              <span className={styles.statusTag}>Processing</span>
            </div>
            <div className={styles.listItem}>
              <div className={styles.thumb}>A</div>
              <div className={styles.meta}>
                <h4>Amazon</h4>
                <p>$1.56 · Apr 13</p>
              </div>
              <span className={styles.statusTag}>Needs Review</span>
            </div>
          </div>
        </section>

        <nav className={styles.bottomNav}>
          <div className={styles.navItem}>
            <IconReceipt />
            Dashboard
          </div>
          <div className={styles.navItem}>
            <div className={styles.fab}>
              <IconCamera />
            </div>
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
