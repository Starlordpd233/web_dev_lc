"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import styles from "./enhanced-styles.module.css";

// Keep navigation on the same origin/port. Use in-app routes.
const TARGET_AFTER_LOGIN = "/onboarding";

// Allow inline CSS custom properties like --size, --duration without using 'any'
type CSSCustomProperties = Record<`--${string}`, string>;
type ParticleStyle = CSSProperties & CSSCustomProperties;

export default function LoginPage() {
  const loginFormRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const loomisBtnRef = useRef<HTMLButtonElement>(null);
  const signupBtnRef = useRef<HTMLButtonElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Background: use provided JPG; fall back to PNG if it fails to load
  const [bgUrl, setBgUrl] = useState<string>("/frame1_background.jpg");
  useEffect(() => {
    const img = new Image();
    img.onerror = () => setBgUrl("/lcphotoedited.png");
    img.src = "/frame1_background.jpg";
  }, []);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    function createRipple(event: MouseEvent) {
      const button = event.currentTarget as HTMLElement;
      const ripple = document.createElement("span");
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = (event.clientX ?? 0) - rect.left;
      const y = (event.clientY ?? 0) - rect.top;
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.className = styles.ripple;
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    }
    const buttons = Array.from(
      document.querySelectorAll(`.${styles.btn}`)
    ) as HTMLElement[];
    // Use a wrapper to keep the correct currentTarget typing
    const handlers = buttons.map((b) => {
      const handler = (e: MouseEvent) => createRipple(e);
      b.addEventListener("click", handler);
      return { b, handler };
    });
    return () => {
      handlers.forEach(({ b, handler }) => b.removeEventListener("click", handler));
    };
  }, []);

  // Cursor-follow glow inside the form container and subtle tilt
  useEffect(() => {
    const el = loginFormRef.current;
    const glow = glowRef.current;
    if (!el || !glow) return;

    let rafId = 0;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      glow.style.opacity = "1";
      glow.style.transform = `translate(${x - 200}px, ${y - 200}px)`;

      // Subtle tilt based on cursor position
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.transform = `perspective(800px) rotateX(${(-dy * 2).toFixed(2)}deg) rotateY(${(dx * 2).toFixed(2)}deg)`;
      });
    };

    const handleLeave = () => {
      glow.style.opacity = "0";
      el.style.transform = "none";
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
      cancelAnimationFrame(rafId);
    };
  }, [loginFormRef]);

  // Magnetic hover for primary and secondary buttons
  useEffect(() => {
    const btns = [loomisBtnRef.current, signupBtnRef.current].filter(
      Boolean
    ) as HTMLElement[];
    const move = (btn: HTMLElement, e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      const max = 6; // px
      const tx = Math.max(Math.min(x / 10, max), -max);
      const ty = Math.max(Math.min(y / 10, max), -max);
      btn.style.transform = `translate(${tx}px, ${ty}px)`;
    };
    const leave = (btn: HTMLElement) => {
      btn.style.transform = "translate(0, 0)";
    };
    const handlers = btns.map((btn) => {
      const onMove = (e: MouseEvent) => move(btn, e);
      const onLeave = () => leave(btn);
      btn.addEventListener("mousemove", onMove);
      btn.addEventListener("mouseleave", onLeave);
      return { btn, onMove, onLeave };
    });
    return () => {
      handlers.forEach(({ btn, onMove, onLeave }) => {
        btn.removeEventListener("mousemove", onMove);
        btn.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  const handleLoomisLogin = () => {
    // For now, just navigate within the same app
    window.location.href = TARGET_AFTER_LOGIN;
  };

  const handleSignup = () => {
    // For now, just navigate within the same app
    window.location.href = TARGET_AFTER_LOGIN;
  };

  return (
    <>
      {/* Accessible skip link */}
      <a href="#main" className={styles.skipLink}>Skip to content</a>

      {/* Minimal top bar for brand context */}
      <div className={styles.topBar}>
        <div className={styles.logoContainer}>
          <img src="/logo.svg" alt="LC" className={styles.topBarLogo} />
        </div>
      </div>

      <main
        id="main"
        className={`${styles.pageRoot} ${isPageLoaded ? styles.pageLoaded : ""}`}
        aria-label="Login page"
      >
        {/* Background image with a gentle Ken Burns motion */}
        <div
          className={styles.backgroundImageLayer}
          style={{ backgroundImage: `url('${bgUrl}')` }}
          aria-hidden="true"
        />
        <div className={styles.backgroundPattern} aria-hidden="true" />
        <div className={styles.vignetteOverlay} aria-hidden="true" />
        <div className={styles.gradientOrb} style={{ left: "15%", top: "20%", animationDelay: "0s" }} />
        <div className={styles.gradientOrb} style={{ left: "85%", top: "70%", animationDelay: "5s" }} />
        <div className={styles.gradientOrb} style={{ left: "75%", top: "15%", animationDelay: "10s" }} />

        {/* Floating particles (CSS variables control size/duration/drift/opacity) */}
        <div
          className={styles.particle}
          style={{
            left: "10%",
            "--size": "6px",
            "--duration": "22s",
            "--delay": "0s",
            "--driftX": "20px",
            "--opacity": "0.7",
          } as ParticleStyle}
        />
        <div
          className={styles.particle}
          style={{
            left: "18%",
            "--size": "8px",
            "--duration": "26s",
            "--delay": "3s",
            "--driftX": "-10px",
            "--opacity": "0.8",
          } as ParticleStyle}
        />
        <div
          className={styles.particle}
          style={{
            left: "28%",
            "--size": "4px",
            "--duration": "18s",
            "--delay": "6s",
            "--driftX": "30px",
            "--opacity": "0.5",
          } as ParticleStyle}
        />
        <div
          className={styles.particle}
          style={{
            left: "42%",
            "--size": "10px",
            "--duration": "30s",
            "--delay": "1s",
            "--driftX": "-25px",
            "--opacity": "0.65",
          } as ParticleStyle}
        />
        <div
          className={styles.particle}
          style={{
            left: "54%",
            "--size": "5px",
            "--duration": "21s",
            "--delay": "5s",
            "--driftX": "15px",
            "--opacity": "0.6",
          } as ParticleStyle}
        />
        <div
          className={styles.particle}
          style={{
            left: "67%",
            "--size": "7px",
            "--duration": "24s",
            "--delay": "2s",
            "--driftX": "-15px",
            "--opacity": "0.7",
          } as ParticleStyle}
        />
        <div
          className={styles.particle}
          style={{
            left: "78%",
            "--size": "6px",
            "--duration": "23s",
            "--delay": "8s",
            "--driftX": "10px",
            "--opacity": "0.6",
          } as ParticleStyle}
        />
        <div
          className={styles.particle}
          style={{
            left: "86%",
            "--size": "9px",
            "--duration": "28s",
            "--delay": "4s",
            "--driftX": "-20px",
            "--opacity": "0.7",
          } as ParticleStyle}
        />
        <div
          className={styles.particle}
          style={{
            left: "93%",
            "--size": "5px",
            "--duration": "20s",
            "--delay": "10s",
            "--driftX": "8px",
            "--opacity": "0.55",
          } as ParticleStyle}
        />

        {/* Additional animated elements */}
        <div
          className={styles.floatingShape}
          style={{ left: "5%", top: "30%", animationDelay: "3s" }}
        />
        <div
          className={styles.floatingShape}
          style={{ left: "90%", top: "60%", animationDelay: "8s" }}
        />

        <div className={styles.mainContainer}>
          <div className={styles.leftPanel}>
            <div className={styles.logoBox}>
              <img
                src="/LC-COA-red-rgb.png"
                alt="Loomis Chaffee Crest"
                style={{ maxWidth: 200, height: "auto", display: "block" }}
                className={styles.logoImage}
              />
            </div>

            <div className={styles.mottoWrap}>
              <div className={styles.mottoContainer}>
                <div className={styles.mottoText}>
                  <span className={styles.mottoChar}>N</span>
                  <span className={styles.mottoChar}>e</span>
                  <span className={styles.mottoSpace}> </span>
                  <span className={styles.mottoChar}>c</span>
                  <span className={styles.mottoChar}>e</span>
                  <span className={styles.mottoChar}>d</span>
                  <span className={styles.mottoChar}>e</span>
                  <span className={styles.mottoSpace}> </span>
                  <span className={styles.mottoChar}>m</span>
                  <span className={styles.mottoChar}>a</span>
                  <span className={styles.mottoChar}>l</span>
                  <span className={styles.mottoChar}>i</span>
                  <span className={styles.mottoChar}>s</span>
                  <span className={styles.mottoChar}>.</span>
                </div>
                <div className={styles.mottoGlow} aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className={styles.rightPanel}>
            <h1 className={styles.welcomeText}>Welcome back.</h1>

            <div className={styles.formContainer} ref={loginFormRef}>
              <div ref={glowRef} className={styles.glowEffect} aria-hidden="true" />
              <button
                ref={loomisBtnRef}
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleLoomisLogin}
                disabled={isLoading}
                aria-label="Continue with Loomis Account"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <span className={styles.loadingIndicator} aria-live="polite">
                    <svg
                      className={styles.loadingIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        strokeWidth="4"
                        strokeDasharray="50 50"
                        strokeDashoffset="0"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <svg
                      className={styles.icon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Continue with Loomis Account
                  </>
                )}
              </button>

              <div className={styles.divider}>
                <span>or</span>
              </div>

              <button
                ref={signupBtnRef}
                className={`${styles.btn} ${styles.btnOutline}`}
                onClick={handleSignup}
                disabled={isLoading}
                aria-label="Create New Account"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <span className={styles.loadingIndicator} aria-live="polite">
                    <svg
                      className={styles.loadingIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        strokeWidth="4"
                        strokeDasharray="50 50"
                        strokeDashoffset="0"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <svg
                      className={styles.icon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M12 20v-16m-8 8h16" />
                    </svg>
                    Create New Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
