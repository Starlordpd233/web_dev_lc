'use client';

import { useEffect, useMemo, useState } from 'react';

type Prereq = { title?: string; timing?: 'BEFORE' | 'CONCURRENT' | 'WAIVABLE' | 'PERMISSION' };
type Course = {
  title: string;
  department?: string;
  description?: string;
  term?: string;
  termPattern?: 'FULL_YEAR' | 'TRIMESTER' | 'MULTI_TRIMESTER';
  termOfferings?: ('FALL'|'WINTER'|'SPRING')[];
  gradeLevels?: number[];
  tags?: string[];
  level?: string;
  prerequisites?: Prereq[];
  permissionRequired?: boolean;
};

type PlanItem = { title: string };

async function fetchFirst<T>(paths: string[]): Promise<T | null> {
  for (const p of paths) {
    try { const r = await fetch(p); if (r.ok) return (await r.json()) as T; } catch {}
  }
  return null;
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState('');
  const [includeDescriptions, setIncludeDescriptions] = useState(false);
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('plan') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    (async () => {
      const data = await fetchFirst<any>([
        '/catalog.json',
        '/course_catalog_minimal.json',
        '/course_catalog_full.json'
      ]);
      if (!data) { setError('Could not load catalog.json from /public'); return; }
      const arr = Array.isArray(data) ? data : (data.courses || []);
      if (!Array.isArray(arr)) { setError('Catalog must be an array of courses'); return; }
      setCourses(arr);
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem('plan', JSON.stringify(plan));
  }, [plan]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    courses.forEach(c => c.department && set.add(c.department));
    return ['All', ...Array.from(set).sort()];
  }, [courses]);

  function termLabel(c: Course) {
    if (c.termPattern === 'FULL_YEAR') return 'Full year';
    if (c.termOfferings && c.termOfferings.length) return c.termOfferings.join(' / ');
    return c.term || '';
  }
  function gradeLabel(c: Course) {
    return c.gradeLevels?.length ? `Grades ${c.gradeLevels.join(', ')}` : '';
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter(c => {
      const matchesDept =
        deptFilter === 'All' ||
        (c.department || '').toLowerCase() === deptFilter.toLowerCase();

      const haystacks = [
        (c.title || '').toLowerCase(),
        (c.department || '').toLowerCase(),
        ...(includeDescriptions ? [(c.description || '').toLowerCase()] : [])
      ];
      const matchesQuery = q === '' || haystacks.some(h => h.includes(q));

      return matchesDept && matchesQuery;
    });
  }, [courses, query, includeDescriptions, deptFilter]);

  function addToPlan(c: Course) { setPlan(prev => [...prev, { title: c.title }]); }
  function removeFromPlan(i: number) { setPlan(prev => prev.filter((_, idx) => idx !== i)); }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      {/* Left: Browser */}
      <div>
        <h1>Course Browser</h1>
        {error && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffeeba', padding: 8, borderRadius: 8, marginBottom: 8 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="search title or department (e.g., English)"
            style={{ flex: 1, padding: 8 }}
          />
          <label style={{ display: 'flex', gap: 6, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={includeDescriptions}
              onChange={e => setIncludeDescriptions(e.target.checked)}
            />
            search descriptions
          </label>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ padding: 8 }}>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
          Showing {filtered.length} of {courses.length} courses
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {filtered.map((c, i) => (
            <div key={c.title + i} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <strong>{c.title}</strong>
                <button onClick={() => addToPlan(c)}>Add</button>
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                <span>{c.department || '—'}</span>
                {' • '}
                <span>{termLabel(c)}</span>
                {c.level ? <> {' • '}<span>{c.level}</span></> : null}
                {c.tags?.length ? <> {' • '}<span>{c.tags.join(', ')}</span></> : null}
                {c.permissionRequired ? <> {' • '}<span>permission</span></> : null}
              </div>
              {gradeLabel(c) && <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{gradeLabel(c)}</div>}
              {c.prerequisites?.length ? (
                <div style={{ fontSize: 12, marginTop: 6 }}>
                  <em>Prerequisite: {c.prerequisites.map(p => p.title).filter(Boolean).join(' or ')}</em>
                </div>
              ) : null}
              {c.description && <p style={{ marginTop: 8 }}>{c.description}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Plan */}
      <div>
        <h2>My Plan</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {plan.map((p, i) => (
            <div key={i} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>{p.title}</span>
              <button onClick={() => removeFromPlan(i)}>Remove</button>
            </div>
          ))}
        </div>
        <button style={{ marginTop: 12 }} onClick={() => window.print()}>Print / Save PDF</button>
      </div>
    </div>
  );
}
