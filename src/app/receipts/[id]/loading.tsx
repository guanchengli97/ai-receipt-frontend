import styles from "./page.module.css";

export default function ReceiptDetailLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.phone}>
        <div className={styles.status}>Loading receipt...</div>
      </div>
    </div>
  );
}

