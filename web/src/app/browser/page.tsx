'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.css';
import ThemeToggle from '../ThemeToggle';

type RawCourse = {
  title: string;
  description?: string;
  department?: string;
  rigor?: number;         // 1,2,3
  gesc?: boolean;
  ppr?: boolean;
  term?: string;          // "year course", "term course"
  duration?: string;      // "full-year", "term", "two terms", "half course"
  grades?: number[];
  offered_in_25?: boolean;
  prerequisite?: [string | null, boolean]; // [text, permissionRequired]
};

type Course = {
  title: string;
  description?: string;
  department?: string;
  tags: string[];         // derived
  level?: string;         // "CL" | "ADV" | undefined
  grades?: number[];
  permissionRequired?: boolean;
  termLabel?: string;     // "Full year" / "Term" / etc
  prerequisiteText?: string; // shown in red banner
};

type PlanItem = { title: string };

async function fetchFirst<T>(paths: string[]): Promise<T | null> {
  for (const p of paths) {
    try { const r = await fetch(p); if (r.ok) return (await r.json()) as T; } catch {}
  }
  return null;
}

function normalizeTerm(raw?: string, duration?: string): { termLabel?: string; termTags: string[] } {
  const s = `${(raw || '').toLowerCase()} ${(duration || '').toLowerCase()}`.trim();
  if (s.includes('year')) return { termLabel: 'Full year', termTags: ['YEAR'] };
  if (s.includes('two terms')) return { termLabel: 'Two terms', termTags: ['TWO-TERM'] };
  if (s.includes('half')) return { termLabel: 'Half course', termTags: ['HALF'] };
  if (s.includes('term')) return { termLabel: 'Term', termTags: ['TERM'] };
  return { termLabel: undefined, termTags: [] };
}

function deriveTags(c: RawCourse): { tags: string[]; level?: string } {
  const tags: string[] = [];
  if (c.gesc) tags.push('GESC');
  if (c.ppr) tags.push('PPR');

  let level: string | undefined;
  const titleCL = (c.title || '').trim().toUpperCase().startsWith('CL ');
  if (titleCL || (c.rigor ?? 1) >= 3) { tags.push('CL'); level = 'CL'; }
  else if ((c.rigor ?? 1) === 2) { tags.push('ADV'); level = 'ADV'; }

  const { termTags } = normalizeTerm(c.term, c.duration);
  tags.push(...termTags);

  return { tags: Array.from(new Set(tags)), level };
}

// ---- Canonical department mapping (matches form sections) ----
const DEPT_OPTIONS = [
  'All',
  'English',
  'Modern or Classical Languages',
  'History, Philosophy, Religious Studies & Social Science',
  'Mathematics',
  'Computer Science',
  'Science',
  'Performing Arts/Visual Arts',
] as const;

type DeptOption = (typeof DEPT_OPTIONS)[number];

function canonicalizeDepartment(dep?: string): DeptOption | 'Other' {
  const d = (dep || '').toLowerCase().trim();

  if (/\benglish\b/.test(d)) return 'English';

  if (
    /(modern|classical).*language/.test(d) ||
    /\b(world )?languages?\b/.test(d) ||
    /\b(arabic|chinese|french|latin|spanish)\b/.test(d)
  ) return 'Modern or Classical Languages';

  if (/(history|philosophy|religious|religion|social)/.test(d) || /\bhprss\b/.test(d))
    return 'History, Philosophy, Religious Studies & Social Science';

  // Check CS BEFORE math/science
  if (/\b(computer(\s+science)?|cs|comp(uter)?\s*sci(ence)?)\b/.test(d))
    return 'Computer Science';

  if (/\bmath(ematics)?\b/.test(d)) return 'Mathematics';

  if (/\b(science|biology|chemistry|physics|environmental|earth)\b/.test(d))
    return 'Science';

  if (/\b(performing|visual|music|theater|theatre|dance|arts?)\b/.test(d))
    return 'Performing Arts/Visual Arts';

  return 'Other';
}

