const $ = (sel, root = document) => root.querySelector(sel);

async function loadExperienceData() {
  const res = await fetch("experience.json", { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;
  const map = {
    bg: "--bg",
    text: "--text",
    muted: "--muted",
    accent: "--accent",
    line: "--line",
    soft: "--soft",
    fontBody: "--font-body",
    fontUi: "--font-ui",
    container: "--container",
    imageRadius: "--image-radius",
    imageBorder: "--image-border",
    sectionGap: "--section-gap"
  };

  Object.entries(map).forEach(([key, cssVar]) => {
    if (theme[key]) root.style.setProperty(cssVar, theme[key]);
  });
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
      setCssVar("--exp-tabs-frame-bg", "transparent");
      setCssVar("--exp-tabs-frame-border", "1px solid transparent");
      setCssVar("--exp-tabs-frame-shadow", "none");
      setCssVar("--exp-tabs-frame-radius", "0px");
      setCssVar("--exp-tabs-frame-padding", "0px");
    } else {
      setCssVar("--exp-tabs-frame-bg", tabsFrame.background);
      setCssVar("--exp-tabs-frame-border", tabsFrame.border);
      setCssVar("--exp-tabs-frame-shadow", tabsFrame.shadow);
      setCssVar("--exp-tabs-frame-radius", tabsFrame.radius);
      setCssVar("--exp-tabs-frame-padding", tabsFrame.padding);
    }

    setCssVar("--exp-tabs-frame-margin-bottom", tabsFrame.marginBottom);
  }

  const groupUnderline = page.groupUnderline;
  if (groupUnderline && typeof groupUnderline === "object") {
    setCssVar("--exp-group-underline-display", groupUnderline.enabled === false ? "none" : "block");
    setCssVar("--exp-group-underline-color", groupUnderline.color);
    setCssVar("--exp-group-underline-thickness", groupUnderline.thickness);
    setCssVar("--exp-group-underline-length", groupUnderline.length);
    setCssVar("--exp-group-underline-radius", groupUnderline.radius);
    setCssVar("--exp-group-underline-gap", groupUnderline.gap);

    const anchor = normalizeAnchor(groupUnderline.anchor);
    if (anchor === "center") {
      setCssVar("--exp-group-underline-ml", "auto");
      setCssVar("--exp-group-underline-mr", "auto");
    } else if (anchor === "right") {
      setCssVar("--exp-group-underline-ml", "auto");
      setCssVar("--exp-group-underline-mr", "0");
    } else if (anchor === "left") {
      setCssVar("--exp-group-underline-ml", "0");
      setCssVar("--exp-group-underline-mr", "auto");
    }
  }

  const tabButtons = page.tabButtons;
  if (tabButtons && typeof tabButtons === "object") {
    setCssVar("--exp-tab-btn-width", tabButtons.width);
    setCssVar("--exp-tab-btn-height", tabButtons.height);
    setCssVar("--exp-tab-btn-radius", tabButtons.radius || tabButtons.roundness);
    setCssVar("--exp-tab-btn-active-bg", tabButtons.activeBackground || tabButtons.activeColor || tabButtons.color || tabButtons.colour);
    setCssVar("--exp-tab-btn-active-text", tabButtons.activeTextColor || tabButtons.textColor || tabButtons.textColour);
  }
}

function applyTextStyles(el, style) {
  if (!el || !style) return;
  if (style.color) el.style.color = style.color;
  if (style.size) el.style.fontSize = style.size;
  if (style.font) el.style.fontFamily = style.font;
  if (style.weight) el.style.fontWeight = style.weight;
  if (style.align) el.style.textAlign = style.align;
  if (style.lineHeight) el.style.lineHeight = style.lineHeight;
  if (style.letterSpacing) el.style.letterSpacing = style.letterSpacing;
  if (style.maxWidth) el.style.maxWidth = style.maxWidth;
  if (style.offsetX || style.offsetY) {
    el.style.position = "relative";
    if (style.offsetX) el.style.left = style.offsetX;
    if (style.offsetY) el.style.top = style.offsetY;
  }
}

function createTitleModule(config, level = "h2") {
  if (!config || config.enabled === false || !config.text) return null;
  const el = document.createElement(level);
  el.className = "exp-title";
  appendTextWithLinks(el, config.text);
  applyTextStyles(el, config);
  return el;
}

