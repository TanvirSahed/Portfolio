const $ = (sel, root = document) => root.querySelector(sel);
const slugify = (value) => String(value || "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

async function loadPageData() {
  const res = await fetch("projects.json", { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

function applyTextStyle(el, style) {
  if (!el || !style) return;
  if (style.color) el.style.color = style.color;
  if (style.size) el.style.fontSize = style.size;
  if (style.weight) el.style.fontWeight = style.weight;
  if (style.font) el.style.fontFamily = style.font;
  if (style.align) el.style.textAlign = style.align;
  if (style.lineHeight) el.style.lineHeight = style.lineHeight;
  if (style.letterSpacing) el.style.letterSpacing = style.letterSpacing;
  if (style.textTransform) el.style.textTransform = style.textTransform;
}

function isSafeHref(href) {
  return /^(https?:|mailto:)/i.test(String(href || "").trim());
}

function normalizeLineBreakTokens(raw) {
  let text = String(raw || "");
  text = text.replace(/\r\n?/g, "\n");

  // Support the common "typed token" forms as well as real newline chars.
  text = text.replace(/\\n/g, "\n");

  // Treat "/n" as a line break when it looks like a token (not in words/URLs).
  text = text.replace(/(^|[^\w])\/n(?=[^\w]|$)/g, "$1\n");

  // If "/n" is used with surrounding spaces (e.g. "Line 1 /n Line 2"), avoid
  // leading whitespace at the start of the next line.
  text = text.replace(/\n[ \t]+/g, "\n");

  return text;
}

function appendTextWithBreaks(parent, raw) {
  const text = normalizeLineBreakTokens(raw);
  const parts = text.split("\n");
  parts.forEach((part, idx) => {
    if (part) parent.appendChild(document.createTextNode(part));
    if (idx < parts.length - 1) parent.appendChild(document.createElement("br"));
  });
}

function appendTextWithLinks(parent, raw) {
  const text = String(raw || "");
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match;

  while ((match = re.exec(text))) {
    if (match.index > last) {
      appendTextWithBreaks(parent, text.slice(last, match.index));
    }

    const label = match[1] || "";
    const href = match[2] || "";

    if (label && isSafeHref(href)) {
      const a = document.createElement("a");
      a.className = "meta-inline-link";
      a.href = href;
      a.target = "_blank";
      a.rel = "noreferrer";
      appendTextWithBreaks(a, label);
      parent.appendChild(a);
    } else {
      // If the href is missing/unsafe, render as plain text.
      appendTextWithBreaks(parent, label || match[0]);
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) {
    appendTextWithBreaks(parent, text.slice(last));
  }
}

function setCssVar(name, value) {
  if (value === null || value === undefined || value === "") return;
  document.documentElement.style.setProperty(name, String(value));
}

function normalizeAnchor(value) {
  const anchor = String(value || "").trim().toLowerCase();
  if (["left", "center", "right"].includes(anchor)) return anchor;
  return "";
}

function applyChromeConfig(page) {
  if (!page || typeof page !== "object") return;

  const tabsFrame = page.tabsFrame;
  if (tabsFrame && typeof tabsFrame === "object") {
    if (tabsFrame.enabled === false) {
      setCssVar("--proj-tabs-frame-bg", "transparent");
      setCssVar("--proj-tabs-frame-border", "1px solid transparent");
      setCssVar("--proj-tabs-frame-shadow", "none");
      setCssVar("--proj-tabs-frame-radius", "0px");
      setCssVar("--proj-tabs-frame-padding", "0px");
    } else {
      setCssVar("--proj-tabs-frame-bg", tabsFrame.background);
      setCssVar("--proj-tabs-frame-border", tabsFrame.border);
      setCssVar("--proj-tabs-frame-shadow", tabsFrame.shadow);
      setCssVar("--proj-tabs-frame-radius", tabsFrame.radius);
      setCssVar("--proj-tabs-frame-padding", tabsFrame.padding);
    }

    setCssVar("--proj-tabs-frame-margin-bottom", tabsFrame.marginBottom);
  }

  const tabButtons = page.tabButtons;
  if (tabButtons && typeof tabButtons === "object") {
    setCssVar("--proj-tab-btn-width", tabButtons.width);
    setCssVar("--proj-tab-btn-height", tabButtons.height);
    setCssVar("--proj-tab-btn-radius", tabButtons.radius || tabButtons.roundness);
    setCssVar("--proj-tab-btn-active-bg", tabButtons.activeBackground || tabButtons.activeColor || tabButtons.color || tabButtons.colour);
    setCssVar("--proj-tab-btn-active-text", tabButtons.activeTextColor || tabButtons.textColor || tabButtons.textColour);
  }

  const categoryUnderline = page.categoryUnderline;
  if (categoryUnderline && typeof categoryUnderline === "object") {
    setCssVar("--proj-category-underline-display", categoryUnderline.enabled === false ? "none" : "block");
    setCssVar("--proj-category-underline-color", categoryUnderline.color);
    setCssVar("--proj-category-underline-thickness", categoryUnderline.thickness);
    setCssVar("--proj-category-underline-length", categoryUnderline.length);
    setCssVar("--proj-category-underline-radius", categoryUnderline.radius);
    setCssVar("--proj-category-underline-gap", categoryUnderline.gap);

    const anchor = normalizeAnchor(categoryUnderline.anchor);
    if (anchor === "center") {
      setCssVar("--proj-category-underline-ml", "auto");
      setCssVar("--proj-category-underline-mr", "auto");
    } else if (anchor === "right") {
      setCssVar("--proj-category-underline-ml", "auto");
      setCssVar("--proj-category-underline-mr", "0");
    } else if (anchor === "left") {
      setCssVar("--proj-category-underline-ml", "0");
      setCssVar("--proj-category-underline-mr", "auto");
    }
  }

  const activeCategoryTop = page.activeCategoryTop;
  if (activeCategoryTop && typeof activeCategoryTop === "object") {
    setCssVar("--proj-active-category-padding-top", activeCategoryTop.paddingTop);
    setCssVar("--proj-active-category-border-top", activeCategoryTop.borderTop);
  }
}

const CAROUSEL_IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".svg"];

function stripQueryAndHash(path) {
  return String(path || "").split(/[?#]/)[0];
}

function hasImageExtension(path) {
  const clean = stripQueryAndHash(path).toLowerCase();
  return CAROUSEL_IMAGE_EXTS.some(ext => clean.endsWith(ext));
}

function normalizeDirPath(dir) {
  let d = String(dir || "").trim();
  if (!d) return "";
  d = d.replace(/\\/g, "/");
  if (!d.endsWith("/")) d += "/";
  return d;
}

function looksLikeDirectoryPath(path) {
  const p = String(path || "").trim();
  if (!p) return false;
  if (p.endsWith("/") || p.endsWith("\\")) return true;
  if (hasImageExtension(p)) return false;
  return true;
}

function normalizeCarouselEntries(raw) {
  const out = [];
  if (!Array.isArray(raw)) return out;

  raw.forEach(item => {
    if (!item) return;

    if (typeof item === "string") {
      const v = item.trim();
      if (!v) return;
      if (looksLikeDirectoryPath(v)) {
        out.push({ kind: "dir", dir: v });
      } else {
        out.push({ kind: "image", src: v });
      }
      return;
    }

    if (typeof item === "object") {
      if (typeof item.dir === "string" && item.dir.trim()) {
        out.push({ kind: "dir", dir: item.dir.trim() });
        return;
      }
      if (item.src || item.caption) {
        out.push({
          kind: "image",
          src: item.src || "",
          alt: item.alt,
          caption: item.caption
        });
      }
    }
  });

  return out;
}

async function listImagesFromDirectory(dir) {
  const d = normalizeDirPath(dir);
  if (!d) return [];

  try {
    const res = await fetch(d, { cache: "no-store" });
    if (!res.ok) return [];

    const html = await res.text();
    if (!html || !/<a\b/i.test(html)) return [];

    const doc = new DOMParser().parseFromString(html, "text/html");
    const base = res.url && res.url.trim() ? res.url : d;
    const baseUrl = base.endsWith("/") ? base : `${base}/`;

    const urls = new Set();
    doc.querySelectorAll("a[href]").forEach(a => {
      const href = a.getAttribute("href");
      if (!href) return;
      if (href === "../" || href === "..") return;
      if (href.startsWith("#") || href.startsWith("?")) return;
      if (href.endsWith("/")) return;

      let abs;
      try {
        abs = new URL(href, baseUrl).href;
      } catch (e) {
        return;
      }

      const url = new URL(abs);
      if (url.origin !== location.origin) return;
      if (!hasImageExtension(url.pathname)) return;
      urls.add(url.href);
    });

    const list = [...urls].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    return list.map(src => ({ src }));
  } catch (e) {
    return [];
  }
}

async function urlExists(url) {
  try {
    const head = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (head.ok) return true;

    if (head.status === 405 || head.status === 403) {
      const get = await fetch(url, {
        method: "GET",
        headers: { "Range": "bytes=0-0" },
        cache: "no-store"
      });
      return get.ok;
    }
  } catch (e) {
    // ignore
  }
  return false;
}

async function probeNumberedImages(dir, { prefix, start = 1, max = 60, exts } = {}) {
  const d = normalizeDirPath(dir);
  if (!d) return [];

  const extensions = Array.isArray(exts) && exts.length ? exts : ["webp", "jpg", "jpeg", "png"];
  const pref = String(prefix ?? "p");

  const found = [];
  let misses = 0;
  const maxMisses = 10;

  for (let i = start; i <= max; i += 1) {
    let hit = false;
    for (const ext of extensions) {
      const name = pref ? `${pref}${i}.${ext}` : `${i}.${ext}`;
      const url = `${d}${name}`;
      if (await urlExists(url)) {
        found.push({ src: url });
        hit = true;
        break;
      }
    }

    if (hit) {
      misses = 0;
    } else {
      misses += 1;
      if (misses >= maxMisses) break;
    }
  }

  return found;
}

async function resolveDirImages(dir) {
  const viaListing = await listImagesFromDirectory(dir);
  if (viaListing.length) return viaListing;

  const prefixes = ["p", "img", "image", "photo", ""];
  for (const prefix of prefixes) {
    const viaProbe = await probeNumberedImages(dir, { prefix });
    if (viaProbe.length) return viaProbe;
  }

  return [];
}

async function resolveCarouselImages(rawImages) {
  const entries = normalizeCarouselEntries(rawImages);
  if (!entries.length) return [];

  const out = [];
  const seen = new Set();
  const add = (img) => {
    if (!img || !img.src) return;
    const key = String(img.src).trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(img);
  };

  for (const entry of entries) {
    if (entry.kind === "dir") {
      const imgs = await resolveDirImages(entry.dir);
      imgs.forEach(add);
    } else {
      add(entry);
    }
  }

  return out;
}

function buildProjectCard(project, styles, labels, modalEnabled, carouselId) {
  const card = document.createElement("article");
  card.className = "project-card";

  const info = document.createElement("div");
  info.className = "project-info";

  const titleRow = document.createElement("div");
  titleRow.className = "project-title-row";

  const title = document.createElement("h3");
  title.textContent = project.title || "Untitled";
  applyTextStyle(title, styles.projectTitle);
  titleRow.appendChild(title);

  if (project.link && project.link.href) {
    const link = document.createElement("a");
    link.className = "project-link-inline";
    link.href = project.link.href;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = project.link.label || "View project";
    applyTextStyle(link, styles.link);
    titleRow.appendChild(link);
  }

  info.appendChild(titleRow);

  const overviewBlock = document.createElement("div");
  overviewBlock.className = "project-block";

  const overviewLabel = document.createElement("span");
  overviewLabel.className = "section-label";
  overviewLabel.textContent = labels.overview || "Overview";
  applyTextStyle(overviewLabel, styles.sectionLabel);
  overviewBlock.appendChild(overviewLabel);

  if (project.overview) {
    const overviewText = document.createElement("p");
    overviewText.className = "project-overview";
    overviewText.textContent = project.overview;
    applyTextStyle(overviewText, styles.overview);
    overviewBlock.appendChild(overviewText);
  }

  info.appendChild(overviewBlock);

  const methodBlock = document.createElement("div");
  methodBlock.className = "project-block";

  const methodLabel = document.createElement("span");
  methodLabel.className = "section-label";
  methodLabel.textContent = labels.methodology || "Methodology";
  applyTextStyle(methodLabel, styles.sectionLabel);
  methodBlock.appendChild(methodLabel);

  const methodList = document.createElement("ul");
  methodList.className = "project-bullets";
  applyTextStyle(methodList, styles.bullet);
  (project.methodology || []).forEach(line => {
    if (!line) return;
    const li = document.createElement("li");
    li.textContent = line;
    applyTextStyle(li, styles.bullet);
    methodList.appendChild(li);
  });
  methodBlock.appendChild(methodList);
  info.appendChild(methodBlock);

  const resultsBlock = document.createElement("div");
  resultsBlock.className = "project-block";

  const resultsLabel = document.createElement("span");
  resultsLabel.className = "section-label";
  resultsLabel.textContent = labels.results || "Results";
  applyTextStyle(resultsLabel, styles.sectionLabel);
  resultsBlock.appendChild(resultsLabel);

  const resultsList = document.createElement("ul");
  resultsList.className = "project-bullets";
  applyTextStyle(resultsList, styles.bullet);
  (project.findings || []).forEach(line => {
    if (!line) return;
    const li = document.createElement("li");
    li.textContent = line;
    applyTextStyle(li, styles.bullet);
    resultsList.appendChild(li);
  });
  resultsBlock.appendChild(resultsList);
  info.appendChild(resultsBlock);

  const media = document.createElement("div");
  media.className = "project-media";

  const carousel = createCarousel(project.carousel);
  if (carousel) {
    carousel.classList.add("exp-carousel-block");
    media.appendChild(carousel);
  }

  card.appendChild(info);
  card.appendChild(media);
  return card;
}

function renderCarouselSlides(track, config, slides) {
  track.innerHTML = "";

  slides.forEach(img => {
    const slide = document.createElement("div");
    slide.className = "car-slide";

    const media = document.createElement("div");
    media.className = "car-media";

    if (img.placeholder || !img.src) {
      const placeholder = document.createElement("div");
      placeholder.className = "exp-placeholder";
      placeholder.textContent = img.placeholderText || "Add carousel images";
      media.appendChild(placeholder);
    } else {
      const image = document.createElement("img");
      image.src = img.src;
      image.alt = img.alt || "Carousel image";
      media.appendChild(image);
    }

    slide.appendChild(media);

    if (config.showCaptions && img.caption) {
      const caption = document.createElement("div");
      caption.className = "car-caption";
      appendTextWithLinks(caption, img.caption);
      slide.appendChild(caption);
    }

    track.appendChild(slide);
  });
}

function createCarousel(config) {
  if (!config || config.enabled === false) return null;

  const entries = normalizeCarouselEntries(config.images);
  const hasDirEntry = entries.some(entry => entry.kind === "dir");

  const wrap = document.createElement("div");
  wrap.className = "exp-carousel";
  if (config.height) wrap.style.setProperty("--carousel-height", config.height);
  if (config.width) wrap.style.setProperty("--carousel-width", config.width);

  const frame = document.createElement("div");
  frame.className = "car-frame";

  const prev = document.createElement("button");
  prev.className = "car-btn prev";
  prev.type = "button";
  prev.textContent = "<";

  const next = document.createElement("button");
  next.className = "car-btn next";
  next.type = "button";
  next.textContent = ">";

  const viewport = document.createElement("div");
  viewport.className = "car-viewport";

  const track = document.createElement("div");
  track.className = "car-track";

  if (hasDirEntry) {
    renderCarouselSlides(track, config, [{ placeholder: true, placeholderText: "Loading images..." }]);
    prev.style.display = "none";
    next.style.display = "none";
  } else {
    const slides = entries
      .filter(entry => entry.kind === "image" && (entry.src || entry.caption))
      .map(entry => ({ src: entry.src, alt: entry.alt, caption: entry.caption }));
    renderCarouselSlides(track, config, slides.length ? slides : [{ placeholder: true }]);
  }

  viewport.appendChild(track);
  frame.appendChild(prev);
  frame.appendChild(viewport);
  frame.appendChild(next);
  wrap.appendChild(frame);

  const dots = document.createElement("div");
  dots.className = "car-dots";
  if (hasDirEntry) dots.style.display = "none";
  wrap.appendChild(dots);

  if (hasDirEntry) {
    resolveCarouselImages(config.images).then((resolved) => {
      const slides = resolved.length ? resolved : [{ placeholder: true, placeholderText: "No images found." }];
      renderCarouselSlides(track, config, slides);
      prev.style.display = "";
      next.style.display = "";
      dots.style.display = "";
      initCarousel(wrap);
    }).catch(() => {
      renderCarouselSlides(track, config, [{ placeholder: true, placeholderText: "Could not load images." }]);
      prev.style.display = "";
      next.style.display = "";
      dots.style.display = "";
      initCarousel(wrap);
    });
  } else {
    initCarousel(wrap);
  }
  return wrap;
}

function initCarousel(wrapper) {
  const track = $(".car-track", wrapper);
  const slides = [...wrapper.querySelectorAll(".car-slide")];
  const prev = $(".car-btn.prev", wrapper);
  const next = $(".car-btn.next", wrapper);
  const dots = $(".car-dots", wrapper);

  let index = 0;

  const update = () => {
    track.style.transform = `translateX(${-index * 100}%)`;
    if (dots) {
      [...dots.children].forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
      });
    }
  };

  if (slides.length <= 1) {
    if (prev) prev.style.display = "none";
    if (next) next.style.display = "none";
    if (dots) dots.style.display = "none";
    return;
  }

  if (dots) {
    dots.innerHTML = "";
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "car-dot";
      dot.type = "button";
      dot.addEventListener("click", () => {
        index = i;
        update();
      });
      dots.appendChild(dot);
    });
  }

  if (prev) {
    prev.addEventListener("click", () => {
      index = (index - 1 + slides.length) % slides.length;
      update();
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      index = (index + 1) % slides.length;
      update();
    });
  }

  update();
}

function buildCategory(category, styles, labels, modalEnabled, index) {
  const categoryId = category.id || `category-${index}`;
  const section = document.createElement("section");
  section.className = `category-block category-${category.id || "generic"}`;
  section.dataset.categoryId = categoryId;

  const head = document.createElement("div");
  head.className = "category-head";

  const title = document.createElement("h2");
  title.textContent = category.title || "Category";
  applyTextStyle(title, styles.categoryTitle);
  head.appendChild(title);

  if (category.subtitle) {
    const subtitle = document.createElement("p");
    subtitle.textContent = category.subtitle;
    applyTextStyle(subtitle, styles.categorySubtitle);
    head.appendChild(subtitle);
  }

  section.appendChild(head);

  const grid = document.createElement("div");
  grid.className = "project-grid";

  (category.projects || []).forEach((project, projectIndex) => {
    const carouselId = `${categoryId}-${projectIndex}`;
    const card = buildProjectCard(project, styles, labels, modalEnabled, carouselId);
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

function setActiveCategory(id, tabsWrap, sectionsWrap) {
  const tabs = [...tabsWrap.querySelectorAll(".tab-btn")];
  const sections = [...sectionsWrap.querySelectorAll(".category-block")];

  tabs.forEach(tab => {
    const active = tab.dataset.target === id;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });

  sections.forEach(section => {
    const active = section.dataset.categoryId === id;
    section.classList.toggle("is-active", active);
  });
}

function buildTabs(categories, defaultKey, tabsWrap, sectionsWrap) {
  tabsWrap.innerHTML = "";
  categories.forEach((category, index) => {
    const id = category.id || `category-${index}`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab-btn";
    btn.setAttribute("role", "tab");
    btn.dataset.target = id;
    btn.textContent = category.title || `Category ${index + 1}`;
    btn.addEventListener("click", () => setActiveCategory(id, tabsWrap, sectionsWrap));
    tabsWrap.appendChild(btn);
  });

  const normalizedDefault = defaultKey ? String(defaultKey).toLowerCase() : "";
  const defaultCategory = categories.find(cat => (cat.key || "").toLowerCase() === normalizedDefault);
  const fallbackId = categories[0]?.id || "category-0";
  setActiveCategory(defaultCategory?.id || fallbackId, tabsWrap, sectionsWrap);
}

function openModal(src, alt, caption) {
  const modal = $("#image-modal");
  const img = $("#image-modal-img");
  const cap = $("#image-modal-caption");

  if (!modal || !img || !cap) return;
  img.src = src || "";
  img.alt = alt || "";
  cap.textContent = caption || "";
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  const modal = $("#image-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function wireModal(closeLabel) {
  const modal = $("#image-modal");
  const closeBtn = $("#image-close");

  if (!modal || !closeBtn) return;
  if (closeLabel) closeBtn.textContent = closeLabel;

  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

(async function init() {
  const data = await loadPageData();
  if (!data) return;

  const styles = (data.page && data.page.styles) ? data.page.styles : {};
  const labels = (data.page && data.page.labels) ? data.page.labels : {};

  const titleEl = $("#page-title");
  const subtitleEl = $("#page-subtitle");

  if (titleEl && data.page?.title) {
    titleEl.textContent = data.page.title;
    applyTextStyle(titleEl, styles.pageTitle);
    document.title = data.page.title;
  }

  if (subtitleEl && data.page?.subtitle) {
    subtitleEl.textContent = data.page.subtitle;
    applyTextStyle(subtitleEl, styles.pageSubtitle);
  }

  applyChromeConfig(data.page);

  const modalEnabled = data.modal?.enabled !== false;
  wireModal(data.modal?.closeLabel || "Close");

  const sectionsWrap = $("#project-sections");
  const tabsWrap = $("#project-tabs");
  if (!sectionsWrap) return;
  sectionsWrap.innerHTML = "";

  const tabVisibility = data.tabs?.visibility || null;
  const categories = [];
  const projectsData = data.projects || {};

  Object.entries(projectsData).forEach(([categoryName, categoryData], index) => {
    if (!categoryData) return;
    if (tabVisibility && Object.prototype.hasOwnProperty.call(tabVisibility, categoryName)) {
      if (tabVisibility[categoryName] === false) return;
    }

    const categoryId = slugify(categoryName) || `category-${index}`;
    const rawProjects = (categoryData && typeof categoryData === "object")
      ? (categoryData.projects || categoryData)
      : {};
    const projectEntries = Object.entries(rawProjects)
      .filter(([key]) => key !== "subtitle");

    const category = {
      id: categoryId,
      key: categoryName,
      title: categoryName,
      subtitle: categoryData.subtitle || "",
      projects: []
    };

    projectEntries.forEach(([projectKey, projectData]) => {
      if (!projectData || typeof projectData !== "object") return;
      const project = { ...projectData };
      if (!project.title) project.title = projectKey;
      category.projects.push(project);
    });

    categories.push(category);
  });

  categories.forEach((category, index) => {
    const section = buildCategory(category, styles, labels, modalEnabled, index);
    sectionsWrap.appendChild(section);
  });

  if (tabsWrap && categories.length) {
    buildTabs(categories, data.tabs?.default, tabsWrap, sectionsWrap);
  } else if (tabsWrap) {
    tabsWrap.innerHTML = "";
  }
})();