// flatten DB to simple array
function flattenDatabase(db: any): Course[] {
  const out: Course[] = [];

  const pushCourse = (rc: RawCourse, deptName?: string) => {
    const { tags, level } = deriveTags(rc);
    const { termLabel } = normalizeTerm(rc.term, rc.duration);
    out.push({
      title: rc.title,
      description: rc.description,
      department: rc.department || deptName,
      tags,
      level,
      grades: rc.grades,
      permissionRequired: Array.isArray(rc.prerequisite) ? !!rc.prerequisite[1] : undefined,
      termLabel,
      prerequisiteText: Array.isArray(rc.prerequisite) ? (rc.prerequisite[0] || '') : ''
    });
  };

  if (db && Array.isArray(db.departments)) {
    for (const deptBlock of db.departments) {
      const deptName: string | undefined = deptBlock.department;
      const courses = deptBlock.courses;

      if (Array.isArray(courses)) {
        for (const rc of courses as RawCourse[]) pushCourse(rc, deptName);
      } else if (courses && typeof courses === 'object') {
        for (const key of Object.keys(courses)) {
          const list: RawCourse[] = courses[key];
          if (!Array.isArray(list)) continue;
          for (const rc of list) pushCourse(rc, deptName || key);
        }
      }
    }
    return out;
  }

  if (Array.isArray(db)) {
    return (db as RawCourse[]).map((rc) => {
      const { tags, level } = deriveTags(rc);
      const { termLabel } = normalizeTerm(rc.term, rc.duration);
      return {
        title: rc.title,
        description: rc.description,
        department: rc.department,
        tags,
        level,
        grades: rc.grades,
        permissionRequired: Array.isArray(rc.prerequisite) ? !!rc.prerequisite[1] : undefined,
        termLabel,
        prerequisiteText: Array.isArray(rc.prerequisite) ? (rc.prerequisite[0] || '') : ''
      };
    });
  }

  const arr = Array.isArray(db?.courses) ? db.courses : [];
  return arr.map((rc: RawCourse) => {
    const { tags, level } = deriveTags(rc);
    const { termLabel } = normalizeTerm(rc.term, rc.duration);
    return {
      title: rc.title,
      description: rc.description,
      department: rc.department,
      tags,
      level,
      grades: rc.grades,
      permissionRequired: Array.isArray(rc.prerequisite) ? !!rc.prerequisite[1] : undefined,
      termLabel,
      prerequisiteText: Array.isArray(rc.prerequisite) ? (rc.prerequisite[0] || '') : ''
    };
  });
}

// Grades → labels used in subheading
const GRADE_LABELS: Record<number, string> = {
  9: 'Freshman',
  10: 'Sophomore',
  11: 'Junior',
  12: 'Senior',
};

function formatGrades(grades?: number[]): string | null {
  if (!grades || grades.length === 0) return null;
  const names = Array.from(
    new Set(
      grades
        .filter((g) => GRADE_LABELS[g])
        .sort((a, b) => a - b)
        .map((g) => GRADE_LABELS[g]!)
    )
  );
  return names.length ? names.join(', ') : null;
}

