import Link from "next/link";
import styles from "../legal.module.css";

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <article className={styles.card}>
        <div className={styles.top}>
          <div>
            <h1 className={styles.title}>Privacy Policy</h1>
            <p className={styles.updated}>Last updated: February 12, 2026</p>
          </div>
          <Link href="/register" className={styles.back}>
            Back to Sign Up
          </Link>
        </div>

        <div className={styles.content}>
          <section>
            <h2 className={styles.sectionTitle}>Information We Collect</h2>
            <ul className={styles.list}>
              <li>Account information such as name, email, and authentication details.</li>
              <li>Receipt metadata and images you upload to use product features.</li>
              <li>Basic technical data for security, diagnostics, and performance.</li>
            </ul>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>How We Use Information</h2>
            <p className={styles.paragraph}>
              We use your data to provide receipt processing features, maintain account access,
              improve product quality, and secure the platform.
            </p>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Data Sharing</h2>
            <p className={styles.paragraph}>
              We do not sell personal information. Data may be shared with trusted service providers
              only as needed to operate the service.
            </p>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Data Retention</h2>
            <p className={styles.paragraph}>
              We retain data for as long as needed to provide the service and comply with legal
              obligations, then delete or anonymize it when no longer required.
            </p>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Your Choices</h2>
            <p className={styles.paragraph}>
              You can request updates or deletion of your personal information according to
              applicable laws and product capabilities.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
