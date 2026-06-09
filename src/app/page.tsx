import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

const navItems = ["Upload", "Review", "Export", "Account"];

const receiptFields = [
  ["Merchant", "Paris Baguette"],
  ["Total", "$14.25"],
  ["Category", "Meals"],
  ["Status", "Ready to review"],
];

const featureTiles = [
  {
    title: "Upload a receipt.",
    copy: "Take a photo or choose an image from the dashboard, then upload it for parsing.",
  },
  {
    title: "AI reads the details.",
    copy: "Merchant, amount, date, category, tax, currency, and the receipt image stay together.",
  },
  {
    title: "Review and export.",
    copy: "Edit receipt details, mark receipts reviewed, delete mistakes, and export selected rows to CSV.",
  },
];

const stats = [
  ["3/day", "Starter quota"],
  ["10/day", "Paid quota"],
  ["CSV", "Transaction export"],
  ["AI", "Receipt parsing"],
];

const reviewSteps = [
  "Upload a receipt image from the dashboard.",
  "AI parses the receipt and adds it to your recent receipts.",
  "Open the receipt to review, edit, mark reviewed, or delete it.",
];

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.globalNav}>
        <Link href="/" className={styles.globalBrand} aria-label="AI Receipts home">
          AI Receipts
        </Link>
        <nav className={styles.globalLinks} aria-label="Main navigation">
          {navItems.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}>
              {item}
            </a>
          ))}
        </nav>
        <div className={styles.globalActions}>
          <Link href="/login">Log In</Link>
          <Link href="/register">Sign Up</Link>
        </div>
      </header>

      <nav className={styles.subNav} aria-label="AI Receipts actions">
        <Link href="/" className={styles.subNavTitle}>
          AI Receipts
        </Link>
        <div className={styles.subNavLinks}>
          <a href="#upload">Overview</a>
          <a href="#review">Review</a>
          <a href="#export">Export</a>
          <Link href="/register" className={styles.buyButton}>
            Start
          </Link>
        </div>
      </nav>

      <section id="upload" className={`${styles.productTile} ${styles.tileLight}`}>
        <div className={styles.tileCopy}>
          <p className={styles.kicker}>AI receipt management</p>
          <h1>Upload receipts. Let AI read the details.</h1>
          <p>
            AI Receipts helps you upload receipt images, extract key fields,
            review the result, and keep a searchable receipt record.
          </p>
          <div className={styles.actions}>
            <Link href="/register" className={styles.primaryButton}>
              Create Account
            </Link>
            <Link href="/login" className={styles.secondaryButton}>
              Sign In
            </Link>
          </div>
          <div className={styles.ratingLine}>
            <strong>Built for receipt tracking</strong>
            <span>Upload, parse, review, and export your receipt data.</span>
          </div>
        </div>

        <div className={styles.productRender} aria-label="Receipt extraction preview">
          <Image
            src="/receipt-sms-hero.png"
            alt="Receipt upload preview beside a paper receipt"
            width={1536}
            height={1024}
            className={styles.heroPhoto}
            priority
          />
          <div className={styles.smsBubble}>
            <span>Upload</span>
            <p>Receipt image selected. Ready to parse.</p>
          </div>
          <div className={styles.extractionPanel}>
            <p>AI extracted fields</p>
            <dl>
              {receiptFields.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className={styles.statsBand} aria-label="AI Receipts features">
        {stats.map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section id="review" className={`${styles.productTile} ${styles.tileDark}`}>
        <div className={styles.tileCopy}>
          <p className={styles.kicker}>Receipt review</p>
          <h2>Check every parsed receipt before you move on.</h2>
          <p>
            Open a receipt to confirm the merchant, date, amount, category,
            currency, and tax. Update fields when needed and mark reviewed when
            it looks right.
          </p>
          <div className={styles.actions}>
            <Link href="/register" className={styles.primaryButton}>
              Start Reviewing
            </Link>
            <a href="#export" className={styles.darkTextLink}>
              See export workflow
            </a>
          </div>
        </div>

        <div className={styles.syncVisual}>
          <Image
            src="/receipt-sync-dashboard.png"
            alt="Parsed receipt data shown in a review dashboard"
            width={1536}
            height={1024}
            className={styles.syncPhoto}
          />
          <div className={styles.reviewSurface}>
            <div className={styles.reviewColumn}>
              <span>Receipt detail</span>
              <strong>Edit fields</strong>
              <p>Adjust merchant, date, category, amount, tax, and currency from the receipt page.</p>
            </div>
            <div className={styles.reviewColumn}>
              <span>Review status</span>
              <strong>Mark reviewed</strong>
              <p>Keep parsed receipts separate from the ones you have already checked.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="export" className={`${styles.productTile} ${styles.tileParchment}`}>
        <div className={styles.tileCopy}>
          <p className={styles.kicker}>Transactions and CSV</p>
          <h2>Turn parsed receipts into a usable transaction list.</h2>
          <p>
            Browse receipts by transaction, select the rows you need, and export
            them as a CSV file for your own records.
          </p>
          <ol className={styles.stepList}>
            {reviewSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <div className={styles.utilityGrid}>
          {featureTiles.map((feature) => (
            <article key={feature.title} className={styles.utilityCard}>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
              <Link href="/register">Learn more</Link>
            </article>
          ))}
        </div>
      </section>

    </main>
  );
}
