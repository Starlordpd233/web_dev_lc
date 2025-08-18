(() => {
  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => [...el.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);
  const isCoursePage = /course\.html$/.test(location.pathname);

  async function loadData() {
    const res = await fetch('data/courses.json', {cache:'no-store'});
    if (!res.ok) throw new Error('Failed to load data.');
    return res.json();
  }

  function renderTags(tagSet) {
    const select = qs('#tagFilter');
    if (!select) return;
    [...tagSet].sort((a,b)=>a.localeCompare(b)).forEach(tag => {
      const opt = document.createElement('option');
      opt.value = tag; opt.textContent = tag;
      select.appendChild(opt);
    });
  }

  function courseCard(c) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <h3>${c.title}</h3>
      <div class="meta">${c.level || ''}${c.level && c.department ? ' · ' : ''}${c.department || ''}</div>
      <div class="badges">${(c.tags||[]).map(t=>`<span class="badge">${t}</span>`).join('')}</div>
      <div class="actions">
        <a class="button" href="course.html?id=${encodeURIComponent(c.id)}">Open</a>
        ${c.syllabus ? `<a class="button secondary" href="${c.syllabus}" target="_blank" rel="noopener">Syllabus</a>` : ''}
      </div>
    `;
    return div;
  }

  function renderCourseList(data) {
    const list = qs('#courseList');
    const search = qs('#search');
    const tagFilter = qs('#tagFilter');

    const allTags = new Set(data.courses.flatMap(c => c.tags || []));
    renderTags(allTags);

    let shown = data.courses.slice();

    function applyFilters() {
      const q = (search?.value || '').trim().toLowerCase();
      const tag = tagFilter?.value || '';
      shown = data.courses.filter(c => {
        const hay = [c.title, c.department, c.level, ...(c.tags||[])].join(' ').toLowerCase();
        const matchQ = !q || hay.includes(q);
        const matchTag = !tag || (c.tags||[]).includes(tag);
        return matchQ && matchTag;
      });
      list.innerHTML = '';
      shown.forEach(c => list.appendChild(courseCard(c)));
      if (!shown.length) list.innerHTML = '<p>No matching courses.</p>';
    }

    search?.addEventListener('input', applyFilters);
    tagFilter?.addEventListener('change', applyFilters);
    applyFilters();
  }

  function resourceRow(r) {
    const host = (() => { try { return new URL(r.url).host.replace('www.', ''); } catch { return ''; } })();
    const div = document.createElement('div');
    div.className = 'resource';
    div.dataset.type = r.type;
    div.innerHTML = `
      <div class="title"><a href="${r.url}" target="_blank" rel="noopener">${r.title}</a></div>
      <div class="desc">${r.description || ''}</div>
      <div class="meta">${r.type.toUpperCase()}${host ? ' · ' + host : ''}${r.provider ? ' · ' + r.provider : ''}</div>
    `;
    return div;
  }

  function renderCoursePage(data) {
    const id = params.get('id');
    const course = data.courses.find(c => c.id === id);
    const head = qs('#courseHeader');
    const list = qs('#resourceList');
    const typeFilter = qs('#typeFilter');

    if (!course) {
      head.innerHTML = '<h1>Course not found</h1>';
      return;
    }

    document.title = course.title + ' • Study Hub';
    head.innerHTML = `
      <h1>${course.title}</h1>
      <div class="meta">${course.level || ''}${course.level && course.department ? ' · ' : ''}${course.department || ''}</div>
      <div class="badges">${(course.tags||[]).map(t=>`<span class="badge">${t}</span>`).join('')}</div>
      ${course.description ? `<p>${course.description}</p>` : ''}
    `;

    let shown = course.resources.slice();
    function apply() {
      const t = typeFilter?.value || '';
      list.innerHTML = '';
      shown = course.resources.filter(r => !t || r.type === t);
      shown.forEach(r => list.appendChild(resourceRow(r)));
      if (!shown.length) list.innerHTML = '<p>No resources of this type.</p>';
    }
    typeFilter?.addEventListener('change', apply);
    apply();
  }

  loadData()
    .then(data => {
      if (isCoursePage) renderCoursePage(data);
      else renderCourseList(data);
    })
    .catch(err => {
      const target = qs('#courseList') || qs('#courseHeader') || document.body;
      const p = document.createElement('p');
      p.textContent = 'Error: ' + err.message;
      target.appendChild(p);
    });
})();