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

const TYPE_ORDER = ["Journal article", "Conference paper", "Preprint", "Under review"];

function typeRank(type) {
  const idx = TYPE_ORDER.indexOf(type);
  return idx === -1 ? TYPE_ORDER.length : idx;
}

function sortPublications(pubs) {
  return [...pubs].sort((a, b) => {
    const firstA = a.firstAuthor ? 0 : 1;
    const firstB = b.firstAuthor ? 0 : 1;
    if (firstA !== firstB) return firstA - firstB;

    const typeA = typeRank(a.type);
    const typeB = typeRank(b.type);
    if (typeA !== typeB) return typeA - typeB;

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

function isProbablyDoi(value) {
  return /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i.test(String(value || "").trim());
}

function toDoiHref(doiOrUrl) {
  const raw = String(doiOrUrl || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (isProbablyDoi(raw)) return `https://doi.org/${raw}`;
  return raw;
}

function toDoiLabel(doiOrUrl) {
  const raw = String(doiOrUrl || "").trim();
  if (!raw) return "";

  const match = raw.match(/doi\.org\/(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/i);
  if (match) return match[1];

  if (isProbablyDoi(raw)) return raw;

  return raw.replace(/^https?:\/\//i, "");
}

function resolveViewLink(pub) {
  if (pub?.view && typeof pub.view === "object") {
    const href = String(pub.view.href || "").trim();
    if (href) return { href, label: pub.view.label || "View" };
  }

  if (pub?.doi) {
    const href = toDoiHref(pub.doi);
    if (href) return { href, label: pub.viewLabel || toDoiLabel(pub.doi) || "View" };
  }

  if (pub?.url) {
    const href = String(pub.url || "").trim();
    if (href) return { href, label: pub.urlLabel || "View" };
  }

  if (Array.isArray(pub?.links)) {
    const first = pub.links.find(link => link && link.href);
    if (first) return { href: first.href, label: first.label || "View" };
  }

  return null;
}

function createItem(pub) {
  const article = document.createElement("article");
  article.className = "pub-item";

  const heading = document.createElement("div");
  heading.className = "pub-heading";

  const title = document.createElement("h3");
  title.className = "pub-title";
  title.textContent = pub.title || "Untitled";
  heading.appendChild(title);

  if (pub.year) {
    const year = document.createElement("span");
    year.className = "pub-year";
    year.textContent = pub.year;
    heading.appendChild(year);
  }

  article.appendChild(heading);

  const details = document.createElement("p");
  details.className = "pub-details";

  const appendPart = (node) => {
    if (!node) return;
    if (details.childNodes.length) {
      const sep = document.createElement("span");
      sep.className = "pub-sep";
      sep.textContent = " | ";
      details.appendChild(sep);
    }
    details.appendChild(node);
  };

  if (pub.authors) {
    const authors = document.createElement("span");
    authors.className = "pub-authors";
    authors.textContent = pub.authors;
    appendPart(authors);
  }

  if (pub.venue) {
    const venue = document.createElement("span");
    venue.className = "pub-venue";
    venue.textContent = pub.venue;
    appendPart(venue);
  }

  if (pub.note) {
    const note = document.createElement("span");
    note.className = "pub-note";
    note.textContent = pub.note;
    appendPart(note);
  }

  const view = resolveViewLink(pub);
  if (view) {
    const a = document.createElement("a");
    a.className = "pub-view";
    a.href = view.href;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = view.label;
    appendPart(a);
  }

  if (details.childNodes.length) article.appendChild(details);

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
      heading.className = "pub-year-group";
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
