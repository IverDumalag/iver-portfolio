/**
 * Iver Marl Dumalag — Portfolio
 *
 * Small, dependency-free enhancements on top of a fully working static page:
 *   1. Resume + email placeholders switch to real links once you fill in SITE_CONFIG.
 *   2. Navigation highlights the section you are reading (scroll-spy).
 *   3. Sections fade in as they scroll into view (skipped for reduced-motion users).
 *
 * No imports/exports on purpose: the compiled file is a plain script, so the
 * site also works when index.html is opened straight from disk.
 */
(() => {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* 1. Content you can edit                                             */
  /* ------------------------------------------------------------------ */

  interface SiteConfig {
    /** Public URL (or relative path) of your resume PDF, e.g. "assets/iver-dumalag-resume.pdf". */
    readonly resumeUrl: string;
    /** Hiring email address, e.g. "you@yourdomain.com". */
    readonly email: string;
  }

  const SITE_CONFIG: SiteConfig = {
    resumeUrl: "assets/v6 - Iver Marl Dumalag - for Web.pdf",
    email: "ivermarldumalag681@gmail.com",
  };

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  const $$ = <T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document): T[] =>
    Array.from(root.querySelectorAll<T>(selector));

  const prefersReducedMotion = (): boolean =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Only allow http(s) URLs or relative paths — never javascript:, data:, etc. */
  const isSafeUrl = (value: string): boolean => {
    const v = value.trim();
    if (v === "") return false;
    if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return /^https?:/i.test(v);
    return true;
  };

  const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  /* ------------------------------------------------------------------ */
  /* 2. Resume + email                                                   */
  /* ------------------------------------------------------------------ */

  type ResumeKind = "hero" | "view" | "download";

  const RESUME_LABELS: Record<ResumeKind, string> = {
    hero: "Resume PDF ↗",
    view: "View resume ↗",
    download: "Download PDF ↓",
  };

  const isResumeKind = (value: string | undefined): value is ResumeKind =>
    value === "hero" || value === "view" || value === "download";

  function applyResume(url: string): void {
    if (!isSafeUrl(url)) return;

    $$<HTMLAnchorElement>("a[data-resume]").forEach((link) => {
      const kind = link.dataset.resume;
      if (!isResumeKind(kind)) return;

      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = RESUME_LABELS[kind];
      link.classList.remove("is-pending");
      link.removeAttribute("aria-disabled");
      if (kind === "download") link.setAttribute("download", "");
    });

    $$("[data-resume-note]").forEach((el) => {
      el.hidden = true;
    });
  }

  function applyEmail(address: string): void {
    if (!isEmail(address)) return;
    const email = address.trim();

    $$<HTMLAnchorElement>("a[data-email]").forEach((link) => {
      link.textContent = email;
      link.href = `mailto:${email}`;
    });
    $$("[data-email-label]").forEach((el) => {
      el.textContent = "EMAIL";
    });
    $$("[data-email-note]").forEach((el) => {
      el.hidden = true;
    });
  }

  /* ------------------------------------------------------------------ */
  /* 3. Scroll-spy for the navigation                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Which nav item represents each page section.
   * Work       → Selected work, Behind the interface
   * About      → A little about me, Technical toolkit & certifications
   * Resume / Contact → themselves
   */
  const SECTION_TO_NAV: Readonly<Record<string, string>> = {
    work: "work",
    backend: "work",
    about: "about",
    toolkit: "about",
    resume: "resume",
    contact: "contact",
  };

  function initScrollSpy(): void {
    if (!("IntersectionObserver" in window)) return;

    const navLinks = $$<HTMLAnchorElement>("a[data-nav]");
    const sections = Object.keys(SECTION_TO_NAV)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (navLinks.length === 0 || sections.length === 0) return;

    const setActive = (navKey: string | null): void => {
      navLinks.forEach((link) => {
        if (link.dataset.nav === navKey) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(SECTION_TO_NAV[entry.target.id] ?? null);
        });
      },
      // A section counts as "current" while it crosses a band near the top of the viewport.
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));

    // Clear the highlight when back in the introduction.
    const hero = document.querySelector<HTMLElement>(".hero");
    if (hero) {
      new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) setActive(null);
        },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
      ).observe(hero);
    }
  }

  /* ------------------------------------------------------------------ */
  /* 4. Reveal on scroll                                                 */
  /* ------------------------------------------------------------------ */

  function initReveal(): void {
    const targets = $$("[data-reveal]");
    if (targets.length === 0 || prefersReducedMotion() || !("IntersectionObserver" in window)) return;

    document.documentElement.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */

  const boot = (): void => {
    applyResume(SITE_CONFIG.resumeUrl);
    applyEmail(SITE_CONFIG.email);
    initScrollSpy();
    initReveal();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
