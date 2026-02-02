const $ = (sel) => document.querySelector(sel);

async function loadPublicationData() {
  const res = await fetch("publication.json", { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

function normalize(value) {
  return String(value || "").toLowerCase();
}

function uniqueSorted(values) {
  return [...new Set(values.filter(v => v !== null && v !== undefined && v !== ""))]
    .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
}

function sortPublications(pubs) {
  return [...pubs].sort((a, b) => {
    const yearA = a.year || 0;
    const yearB = b.year || 0;
    if (yearA !== yearB) return yearB - yearA;
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

function matchesQuery(pub, query) {
  if (!query) return true;
  const hay = [
    pub.title,
    pub.authors,
    pub.venue,
    pub.type,
    pub.status,
    Array.isArray(pub.keywords) ? pub.keywords.join(" ") : ""
  ].join(" ");
  return normalize(hay).includes(normalize(query));
}

function createCitation(pub) {
  const p = document.createElement("p");
  p.className = "pub-cite";

  const addText = (text) => {
    if (!text) return;
    p.appendChild(document.createTextNode(text));
  };

  if (pub.authors) addText(`${pub.authors} `);
  if (pub.year) addText(`(${pub.year}). `);
  if (pub.title) addText(`${pub.title}. `);
  if (pub.venue) {
    const em = document.createElement("em");
    em.textContent = pub.venue;
    p.appendChild(em);
    p.appendChild(document.createTextNode(". "));
  }
  if (pub.note) addText(pub.note);

  return p;
}

function createLinks(pub) {
  const wrap = document.createElement("div");
  wrap.className = "pub-links";

  const links = [];
  if (Array.isArray(pub.links)) {
    pub.links.forEach(link => {
      if (link && link.href && link.label) links.push(link);
    });
  } else {
    if (pub.doi) links.push({ label: "DOI", href: pub.doi });
    if (pub.url) links.push({ label: pub.urlLabel || "Link", href: pub.url });
  }

  links.forEach(link => {
    const a = document.createElement("a");
    a.className = "pub-link";
    a.href = link.href;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = link.label;
    wrap.appendChild(a);
  });

  return wrap;
}

function createItem(pub) {
  const article = document.createElement("article");
  article.className = "pub-item";

  const title = document.createElement("h3");
  title.className = "pub-title";
  title.textContent = pub.title || "Untitled";
  article.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "pub-meta";
  if (pub.type) {
    const type = document.createElement("span");
    type.className = "pub-tag";
    type.textContent = pub.type;
    meta.appendChild(type);
  }
  if (pub.status) {
    const status = document.createElement("span");
    status.className = "pub-status";
    status.textContent = pub.status;
    meta.appendChild(status);
  }
  if (meta.children.length) article.appendChild(meta);

  article.appendChild(createCitation(pub));

  const links = createLinks(pub);
  if (links.children.length) article.appendChild(links);

  return article;
}

function buildSelect(select, options, allLabel) {
  select.innerHTML = "";
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = allLabel;
  select.appendChild(all);

  options.forEach(value => {
    const opt = document.createElement("option");
    opt.value = String(value);
    opt.textContent = String(value);
    select.appendChild(opt);
  });
}

function renderList(pubs, features) {
  const list = $("#pub-list");
  list.innerHTML = "";

  if (!pubs.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No publications found.";
    list.appendChild(empty);
    return;
  }

  if (features.yearGrouping) {
    const grouped = new Map();
    pubs.forEach(pub => {
      const year = pub.year || "Other";
      if (!grouped.has(year)) grouped.set(year, []);
      grouped.get(year).push(pub);
    });

    [...grouped.keys()].sort((a, b) => Number(b) - Number(a)).forEach(year => {
      const heading = document.createElement("h2");
      heading.className = "pub-year";
      heading.textContent = year;
      list.appendChild(heading);

      grouped.get(year).forEach(pub => list.appendChild(createItem(pub)));
    });
  } else {
    pubs.forEach(pub => list.appendChild(createItem(pub)));
  }
}

(async function init() {
  const data = await loadPublicationData();
  if (!data) return;

  const titleEl = $("#page-title");
  if (titleEl && data.title) titleEl.textContent = data.title;
  if (data.title) document.title = data.title;

  const subtitleEl = $("#page-subtitle");
  if (subtitleEl) subtitleEl.textContent = data.subtitle || "";

  const features = Object.assign(
    {
      filters: true,
      yearFilter: true,
      typeFilter: true,
      search: true,
      yearGrouping: true
    },
    data.features || {}
  );

  const pubs = sortPublications(data.publications || []);
  const allYears = uniqueSorted(pubs.map(p => p.year)).sort((a, b) => Number(b) - Number(a));
  const derivedTypes = uniqueSorted(pubs.map(p => p.type));
  const types = data.types && data.types.length ? data.types : derivedTypes;

  const yearSelect = $("#filter-year");
  const typeSelect = $("#filter-type");
  const searchInput = $("#filter-search");
  const filterWrap = $("#filter-controls");
  const yearWrap = $("#filter-year-wrap");
  const typeWrap = $("#filter-type-wrap");
  const searchWrap = $("#search-wrap");
  const meta = $("#filter-meta");

  const labels = Object.assign(
    {
      filterYear: "Filter by year:",
      filterType: "Filter by type:",
      searchLabel: "Search:",
      searchPlaceholder: "Search by title, author, keyword",
      allYears: "All years",
      allTypes: "All types",
      showing: "Showing"
    },
    data.labels || {}
  );

  $("#label-year").textContent = labels.filterYear;
  $("#label-type").textContent = labels.filterType;
  $("#label-search").textContent = labels.searchLabel;
  if (searchInput) searchInput.placeholder = labels.searchPlaceholder;

  if (!features.filters && filterWrap) {
    filterWrap.style.display = "none";
  } else {
    if (yearWrap) yearWrap.style.display = features.yearFilter ? "" : "none";
    if (typeWrap) typeWrap.style.display = features.typeFilter ? "" : "none";
    if (searchWrap) searchWrap.style.display = features.search ? "" : "none";
  }

  if (yearSelect) buildSelect(yearSelect, allYears, labels.allYears);
  if (typeSelect) buildSelect(typeSelect, types, labels.allTypes);

  const state = { year: "all", type: "all", query: "" };

  const refresh = () => {
    const filtered = pubs.filter(pub => {
      if (features.yearFilter && state.year !== "all" && String(pub.year) !== state.year) return false;
      if (features.typeFilter && state.type !== "all" && String(pub.type) !== state.type) return false;
      if (features.search && !matchesQuery(pub, state.query)) return false;
      return true;
    });

    renderList(filtered, features);
    if (meta) meta.textContent = `${labels.showing} ${filtered.length} of ${pubs.length}`;
  };

  if (yearSelect) {
    yearSelect.addEventListener("change", (e) => {
      state.year = e.target.value;
      refresh();
    });
  }

  if (typeSelect) {
    typeSelect.addEventListener("change", (e) => {
      state.type = e.target.value;
      refresh();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.query = e.target.value.trim();
      refresh();
    });
  }

  refresh();
})();
