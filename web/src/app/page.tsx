import Link from "next/link";
import styles from "./landing.module.css";

export const dynamic = "force-static";

export default function LandingPage() {
  return (
    <main className={styles.hero}>
      <div className={styles.backdrop} />
      <div className={styles.content}>
        <h1 className={styles.title}>
          A new way to see and choose your very own
          <span className={styles.highlight}> Loomis Chaffee </span>
          experience.
        </h1>
        <p className={styles.subtitle}>
          Explore the catalog, plan your classes, and get onboarded — all in one place.
        </p>
        <div className={styles.ctaRow}>
          <Link href="/login" className={styles.primaryCta}>Get Started →</Link>
          <Link href="/browser" className={styles.secondaryCta}>Browse Courses</Link>
        </div>
      </div>
    </main>
  );
}

