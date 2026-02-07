import styles from "./page.module.css";

export default function DashboardLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.phone}>
        <div className={styles.uploadStatus}>Loading dashboard...</div>
      </div>
    </div>
  );
}

