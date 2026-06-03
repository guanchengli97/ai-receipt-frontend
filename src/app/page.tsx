import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

const features = [
  {
    title: "Smart extraction",
    description: "AI reads merchant, amount, tax, and date with less manual cleanup.",
  },
  {
    title: "Clean review flow",
    description: "Move from upload to verified receipt in a calm, focused workflow.",
  },
  {
    title: "Searchable history",
    description: "Find any receipt by merchant, date, category, or amount in seconds.",
  },
];

const highlights = [
  { label: "Receipts processed", value: "12.4k" },
  { label: "Manual work reduced", value: "-78%" },
  { label: "AI match accuracy", value: "98.6%" },
];

const timeline = [
  "Upload from phone or desktop",
  "Auto-extract key fields with AI",
  "Review and approve in one place",
];

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>AI</span>
            <span className={styles.brandText}>Receipts</span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/login" className={styles.navLink}>
              Log In
            </Link>
            <Link href="/register" className={styles.navButton}>
              Sign Up
            </Link>
          </nav>
        </header>

        <section className={styles.hero}>
          <div className={styles.copy}>
            <span className={styles.eyebrow}>AI receipt workspace</span>
            <h1 className={styles.title}>
              Receipt capture that feels clear, fast, and already organized.
            </h1>
            <p className={styles.subtitle}>
              Upload receipts, let AI structure the data, and review everything
              from one focused workspace built for speed and control.
            </p>

            <div className={styles.actions}>
              <Link href="/register" className={styles.primaryButton}>
                Create Account
              </Link>
              <Link href="/login" className={styles.secondaryButton}>
                Log In
              </Link>
            </div>

            <div className={styles.miniProof}>
              <span className={styles.proofBadge}>Fast onboarding</span>
              <span className={styles.proofText}>
                Start with email signup and move straight into upload and review.
              </span>
            </div>

            <div className={styles.metrics}>
              {highlights.map((item) => (
                <div key={item.label} className={styles.metricCard}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.visualPanel}>
            <div className={styles.visualCard}>
              <div className={styles.visualTop}>
                <div>
                  <p className={styles.visualLabel}>This week</p>
                  <h2 className={styles.visualTitle}>Receipt flow</h2>
                </div>
                <span className={styles.visualBadge}>Live AI</span>
              </div>

              <div className={styles.chartCard}>
                <div className={styles.chartBars} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className={styles.chartMeta}>
                  <strong>$4,280</strong>
                  <span>Processed across travel, meals, software, and office spend</span>
                </div>
              </div>

              <div className={styles.receiptList}>
                <div className={styles.receiptItem}>
                  <div className={styles.receiptIcon}>TR</div>
                  <div>
                    <strong>Travel Receipt</strong>
                    <span>Merchant, date, and amount confirmed</span>
                  </div>
                  <em>Done</em>
                </div>

                <div className={styles.receiptItem}>
                  <div className={styles.receiptIcon}>ML</div>
                  <div>
                    <strong>Meal Receipt</strong>
                    <span>Tax extracted and ready for approval</span>
                  </div>
                  <em>Ready</em>
                </div>
              </div>
            </div>

            <div className={styles.stackRow}>
              <div className={styles.processCard}>
                <p className={styles.processLabel}>Workflow</p>
                <ul className={styles.timeline}>
                  {timeline.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.illustrationCard}>
                <div className={styles.illustrationGlow} />
                <Image
                  src="/hero-illustration.svg"
                  alt="AI Receipts product illustration"
                  width={360}
                  height={240}
                  className={styles.illustration}
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.storySection}>
          <div className={styles.storyCard}>
            <span className={styles.storyKicker}>Why it works</span>
            <h3>Built for a cleaner receipt experience, not spreadsheet fatigue.</h3>
            <p>
              The UI stays light and calm while the system handles extraction,
              categorization, and review prep in the background.
            </p>
          </div>

          <div className={styles.featureGrid}>
            {features.map((feature) => (
              <article key={feature.title} className={styles.featureCard}>
                <span className={styles.featureDot} />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
