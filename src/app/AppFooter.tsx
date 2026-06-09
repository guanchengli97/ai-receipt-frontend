"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const footerSections = [
  {
    title: "Product",
    links: [
      ["Dashboard", "/dashboard"],
      ["Transactions", "/transactions"],
      ["Subscription", "/subscription"],
    ],
  },
  {
    title: "Account",
    links: [
      ["Profile", "/profile"],
      ["Log In", "/login"],
      ["Sign Up", "/register"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ],
  },
];

export default function AppFooter() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const isAuthenticatedPage =
    pathname === "/dashboard" ||
    pathname === "/profile" ||
    pathname === "/subscription" ||
    pathname === "/transactions" ||
    pathname.startsWith("/receipts/");

  return (
    <footer className="appFooter" aria-label="Footer">
      <div className="appFooterInner">
        <div className="appFooterBrand">
          <Link href="/" className="appFooterLogo">
            AI Receipts
          </Link>
          <p>
            Upload receipt images, extract receipt data with AI, review saved
            details, and export selected transactions when you need a CSV.
          </p>
          {!isAuthenticatedPage && (
            <Link href="/register" className="appFooterCta">
              Get Started
            </Link>
          )}
        </div>

        <nav className="appFooterNav" aria-label="Footer navigation">
          {footerSections.map((section) => (
            <div key={section.title} className="appFooterColumn">
              <h2>{section.title}</h2>
              <ul>
                {section.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="appFooterBottom">
          <span>Copyright © {currentYear} AI Receipts. All rights reserved.</span>
          <span>Receipt upload, AI parsing, review, and CSV export.</span>
        </div>
      </div>
    </footer>
  );
}
