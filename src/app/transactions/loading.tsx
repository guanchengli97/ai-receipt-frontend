import styles from "./page.module.css";

export default function TransactionsLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.phone}>
        <div className={styles.status}>Loading transactions...</div>
      </div>
    </div>
  );
}

