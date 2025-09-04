"use client";

import { useEffect, useMemo, useState } from "react";
import topbar from "../browser/page.module.css";   // reuse the course browser top bar
import styles from "./wizard.module.css";   // wizard-only styles

type LangIntent = "placed" | "planning";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : null;
}

export default function OnboardingPage({
  showIntroDefault,
}: {
  showIntroDefault: boolean;
}) {
  // ----- Intro (cookie-driven; no flicker) -----
  const [showIntro, setShowIntro] = useState(showIntroDefault);

  // ----- Wizard hooks: declared unconditionally to preserve hook order -----
  const steps = useMemo(
    () => [
      { key: "grade", label: "Select Grade" },
      { key: "math", label: "Math Placement" },
      { key: "language", label: "Language" },
      { key: "review", label: "Review" },
    ],
    []
  );

  const [step, setStep] = useState(0);
  const [grade, setGrade] = useState("");
  const [mathCourse, setMathCourse] = useState("");
  const [languageName, setLanguageName] = useState("");
  const [languageLevel, setLanguageLevel] = useState("");
  const [languageIntent, setLanguageIntent] = useState<LangIntent>("placed");
  const [loaded, setLoaded] = useState(false);
  const [savedToast, setSavedToast] = useState("");

  const gradeOptions = ["9", "10", "11", "12"];
  const mathOptions = [
    "Algebra I + Geometry",
    "Algebra II",
    "Advanced Algebra II",
    "Precalculus",
    "Advanced Precalculus",
    "Advanced Precalculus with Differential Calculus",
    "CL Calculus AB",
    "CL Calculus BC",
  ];
  const languageNames = ["Arabic", "Chinese", "French", "Latin", "Spanish"];
  const languageLevels = ["I", "II", "III", "IV", "V"];

  useEffect(() => {
    try {
      let prefs: any = null;

      // 1) check cookie written by save()
      const raw = readCookie("catalogPrefs");
      if (raw) prefs = JSON.parse(raw);

      // 2) fall back to localStorage
      if (!prefs) {
        const ls = localStorage.getItem("catalogPrefs");
        if (ls) prefs = JSON.parse(ls);
      }

      const complete =
        !!prefs?.grade &&
        !!prefs?.mathCourse &&
        !!prefs?.language?.name &&
        !!prefs?.language?.level;

      if (complete) {
        window.location.replace("/browser"); // full navigation
      }
    } catch {
      // ignore
    }
  }, []);

  // Load saved prefs (if any)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("catalogPrefs");
      if (raw) {
        const data = JSON.parse(raw);
        setGrade(data.grade ?? "");
        setMathCourse(data.mathCourse ?? "");
        setLanguageName(data.language?.name ?? "");
        setLanguageLevel(data.language?.level ?? "");
        setLanguageIntent((data.language?.intent as LangIntent) ?? "placed");
      }
    } catch {}
    setLoaded(true);
  }, []);

  // ----- Handlers -----
  const startOnboarding = () => {
    document.cookie = "onboardingIntroSeen=1; Path=/; Max-Age=31536000; SameSite=Lax";
    setShowIntro(false);
  };
  const skipOnboarding = () => {
    document.cookie = "onboardingIntroSeen=1; Path=/; Max-Age=31536000; SameSite=Lax";
    window.location.href = "/browser"; // full document navigation
  };

  const canContinue =
    (step === 0 && !!grade) ||
    (step === 1 && !!mathCourse) ||
    (step === 2 && !!languageName && !!languageLevel) ||
    step === 3;

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const resetAll = () => {
    setGrade("");
    setMathCourse("");
    setLanguageName("");
    setLanguageLevel("");
    setLanguageIntent("placed");
    setStep(0);
    try { localStorage.removeItem("catalogPrefs"); } catch {}

    document.cookie = "catalogPrefs=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "prefsSet=; Path=/; Max-Age=0; SameSite=Lax";
  };

  const save = () => {
    const payload = {
      grade,
      mathCourse,
      language: { name: languageName, level: languageLevel, intent: languageIntent },
      savedAt: new Date().toISOString(),
      version: 1,
    };
    try {
      localStorage.setItem("catalogPrefs", JSON.stringify(payload));

      document.cookie = `catalogPrefs=${encodeURIComponent(JSON.stringify(payload))}; Path=/; Max-Age=31536000; SameSite=Lax`;

      setSavedToast("Preferences saved");
      window.location.href = "/browser"; // feels like a real page load
    } catch {
      alert("Could not save preferences. Check browser storage settings.");
    }
  };

  // ----- Render -----
  if (showIntro) {
    return <IntroStep onStart={startOnboarding} onSkip={skipOnboarding} />;
  }

  return (
    <div className={styles.page}>
      {/* Exact same top bar as landing page */}
      <div className={topbar.topBar}>
        <div className={topbar.topBarInner}>
          <img className={topbar.logo} src="logo.svg" alt="LC" />
        </div>
      </div>

      <main className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Tell us about you</h1>
          <button onClick={resetAll} className={styles.resetBtn}>Reset</button>
        </header>

        {/* Stepper */}
        <ol className={styles.stepper} aria-label="Onboarding steps">
          {steps.map((st, i) => (
            <li key={st.key} className={styles.stepItem} aria-current={i === step ? "step" : undefined}>
              <span className={`${styles.stepIndex} ${i <= step ? styles.stepIndexActive : ""}`}>{i + 1}</span>
              <span className={styles.stepLabel}>{st.label}</span>
            </li>
          ))}
        </ol>

        {/* Card */}
        <section className={styles.card}>
          {!loaded ? (
            <div className={styles.loading}>Loading…</div>
          ) : (
            <>
              {step === 0 && (
                <div>
                  <h2 className={styles.sectionTitle}>What grade are you currently in?</h2>
                  <div className={styles.gridFour}>
                    {gradeOptions.map((g) => (
                      <button
                        key={g}
                        onClick={() => setGrade(g)}
                        className={`${styles.pill} ${grade === g ? styles.pillActive : ""}`}
                        aria-pressed={grade === g}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className={styles.sectionTitle}>Which math course are you placed in?</h2>
                  <label className={styles.label}>Math Course</label>
                  <select
                    className={styles.select}
                    value={mathCourse}
                    onChange={(e) => setMathCourse(e.target.value)}
                  >
                    <option value="" disabled>Choose a course…</option>
                    {mathOptions.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className={styles.sectionTitle}>Language you’re placed in or plan to take</h2>

                  <div className={styles.intentRow}>
                    {(["placed", "planning"] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setLanguageIntent(opt)}
                        className={`${styles.intentBtn} ${languageIntent === opt ? styles.intentBtnActive : ""}`}
                      >
                        {opt === "placed" ? "Currently placed" : "Planning"}
                      </button>
                    ))}
                  </div>

                  <div className={styles.gridTwo}>
                    <div>
                      <label className={styles.label}>Language</label>
                      <select
                        className={styles.select}
                        value={languageName}
                        onChange={(e) => setLanguageName(e.target.value)}
                      >
                        <option value="" disabled>Choose a language…</option>
                        {languageNames.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={styles.label}>Level</label>
                      <select
                        className={styles.select}
                        value={languageLevel}
                        onChange={(e) => setLanguageLevel(e.target.value)}
                      >
                        <option value="" disabled>Choose a level…</option>
                        {languageLevels.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className={styles.sectionTitle}>Review</h2>
                  <div className={styles.reviewList}>
                    <Row label="Grade" value={grade || "—"} />
                    <Row label="Math" value={mathCourse || "—"} />
                    <Row
                      label="Language"
                      value={
                        languageName ? `${languageName} ${languageLevel} (${languageIntent})` : "—"
                      }
                    />
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className={styles.footerRow}>
                <button onClick={prev} disabled={step === 0} className={styles.backBtn}>
                  Back
                </button>

                {step < steps.length - 1 ? (
                  <button onClick={next} disabled={!canContinue} className={styles.primaryBtn}>
                    Continue
                  </button>
                ) : (
                  <button onClick={save} className={styles.primaryBtn}>
                    Save Preferences
                  </button>
                )}
              </div>

              {savedToast && <div className={styles.toast}>{savedToast}</div>}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

// ---------- Helpers ----------
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        border: "1px solid #e5e5e5",
        borderRadius: 12,
        padding: "12px 14px",
        fontFamily:
          "Proxima Nova, proxima-nova, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function IntroStep({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className={styles.intro}>
      <div className={topbar.topBar}>
        <div className={topbar.topBarInner}>
          <img className={topbar.logo} src="logo.svg" alt="LC" />
        </div>
      </div>

      <main className={styles.introMain}>
        <section className={styles.introCard} aria-labelledby="intro-title">
          <h1 id="intro-title" className={styles.introTitle}>
            Welcome to your Loomis Chaffee experience!
          </h1>

          <p className={styles.introBody}>First, we’ll grab a few details to tailor your course planning. This helps us:</p>

          <ol className={styles.introList}>
            <li>
              Understand your <strong>math + language</strong> starting points
            </li>
            <li>Suggest a <strong>path that fits your rigor</strong></li>
            <li>Map a <strong>desired plan</strong> through your LC journey</li>
          </ol>

          <p className={styles.introNote}>
            takes about a minute. your selections are stored on this device and can be changed anytime.
          </p>

          <div className={styles.introActions}>
            <button className={styles.primaryBtn} onClick={onStart}>
              Get started
            </button>
            <button className={styles.secondaryLink} onClick={onSkip}>
              Skip for now
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