function normalizeValue(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return value;
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

function createSubtitleModule(config) {
  if (!config || config.enabled === false || !Array.isArray(config.items) || !config.items.length) return null;

  const wrap = document.createElement("div");
  wrap.className = "exp-meta";
  if (config.align) wrap.style.textAlign = config.align;
  if (config.offsetX || config.offsetY) {
    wrap.style.position = "relative";
    if (config.offsetX) wrap.style.left = config.offsetX;
    if (config.offsetY) wrap.style.top = config.offsetY;
  }

  const labelStyle = config.labelStyle || {};
  const valueStyle = config.valueStyle || {};

  const createLinkIcon = () => {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.classList.add("meta-link-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    const path1 = document.createElementNS(svgNS, "path");
    path1.setAttribute("d", "M14 3h7v7");

    const path2 = document.createElementNS(svgNS, "path");
    path2.setAttribute("d", "M10 14L21 3");

    const path3 = document.createElementNS(svgNS, "path");
    path3.setAttribute("d", "M21 14v7a2 2 0 0 1-2 2h-7");

    const path4 = document.createElementNS(svgNS, "path");
    path4.setAttribute("d", "M3 10v11a2 2 0 0 0 2 2h7");

    svg.appendChild(path1);
    svg.appendChild(path2);
    svg.appendChild(path3);
    svg.appendChild(path4);
    return svg;
  };

  config.items.forEach(item => {
    if (!item || !item.label) return;

    const row = document.createElement("div");
    row.className = "meta-row";

    const label = document.createElement("span");
    label.className = "meta-label";
    appendTextWithBreaks(label, item.label);
    label.appendChild(document.createTextNode(":"));
    applyTextStyles(label, labelStyle);

    const valueWrap = document.createElement("div");
    valueWrap.className = "meta-value";
    applyTextStyles(valueWrap, valueStyle);

    const type = (item.type || "text").toLowerCase();
    const value = normalizeValue(item.value, "");

    if (type === "list" || type === "unordered" || type === "bullet") {
      const ul = document.createElement("ul");
      const items = Array.isArray(value) ? value : [value];
      items.filter(Boolean).forEach(entry => {
        const li = document.createElement("li");
        if (typeof entry === "string") {
          appendTextWithLinks(li, entry);
        } else if (entry && typeof entry === "object") {
          const label = entry.label || entry.text || entry.value || "";
          const href = entry.href || entry.url || "";
          if (label && isSafeHref(href)) {
            const a = document.createElement("a");
            a.className = "meta-inline-link";
            a.href = href;
            a.target = entry.target || "_blank";
            a.rel = "noreferrer";
            appendTextWithBreaks(a, label);
            li.appendChild(a);
          } else {
            appendTextWithLinks(li, label);
          }
        } else {
          appendTextWithLinks(li, String(entry));
        }
        ul.appendChild(li);
      });
      valueWrap.appendChild(ul);
    } else if (type === "ordered") {
      const ol = document.createElement("ol");
      const items = Array.isArray(value) ? value : [value];
      items.filter(Boolean).forEach(entry => {
        const li = document.createElement("li");
        if (typeof entry === "string") {
          appendTextWithLinks(li, entry);
        } else if (entry && typeof entry === "object") {
          const label = entry.label || entry.text || entry.value || "";
          const href = entry.href || entry.url || "";
          if (label && isSafeHref(href)) {
            const a = document.createElement("a");
            a.className = "meta-inline-link";
            a.href = href;
            a.target = entry.target || "_blank";
            a.rel = "noreferrer";
            appendTextWithBreaks(a, label);
            li.appendChild(a);
          } else {
            appendTextWithLinks(li, label);
          }
        } else {
          appendTextWithLinks(li, String(entry));
        }
        ol.appendChild(li);
      });
      valueWrap.appendChild(ol);
    } else {
      if (item.href) {
        const link = document.createElement("a");
        link.className = "meta-link";
        link.href = item.href;
        link.target = item.target || "_blank";
        link.rel = "noreferrer";
        appendTextWithBreaks(link, Array.isArray(value) ? value.filter(Boolean).join(", ") : value);
        link.appendChild(createLinkIcon());
        valueWrap.appendChild(link);
      } else {
        const span = document.createElement("span");
        appendTextWithLinks(span, Array.isArray(value) ? value.filter(Boolean).join(", ") : value);
        valueWrap.appendChild(span);
      }
    }

    row.appendChild(label);
    row.appendChild(valueWrap);
    wrap.appendChild(row);
  });

  return wrap;
}

function createDescription(config) {
  if (!config || config.enabled === false || config.value === undefined || config.value === null) return null;

  const wrap = document.createElement("div");
  wrap.className = "exp-desc";
  applyTextStyles(wrap, config);

  const type = (config.type || "text").toLowerCase();
  const value = normalizeValue(config.value, "");

  if (type === "list" || type === "unordered" || type === "bullet") {
    const ul = document.createElement("ul");
    const items = Array.isArray(value) ? value : [value];
    items.filter(Boolean).forEach(entry => {
      const li = document.createElement("li");
      if (typeof entry === "string") {
        appendTextWithLinks(li, entry);
      } else if (entry && typeof entry === "object") {
        const label = entry.label || entry.text || entry.value || "";
        const href = entry.href || entry.url || "";
        if (label && isSafeHref(href)) {
          const a = document.createElement("a");
          a.className = "meta-inline-link";
          a.href = href;
          a.target = entry.target || "_blank";
          a.rel = "noreferrer";
          appendTextWithBreaks(a, label);
          li.appendChild(a);
        } else {
          appendTextWithLinks(li, label);
        }
      } else {
        appendTextWithLinks(li, String(entry));
      }
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
  } else if (type === "ordered") {
    const ol = document.createElement("ol");
    const items = Array.isArray(value) ? value : [value];
    items.filter(Boolean).forEach(entry => {
      const li = document.createElement("li");
      if (typeof entry === "string") {
        appendTextWithLinks(li, entry);
      } else if (entry && typeof entry === "object") {
        const label = entry.label || entry.text || entry.value || "";
        const href = entry.href || entry.url || "";
        if (label && isSafeHref(href)) {
          const a = document.createElement("a");
          a.className = "meta-inline-link";
          a.href = href;
          a.target = entry.target || "_blank";
          a.rel = "noreferrer";
          appendTextWithBreaks(a, label);
          li.appendChild(a);
        } else {
          appendTextWithLinks(li, label);
        }
      } else {
        appendTextWithLinks(li, String(entry));
      }
      ol.appendChild(li);
    });
    wrap.appendChild(ol);
  } else {
    const p = document.createElement("p");
    appendTextWithLinks(p, value);
    wrap.appendChild(p);
  }

  return wrap;
}

function createLinks(config) {
  if (!config || config.enabled === false || !Array.isArray(config.items) || !config.items.length) return null;

  const wrap = document.createElement("div");
  wrap.className = "exp-links";

  config.items.forEach(link => {
    if (!link || !link.href || !link.label) return;
    const a = document.createElement("a");
    a.className = "exp-link";
    a.href = link.href;
    a.target = link.target || "_blank";
    a.rel = "noreferrer";
    appendTextWithBreaks(a, link.label);
    wrap.appendChild(a);
  });

  return wrap;
}

function createImage(config) {
  if (!config || config.enabled === false) return null;

  const figure = document.createElement("figure");
  figure.className = "exp-image";

  if (config.align) {
    const map = { left: "flex-start", center: "center", right: "flex-end" };
    figure.style.alignSelf = map[config.align] || "stretch";
  }

  if (config.squareSize) {
    figure.style.setProperty("--image-width", config.squareSize);
    figure.style.setProperty("--image-height", config.squareSize);
  } else {
    if (config.width) figure.style.setProperty("--image-width", config.width);
    if (config.height) figure.style.setProperty("--image-height", config.height);
  }
  if (config.fit) figure.style.setProperty("--image-fit", config.fit);
  if (config.radius) figure.style.setProperty("--image-radius", config.radius);
  if (config.border) figure.style.setProperty("--image-border", config.border);

  if (config.src) {
    const img = document.createElement("img");
    img.src = config.src;
    img.alt = config.alt || "Experience image";
    figure.appendChild(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "exp-placeholder";
    placeholder.textContent = "Add image";
    figure.appendChild(placeholder);
  }

  if (config.caption) {
    const cap = document.createElement("figcaption");
    cap.className = "exp-caption";
    appendTextWithLinks(cap, config.caption);
    figure.appendChild(cap);
  }

  return figure;
}

function normalizeCarouselEntries(raw) {
  const out = [];
  if (!Array.isArray(raw)) return out;

  raw.forEach(item => {
    if (!item) return;

    if (typeof item === "string") {
      const v = item.trim();
      if (v) out.push({ src: v });
      return;
    }

    if (typeof item === "object" && (item.src || item.caption)) {
      out.push({ src: item.src || "", alt: item.alt, caption: item.caption });
    }
  });

  return out;
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

  const slides = entries.filter(entry => entry.src || entry.caption);
  renderCarouselSlides(track, config, slides.length ? slides : [{ placeholder: true }]);

  viewport.appendChild(track);
  frame.appendChild(prev);
  frame.appendChild(viewport);
  frame.appendChild(next);
  wrap.appendChild(frame);

  const dots = document.createElement("div");
  dots.className = "car-dots";
  wrap.appendChild(dots);

  initCarousel(wrap);
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

function createSection(section) {
  if (!section || section.enabled === false) return null;

  const wrapper = document.createElement("section");
  wrapper.className = "exp-section";

  const layout = section.layout || {};
  if (layout.imagePosition === "left") wrapper.classList.add("image-left");
  if (layout.gap) wrapper.style.setProperty("--section-gap", layout.gap);

  const row = document.createElement("div");
  row.className = "exp-row";

  const textCol = document.createElement("div");
  textCol.className = "exp-text";

  const mediaCol = document.createElement("div");
  mediaCol.className = "exp-media";

  const title = createTitleModule(section.title, "h3");
  if (title) textCol.appendChild(title);

  const subtitle = createSubtitleModule(section.subtitle);
  if (subtitle) textCol.appendChild(subtitle);

  const description = createDescription(section.description);
  if (description) textCol.appendChild(description);

  const links = createLinks(section.links);
  if (links && section.links.placement === "belowDescription") {
    textCol.appendChild(links);
  }

  const image = createImage(section.image);
  if (image) mediaCol.appendChild(image);

  if (links && section.links.placement === "belowImage") {
    mediaCol.appendChild(links);
  }

  const carousel = createCarousel(section.carousel);
  if (carousel) {
    carousel.classList.add("exp-carousel-block");
  }

  row.appendChild(textCol);
  if (mediaCol.children.length) row.appendChild(mediaCol);
  wrapper.appendChild(row);

  if (links && section.links.placement === "belowSection") {
    wrapper.appendChild(links);
  }

  if (carousel) {
    wrapper.appendChild(carousel);
  }

  return wrapper;
}

(async function init() {
  const data = await loadExperienceData();
  if (!data) return;

  applyTheme(data.theme);
  applyChromeConfig(data.page);

  const title = data.page?.title || { text: data.title };
  const subtitle = data.page?.subtitle;

  const titleEl = $("#page-title");
  if (titleEl && title?.text) {
    titleEl.textContent = "";
    appendTextWithLinks(titleEl, title.text);
    applyTextStyles(titleEl, title);
  }

  if (subtitle && $("#page-subtitle")) {
    const subtitleEl = $("#page-subtitle");
    subtitleEl.textContent = "";
    appendTextWithLinks(subtitleEl, subtitle.text || "");
    applyTextStyles(subtitleEl, subtitle);
  }

  if (title?.text) document.title = title.text;

  const list = $("#exp-list");
  if (!list) return;

  const sections = Array.isArray(data.sections) ? data.sections : [];
  const groups = Array.isArray(data.groups) && data.groups.length
    ? data.groups
    : [{ id: "all", title: "Experience" }];

  list.innerHTML = "";

  const renderedGroups = [];
  groups.forEach(group => {
    if (!group || !group.id) return;

    const ids = Array.isArray(group.include) && group.include.length
      ? group.include
      : (Array.isArray(group.includes) && group.includes.length ? group.includes : [group.id]);

    const items = sections.filter(section => {
      if (!section || section.enabled === false) return false;
      const g = section.group || "other";
      return ids.includes(g);
    });

    const groupWrap = document.createElement("section");
    groupWrap.className = "exp-group";
    groupWrap.id = `exp-group-${group.id}`;
    groupWrap.dataset.groupId = group.id;

    const head = document.createElement("div");
    head.className = "exp-group-head";

    const heading = document.createElement("h2");
    heading.className = "exp-group-title";
    appendTextWithBreaks(heading, group.title || group.label || group.id);
    head.appendChild(heading);

    const rule = document.createElement("div");
    rule.className = "exp-group-rule";
    head.appendChild(rule);

    const groupList = document.createElement("div");
    groupList.className = "exp-group-list";

    items.forEach(section => {
      const node = createSection(section);
      if (node) groupList.appendChild(node);
    });

    groupWrap.appendChild(head);
    groupWrap.appendChild(groupList);
    list.appendChild(groupWrap);
    renderedGroups.push({ group, node: groupWrap });
  });

  // Fallback: render everything if no groups matched.
  if (!renderedGroups.length) {
    sections.forEach(section => {
      const node = createSection(section);
      if (node) list.appendChild(node);
    });
  }

  const tabsWrap = $("#exp-tabs");
  const tabsShell = $("#exp-tabs-shell");
  if (tabsWrap && renderedGroups.length) {
    if (tabsShell) tabsShell.style.display = "";
    const setActiveGroup = (id) => {
      const tabs = [...tabsWrap.querySelectorAll(".tab-btn")];
      const groups = [...list.querySelectorAll(".exp-group")];

      tabs.forEach(tab => {
        const active = tab.dataset.target === id;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });

      groups.forEach(group => {
        const active = group.dataset.groupId === id;
        group.classList.toggle("is-active", active);
      });
    };

    tabsWrap.innerHTML = "";
    renderedGroups.forEach(({ group }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tab-btn";
      btn.setAttribute("role", "tab");
      btn.dataset.target = group.id;
      appendTextWithBreaks(btn, group.navLabel || group.title || group.label || group.id);
      btn.addEventListener("click", () => setActiveGroup(group.id));
      tabsWrap.appendChild(btn);
    });

    setActiveGroup(renderedGroups[0].group.id);
  } else if (tabsWrap) {
    tabsWrap.innerHTML = "";
    if (tabsShell) tabsShell.style.display = "none";
  }
})();
