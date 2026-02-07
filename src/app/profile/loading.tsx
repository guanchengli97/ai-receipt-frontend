import styles from "./page.module.css";

export default function ProfileLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.phone}>
        <div className={styles.status}>Loading profile...</div>
      </div>
    </div>
  );
}

