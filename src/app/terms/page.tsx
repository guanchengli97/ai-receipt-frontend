import Link from "next/link";
import styles from "../legal.module.css";

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <article className={styles.card}>
        <div className={styles.top}>
          <div>
            <h1 className={styles.title}>Terms of Service</h1>
            <p className={styles.updated}>Last updated: February 12, 2026</p>
          </div>
          <Link href="/register" className={styles.back}>
            Back to Sign Up
          </Link>
        </div>

        <div className={styles.content}>
          <section>
            <h2 className={styles.sectionTitle}>Acceptance of Terms</h2>
            <p className={styles.paragraph}>
              By using AI Receipts, you agree to these Terms of Service. If you do not agree,
              please do not use the service.
            </p>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Account Responsibilities</h2>
            <ul className={styles.list}>
              <li>You are responsible for keeping your account credentials secure.</li>
              <li>You must provide accurate and current registration information.</li>
              <li>You are responsible for activity performed through your account.</li>
            </ul>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Acceptable Use</h2>
            <p className={styles.paragraph}>
              You agree not to misuse the platform, attempt unauthorized access, or use the
              service for illegal activities.
            </p>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Service Availability</h2>
            <p className={styles.paragraph}>
              We may update, suspend, or discontinue parts of the service at any time for
              maintenance, security, or product improvements.
            </p>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Contact</h2>
            <p className={styles.paragraph}>
              If you have questions about these terms, please contact the support team through the
              channels provided in the application.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