export default function Home() {
  // Hide the global site wordmark header to prevent duplicate logos
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('hide-wordmark');
      return () => { document.body.classList.remove('hide-wordmark'); };
    }
  }, []);

  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState('');
  const [includeDescriptions, setIncludeDescriptions] = useState(false);
  const [deptFilter, setDeptFilter] = useState<DeptOption>('All');
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const hasLoadedPlanRef = useRef(false);

  // Tag filters
  const [tagGESC, setTagGESC] = useState(false);
  const [tagPPR, setTagPPR] = useState(false);
  const [tagCL, setTagCL] = useState(false);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await fetchFirst<any>([
        '/catalog.json',
        '/catalogdbfinal.json',
        '/course_catalog_full.json'
      ]);
      if (!data) { setError('Could not load catalog from /public'); return; }
      setCourses(flattenDatabase(data));
    })();
  }, []);

  // Load saved plan on mount to avoid SSR/client mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem('plan');
      if (saved) setPlan(JSON.parse(saved));
    } catch {}
    hasLoadedPlanRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasLoadedPlanRef.current) return; // skip first run to avoid overwriting saved data
    try { localStorage.setItem('plan', JSON.stringify(plan)); } catch {}
  }, [plan]);

  const tagsAvailable = useMemo(() => {
    const set = new Set<string>();
    courses.forEach(c => c.tags?.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [courses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const needTag = (c: Course) => {
      if (tagGESC && !c.tags?.includes('GESC')) return false;
      if (tagPPR && !c.tags?.includes('PPR')) return false;
      if (tagCL && !c.tags?.includes('CL')) return false;
      return true;
    };
    return courses.filter(c => {
      const matchesDept =
        deptFilter === 'All' || canonicalizeDepartment(c.department) === deptFilter;

      const matchesTags = needTag(c);

      const haystacks = [
        (c.title || '').toLowerCase(),
        (c.department || '').toLowerCase(),
        ...(includeDescriptions ? [(c.description || '').toLowerCase()] : [])
      ];
      const matchesQuery = q === '' || haystacks.some(h => h.includes(q));
      return matchesDept && matchesTags && matchesQuery;
    });
  }, [courses, query, includeDescriptions, deptFilter, tagGESC, tagPPR, tagCL]);

  function addToPlan(c: Course) { setPlan(prev => [...prev, { title: c.title }]); }
  function removeFromPlan(i: number) { setPlan(prev => prev.filter((_, idx) => idx !== i)); }

  function resetOnboarding() {
    // Clear localStorage
    try {
      localStorage.removeItem("catalogPrefs");
    } catch {}
    
    // Clear cookies
    document.cookie = "catalogPrefs=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "prefsSet=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "onboardingIntroSeen=; Path=/; Max-Age=0; SameSite=Lax";
    
    // Redirect to onboarding
    window.location.href = "/onboarding";
  }

  function printPlan(): void {
  if (typeof window === 'undefined') return;

  const escapeHtml = (s = '') =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const itemsHtml = plan
    .map((p) => {
      const course = courses.find((c) => c.title === p.title) || {
        title: p.title,
        description: '',
        department: '—',
        termLabel: '—',
        tags: [] as string[],
        level: undefined,
      };

      const title = escapeHtml(course.title);
      const subject = escapeHtml(course.department ?? '—');
      const term = escapeHtml((course as any).termLabel ?? (course as any).duration ?? '—');
      const level = escapeHtml(course.level ?? '');
      const tagsHtml = (course.tags || [])
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join(' ');
      const descHtml = course.description ? `<div class="desc">${escapeHtml(course.description)}</div>` : '';

      return `<div class="card">
        <div class="card-header">
          <div class="card-title">${title}</div>
          ${level ? `<div class="card-level">${level}</div>` : ''}
        </div>
        <div class="card-meta"><span class="subject">${subject}</span> • <span class="term">${term}</span></div>
        <div class="card-tags">${tagsHtml}</div>
        ${descHtml}
      </div>`;
    })
    .join('\n');

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8"/>
      <title>My Plan</title>
      <style>
        @page { size: auto; margin: 0.5in; }
        html,body{margin:0;padding:0;color:#111;font-family: Arial, Helvetica, sans-serif;background:#fff;}
        body{padding:18px; font-size:13px; line-height:1.5;}
        h1{font-size:18px;margin:0 0 12px 0;}
        .container{max-width:800px;margin:0 auto;}
        .card{
          display:block;
          border:1px solid #e6e6e6;
          border-radius:6px;
          padding:12px 14px;
          margin:0 0 12px 0;
          background:#fff;
          page-break-inside:avoid;
          box-shadow:0 0 0 rgba(0,0,0,0);
        }
        .card-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;}
        .card-title{font-weight:700;font-size:15px;margin-bottom:6px;}
        .card-level{font-size:12px;color:#666;font-weight:600;}
        .card-meta{font-size:12px;color:#555;margin-bottom:8px;}
        .card-tags{margin-bottom:8px;}
        .tag{display:inline-block;background:#f1f1f1;color:#333;border-radius:3px;padding:3px 6px;font-size:11px;margin-right:6px;}
        .desc{font-size:13px;color:#222;white-space:pre-wrap;margin-top:6px;}
        button,.remove-button,.add-button{display:none !important;}
      </style>
    </head>
    <body>
      <div class="container">
        <h1>My Plan</h1>
        ${itemsHtml}
      </div>
    </body>
  </html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  // small delay gives the new window time to layout before printing on some browsers
  setTimeout(() => {
    try {
      w.print();
      w.close();
    } catch {
      // ignore
    }
  }, 250);
}

  return (
    <>
      {/* Top bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <img src="/logo.svg" alt="Loomis Chaffee" className={styles.logo} />
          <div className={styles.topBarActions}>
            <button 
              className={styles.resetOnboardingBtn}
              onClick={resetOnboarding}
              title="Reset your course placement information and restart the setup process"
            >
              Reset Your Info
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Drawer toggle button */}
      <button
        type="button"
        className={`${styles.drawerToggle} ${drawerOpen ? styles.drawerToggleOpen : ''}`}
        aria-expanded={drawerOpen}
        aria-controls="course-drawer"
        onClick={() => setDrawerOpen(o => !o)}
        title={drawerOpen ? 'Close course browser' : 'Open course browser'}
      >
        <span aria-hidden="true">{drawerOpen ? '◀' : '▶'}</span>
      </button>

      {/* Left Drawer: Course Browser */}
      <aside
        id="course-drawer"
        className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}
        aria-hidden={!drawerOpen}
      >
        <div className={styles.drawerContent}>
          <h1 className={styles.heading}>Course Browser</h1>
          {error && <div className={styles.error}>{error}</div>}

          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.searchRow}>
              <div className={styles.searchInputWrapper}>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search courses, departments, or keywords..."
                  className={styles.input}
                />
              </div>
              
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={includeDescriptions}
                  onChange={e => setIncludeDescriptions(e.target.checked)}
                />
                Search in course descriptions
              </label>

              {/* Department dropdown — canonical options */}
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value as DeptOption)}
                className={styles.select}
              >
                {DEPT_OPTIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Tag filters */}
            <div className={styles.tagRow}>
              <span>Tags:</span>
              <label><input type="checkbox" checked={tagGESC} onChange={e => setTagGESC(e.target.checked)} /> GESC</label>
              <label><input type="checkbox" checked={tagPPR} onChange={e => setTagPPR(e.target.checked)} /> PPR</label>
              <label><input type="checkbox" checked={tagCL} onChange={e => setTagCL(e.target.checked)} /> CL</label>
              <span className={styles.tagInfo}>({tagsAvailable.length} tag types found)</span>
            </div>
          </div>

          <div className={styles.resultInfo}>
            Showing {filtered.length} of {courses.length} courses
          </div>

          {/* Scrollable list */}
          <div className={styles.courseList}>
            <div className={styles.cardGrid}>
              {filtered.map((c, i) => (
                <div key={c.title + i} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <strong>{c.title}</strong>
                    <button className={styles.addButton} onClick={() => addToPlan(c)}>
                      <span>Add</span>
                    </button>
                  </div>

                  <div className={styles.cardContent}>
                    {/* Subheading: Department • Grades offered */}
                    <div className={styles.cardMeta}>
                      <span>{(() => {
                        const canon = canonicalizeDepartment(c.department);
                        return canon !== 'Other' ? canon : (c.department || '—');
                      })()}</span>
                      {formatGrades(c.grades) ? <> • <span>{formatGrades(c.grades)}</span></> : null}
                    </div>

                    {c.tags?.length ? (
                      <div className={styles.tagContainer}>
                        {c.tags.map(tag => (
                          <span key={tag} className={styles.tagChip}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {c.description && <p className={styles.description}>{c.description}</p>}
                  </div>

                  {(c.prerequisiteText || c.permissionRequired) && (
                    <div className={styles.prereqBanner}>
                      {c.prerequisiteText ? <span>Prerequisite: {c.prerequisiteText}</span> : null}
                      {c.permissionRequired ? <span>Departmental permission required</span> : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main container — Plan on the page (full width while drawer overlays) */}
      <div className={styles.container}>
        <div>
          <h2 className={styles.heading}>My Plan</h2>
          <div className={styles.planGrid}>
            {plan.map((p, i) => (
              <div key={`${p.title}-${i}`} className={styles.planItem}>
                <span>{p.title}</span>
                <button className={styles.removeButton} onClick={() => removeFromPlan(i)}>Remove</button>
              </div>
            ))}
          </div>
          <button className={styles.printButton} onClick={printPlan}>Print / Save PDF</button>
        </div>
      </div>
    </>
  );
}
