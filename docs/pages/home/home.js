const $ = (s) => document.querySelector(s);

// Named font presets for quick switches via JSON
const FONT_PRESETS = {
  modern: "Inter, 'Segoe UI', system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif",
  system: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  classic: "Georgia, 'Times New Roman', serif",
  mono: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace"
};

async function loadHomeJSON() {
  const res = await fetch("home.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load home.json");
  return res.json();
}

function applyTheme(theme) {
  if (!theme) return;
  if (theme.accent) document.documentElement.style.setProperty("--accent", theme.accent);

  const fontPreset = theme.fontPreset || theme.font;
  const fontStack = fontPreset ? (FONT_PRESETS[fontPreset] || fontPreset) : theme.fontFamily;
  if (fontStack) document.documentElement.style.setProperty("--font", fontStack);

  if (theme.containerWidth) document.documentElement.style.setProperty("--container", `${theme.containerWidth}px`);
  if (theme.cardRadius) document.documentElement.style.setProperty("--radius", `${theme.cardRadius}px`);
  if (theme.heroShadow) document.documentElement.style.setProperty("--hero-shadow", theme.heroShadow);
}

function iconSVG(type) {
  // Minimal inline SVG icons (no external libs)
  const icons = {
    github: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5C5.73.5.75 5.6.75 12c0 5.13 3.16 9.48 7.55 11.02.55.1.75-.24.75-.53v-1.88c-3.07.68-3.72-1.2-3.72-1.2-.5-1.3-1.22-1.65-1.22-1.65-.99-.7.08-.69.08-.69 1.1.08 1.68 1.14 1.68 1.14.98 1.72 2.58 1.22 3.21.93.1-.72.38-1.22.69-1.5-2.45-.29-5.02-1.26-5.02-5.6 0-1.24.43-2.25 1.14-3.04-.12-.29-.5-1.46.1-3.05 0 0 .93-.3 3.05 1.16.89-.25 1.84-.38 2.79-.38.95 0 1.9.13 2.79.38 2.12-1.46 3.05-1.16 3.05-1.16.6 1.59.22 2.76.1 3.05.71.79 1.14 1.8 1.14 3.04 0 4.35-2.58 5.31-5.04 5.59.39.35.74 1.04.74 2.1v3.12c0 .3.2.64.76.53C20.1 21.48 23.25 17.13 23.25 12 23.25 5.6 18.27.5 12 .5z"/></svg>`,
    linkedin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.67H9.29V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.62 0 4.29 2.38 4.29 5.47v6.27zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>`,
    facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.87.24-1.46 1.5-1.46H16.7V5c-.3-.04-1.33-.13-2.54-.13-2.52 0-4.24 1.54-4.24 4.37V11H7.3v3h2.62v8h3.58z"/></svg>`
  };
  return icons[type] || icons.github;
}

function renderHero(hero) {
  $("#hero-photo").src = hero.photo || "";
  $("#hero-name").textContent = hero.name || "";
  const statusEl = $("#hero-status");
  if (statusEl) {
    statusEl.textContent = hero.status?.text || "";
    statusEl.style.color = hero.status?.color || "";
    statusEl.style.fontSize = hero.status?.fontSize || "";
    statusEl.style.display = statusEl.textContent ? "" : "none";
  }
  $("#hero-role").textContent = hero.designation || "";
  $("#hero-uni").textContent = hero.universityLine || "";

  const emailA = $("#hero-email");
  emailA.textContent = hero.email || "";
  emailA.href = `mailto:${hero.email || ""}`;

  $("#hero-dept").textContent = hero.departmentLine || "";

  const icons = $("#hero-icons");
  icons.innerHTML = "";
  (hero.social || []).forEach(s => {
    const a = document.createElement("a");
    a.className = "soc";
    a.href = s.url;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.title = s.label || s.type;
    a.innerHTML = iconSVG(s.type);
    icons.appendChild(a);
  });
}

/**
 * splitSummary()
 * Supports:
 * 1) Array-of-strings for readable JSON (short lines).
 *    - Empty string "" => paragraph break.
 *    - Non-empty lines are joined with spaces into a single paragraph.
 * 2) String input (multi-line). Blank lines => paragraph break.
 */
function splitSummary(summary, { preserveLineBreaks = false } = {}) {
  // Preferred: array for readable JSON
  if (Array.isArray(summary)) {
    const out = [];
    let buf = [];

    for (const line of summary) {
      const t = String(line ?? "").trim();
      if (t === "") {
        if (buf.length) out.push(buf.join(" "));
        buf = [];
      } else {
        buf.push(t);
      }
    }
    if (buf.length) out.push(buf.join(" "));
    return out;
  }

  // Fallback: string (supports blank-line paragraphs)
  if (typeof summary === "string") {
    return summary
      .replace(/\r\n/g, "\n")
      .trim()
      .split(/\n\s*\n/g)                           // blank line => new paragraph
      .map(p => {
        const cleaned = preserveLineBreaks ? p.trim() : p.replace(/\n/g, " ").trim();
        return cleaned;
      })
      .filter(Boolean);
  }

  return [];
}


function extractBoldKeywords(text) {
  if (typeof text !== "string") return [];
  const out = [];
  const re = /\*\*(.+?)\*\*/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const kw = String(m[1] ?? "").trim();
    if (kw) out.push(kw);
  }
  return out;
}

function formatInlineText(text, { preserveLineBreaks = false, mode = "bold" } = {}) {
  const escapeHTML = (s) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  let html = escapeHTML(text);
  if (mode === "badge") {
    // Inline badges using **text**
    let badgeIndex = 0;
    html = html.replace(/\*\*(.+?)\*\*/g, (_, content) => {
      badgeIndex += 1;
      const variant = ((badgeIndex - 1) % 6) + 1;
      return `<span class="inline-badge variant-${variant}">${content}</span>`;
    });
  } else if (mode === "bold") {
    html = html.replace(/\*\*(.+?)\*\*/g, (_, content) => `<strong>${content}</strong>`);
  } else if (mode === "plain") {
    html = html.replace(/\*\*(.+?)\*\*/g, (_, content) => content);
  }
  if (preserveLineBreaks) {
    html = html.replace(/\n/g, "<br>");
  }
  return html;
}

function renderAboutKeywords(keywords) {
  const wrap = $("#about-keywords");
  if (!wrap) return;

  const items = Array.isArray(keywords) ? keywords : [];
  if (!items.length) {
    wrap.style.display = "none";
    wrap.innerHTML = "";
    return;
  }

  wrap.style.display = "";
  wrap.innerHTML = "";

  items.forEach((kw, i) => {
    const badge = document.createElement("span");
    const variant = (i % 6) + 1;
    badge.className = `inline-badge variant-${variant}`;
    badge.textContent = kw;
    wrap.appendChild(badge);
  });
}

async function renderAbout(about) {
  $("#about-title").textContent = about.title || "About Me";
  const wrap = $("#about-summary");
  wrap.innerHTML = "";

  if (about?.layout?.maxWidth) {
    wrap.style.setProperty("--about-max-width", about.layout.maxWidth);
  }
  wrap.style.textAlign = about?.layout?.textAlign || "justify";
  if (about?.layout?.textJustify) {
    wrap.style.textJustify = about.layout.textJustify;
  }

  const preserveLines = about?.layout?.preserveLineBreaks === true;
  let paras = splitSummary(about.summary, { preserveLineBreaks: preserveLines });

  // Optional: summaryFile (kept for compatibility)
  const aboutFile = about.textFile || about.summaryFile;
  if (aboutFile) {
    try {
      const res = await fetch(aboutFile, { cache: "no-store" });
      if (res.ok) {
        const txt = await res.text();
        paras = splitSummary(txt, { preserveLineBreaks: preserveLines });
      }
    } catch (e) {
      // fallback to inline summary
    }
  }

  // Render paragraphs
  const keywords = [];
  const seen = new Set();
  paras.forEach(p => {
    extractBoldKeywords(p).forEach(kw => {
      const norm = kw.toLowerCase();
      if (seen.has(norm)) return;
      seen.add(norm);
      keywords.push(kw);
    });

    const el = document.createElement("p");
    el.innerHTML = formatInlineText(p, { preserveLineBreaks: preserveLines, mode: "bold" });
    wrap.appendChild(el);
  });

  renderAboutKeywords(keywords);

  // Optional CTA if present in your HTML/JSON
  const cta = document.querySelector("#about-cta");
  if (cta && about.cta) {
    cta.textContent = about.cta.label || "Read more";
    cta.href = about.cta.href || "about.html";
  }
}

function renderAboutBadges(aboutBadges) {
  const wrap = $("#about-badges");
  if (!wrap) return;
  if (!aboutBadges?.enabled) {
    wrap.style.display = "none";
    return;
  }

  wrap.style.display = "";
  wrap.innerHTML = "";

  (aboutBadges.groups || []).forEach(group => {
    if (group?.type === "divider") {
      const divider = document.createElement("div");
      divider.className = "badge-divider";
      const crest = document.createElement("span");
      crest.className = "badge-crest";
      divider.appendChild(crest);
      wrap.appendChild(divider);
      return;
    }
    if (!group || !group.title || !Array.isArray(group.items)) return;
    const block = document.createElement("div");
    block.className = "badge-group";
    if (group.style === "research") {
      block.classList.add("research-group");
    }

    const title = document.createElement("div");
    title.className = "badge-group-title";
    title.textContent = group.title;
    block.appendChild(title);

    const list = document.createElement("div");
    list.className = "badge-list";
    group.items.forEach(item => {
      if (!item) return;
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = item;
      list.appendChild(badge);
    });
    block.appendChild(list);
    wrap.appendChild(block);
  });
}


function projectCardHTML(p) {
  return `
    <article class="pcard">
      <img src="${p.image || ""}" alt="${(p.title || "").replace(/"/g, "&quot;")}">
      <div class="pbody">
        <div class="ptop">
          <h3 class="ptitle">${p.title || ""}</h3>
          <span class="ptag">${p.tag || ""}</span>
        </div>
        <p class="pdesc">${p.desc || ""}</p>
        <div class="plinks">
          <a href="${p.primaryBtn?.href || "#"}" target="_blank" rel="noreferrer">[${p.primaryBtn?.label || "Portfolio"}]</a>
          <a href="${p.secondaryBtn?.href || "#"}" target="_blank" rel="noreferrer">[${p.secondaryBtn?.label || "Link"}]</a>
        </div>
      </div>
    </article>
  `;
}

function setupCarousel(cards) {
  const track = $("#car-track");
  const dotsWrap = $("#car-dots");

  track.innerHTML = cards.map(projectCardHTML).join("");

  // step = 1 card per click, but show 3 at a time (CSS handles visible count)
  let index = 0;

  const total = cards.length;
  const maxStart = Math.max(0, total - 1); // move 1-by-1
  const starts = Array.from({ length: maxStart + 1 }, (_, i) => i);

  dotsWrap.innerHTML = "";
  starts.forEach(i => {
    const b = document.createElement("button");
    b.className = "dot";
    b.type = "button";
    b.addEventListener("click", () => {
      index = i;
      update();
    });
    dotsWrap.appendChild(b);
  });

  function cardStepPx() {
    const first = track.querySelector(".pcard");
    if (!first) return 0;
    const style = getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap || "14") || 14;
    return first.getBoundingClientRect().width + gap;
  }

  function clampIndex() {
    index = Math.max(0, Math.min(index, starts.length - 1));
  }

  function update() {
    clampIndex();
    const step = cardStepPx();
    track.style.transform = `translateX(${-index * step}px)`;
    [...dotsWrap.children].forEach((d, di) => d.classList.toggle("active", di === index));
  }

  $("#car-prev").addEventListener("click", () => { index -= 1; update(); });
  $("#car-next").addEventListener("click", () => { index += 1; update(); });

  window.addEventListener("resize", () => update());
  update();
}

function renderFeaturedProjects(fp) {
  $("#fp-title").textContent = fp.title || "Featured Projects";
  $("#fp-subtitle").textContent = fp.subtitle || "";

  const viewAll = $("#fp-viewall");
  viewAll.textContent = fp.viewAll?.label || "View all projects";
  viewAll.href = fp.viewAll?.href || "../projects/projects.html";

  setupCarousel(fp.cards || []);
}

function renderEducation(edu) {
  const list = $("#edu-list");
  if (!edu || !list) return;

  $("#edu-title").textContent = edu.title || "Education";
  $("#edu-subtitle").textContent = edu.subtitle || "";

  const layout = edu.layout || {};
  const setVar = (name, value) => {
    if (value) list.style.setProperty(name, value);
  };
  setVar("--edu-gap", layout.gap);
  setVar("--edu-list-pad", layout.listPadding);
  setVar("--edu-item-gap", layout.itemGap);
  setVar("--edu-item-pad", layout.itemPadding);
  setVar("--edu-logo-size", layout.logoSize);
  setVar("--edu-degree-size", layout.degreeSize);
  setVar("--edu-degree-color", layout.degreeColor);
  setVar("--edu-degree-weight", layout.degreeWeight);
  setVar("--edu-period-size", layout.periodSize);
  setVar("--edu-period-color", layout.periodColor);
  setVar("--edu-school-size", layout.schoolSize);
  setVar("--edu-school-color", layout.schoolColor);
  setVar("--edu-location-size", layout.locationSize);
  setVar("--edu-location-color", layout.locationColor);
  setVar("--edu-bg", layout.background);

  const items = edu.items || [];
  list.innerHTML = "";
  if (!items.length) return;

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "edu-item";

    const logo = document.createElement("img");
    logo.className = "edu-logo";
    logo.src = item.logo || "";
    logo.alt = item.degree || "Education";
    row.appendChild(logo);

    const body = document.createElement("div");

    const title = document.createElement("h3");
    title.className = "edu-title";
    title.textContent = item.degree || "";
    body.appendChild(title);

    if (item.period) {
      const period = document.createElement("div");
      period.className = "edu-period";
      period.textContent = item.period;
      body.appendChild(period);
    }

    if (item.school) {
      const school = document.createElement("p");
      school.className = "edu-school";
      school.textContent = item.school;
      body.appendChild(school);
    }

    if (item.location) {
      const location = document.createElement("p");
      location.className = "edu-location";
      location.textContent = item.location;
      body.appendChild(location);
    }

    row.appendChild(body);
    list.appendChild(row);
  });
}

function renderAwards(aw) {
  $("#aw-title").textContent = aw.title || "Awards & Certifications";
  $("#aw-subtitle").textContent = aw.subtitle || "";

  const items = aw.items || [];
  const track = $("#award-track");
  const prev = $("#aw-prev");
  const next = $("#aw-next");

  if (!track || !prev || !next) return;
  if (!items.length) {
    prev.style.display = "none";
    next.style.display = "none";
    return;
  }

  track.innerHTML = "";
  const cards = items.map(item => {
    const card = document.createElement("a");
    card.className = "award-card";
    const href = item.href || "#";
    card.href = href;
    card.target = href && href !== "#" ? "_blank" : "_self";
    card.rel = href && href !== "#" ? "noreferrer" : "";

    const img = document.createElement("img");
    img.src = item.thumb || "";
    img.alt = item.title || "Certificate";

    const cap = document.createElement("div");
    cap.className = "cap";
    cap.textContent = item.title || "";

    card.appendChild(img);
    card.appendChild(cap);
    track.appendChild(card);
    return card;
  });

  let index = 0;
  const update = () => {
    cards.forEach((card, i) => {
      let diff = i - index;
      if (diff > items.length / 2) diff -= items.length;
      if (diff < -items.length / 2) diff += items.length;

      card.classList.remove("is-active", "is-prev", "is-next", "is-prev2", "is-next2", "is-hidden");
      if (diff === 0) card.classList.add("is-active");
      else if (diff === -1) card.classList.add("is-prev");
      else if (diff === 1) card.classList.add("is-next");
      else if (diff === -2) card.classList.add("is-prev2");
      else if (diff === 2) card.classList.add("is-next2");
      else card.classList.add("is-hidden");
    });
  };

  prev.onclick = () => { index = (index - 1 + items.length) % items.length; update(); };
  next.onclick = () => { index = (index + 1) % items.length; update(); };

  if (items.length < 2) {
    prev.style.display = "none";
    next.style.display = "none";
  }

  let timer;
  const autoMs = aw.autoScrollMs || 0;
  const startAuto = () => {
    if (!autoMs || items.length < 2) return;
    stopAuto();
    timer = setInterval(() => { index = (index + 1) % items.length; update(); }, autoMs);
  };
  const stopAuto = () => { if (timer) clearInterval(timer); };

  const wrap = document.querySelector(".award-carousel");
  if (wrap) {
    wrap.addEventListener("mouseenter", stopAuto);
    wrap.addEventListener("mouseleave", startAuto);
  }

  update();
  startAuto();
}

function renderFooter(foot) {
  if (!foot) return;
  const root = document.querySelector(".site-footer");
  if (root && foot.bg) root.style.setProperty("--footer-bg", foot.bg);
  const layout = foot.layout || {};
  const setVar = (name, value) => { if (root && value) root.style.setProperty(name, value); };
  setVar("--foot-pad", layout.padding);
  setVar("--foot-body-gap", layout.bodyGap);
  setVar("--foot-top-gap", layout.topGap);
  setVar("--foot-top-min", layout.topMinWidth);
  setVar("--foot-head-size", layout.headSize);
  setVar("--foot-text-size", layout.textSize);
  setVar("--foot-mid-cols", layout.midColumns);
  setVar("--foot-mid-gap", layout.midGap);
  setVar("--foot-map-height", layout.mapHeight);
  setVar("--foot-btn-width", layout.buttonWidth);
  setVar("--foot-bottom-head-size", layout.bottomHeadSize);
  setVar("--foot-bottom-text-size", layout.bottomTextSize);

  const address = $("#foot-address");
  const contact = $("#foot-contact");
  const hours = $("#foot-hours");
  const map = $("#foot-map");
  const title = $("#foot-title");
  const desc = $("#foot-desc");

  title.textContent = foot.title || "";
  desc.textContent = foot.description || "";

  address.innerHTML = (foot.address || []).map(line => `<div>${line}</div>`).join("");

  const c = foot.contact || {};
  const contactLines = [];
  if (c.phone) contactLines.push(`Phone: ${c.phone}`);
  if (c.email) contactLines.push(`Email: <a href="mailto:${c.email}">${c.email}</a>`);
  if (c.altEmail) contactLines.push(`Alt: <a href="mailto:${c.altEmail}">${c.altEmail}</a>`);
  contact.innerHTML = contactLines.map(line => `<div>${line}</div>`).join("");

  hours.innerHTML = (foot.officeHours || []).map(h => `<div>${h.label || ""} ${h.value || ""}</div>`).join("");

  if (map) {
    if (foot.map?.embed) {
      map.innerHTML = foot.map.embed;
    } else if (foot.map?.image) {
      map.innerHTML = `<img src="${foot.map.image}" alt="Map">`;
    }
  }

  // contact form mailto
  const form = $("#foot-form");
  if (form) {
    const btn = $("#foot-send");
    if (foot.form?.buttonLabel) btn.textContent = foot.form.buttonLabel;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = ($("#foot-name").value || "").trim();
      const email = ($("#foot-email").value || "").trim();
      const message = ($("#foot-message").value || "").trim();

      const to = foot.form?.recipient || "";
      const subject = encodeURIComponent(foot.form?.subject || "Website inquiry");
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      if (to) {
        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
      }
    });
  }
}

async function fetchGitHubEvents(username, maxItems = 8) {
  const url = `https://api.github.com/users/${encodeURIComponent(username)}/events/public`;
  const res = await fetch(url, { headers: { "Accept": "application/vnd.github+json" } });
  if (!res.ok) throw new Error("GitHub API error");
  const events = await res.json();

  const mapped = [];
  for (const e of events) {
    if (mapped.length >= maxItems) break;
    const repo = e.repo?.name || "";
    const date = new Date(e.created_at).toLocaleString();
    let title = e.type;
    let msg = "";

    if (e.type === "PushEvent") {
      title = `Pushed to ${repo}`;
      const commits = e.payload?.commits || [];
      msg = commits.slice(0, 2).map(c => `• ${c.message}`).join("\n");
    } else if (e.type === "CreateEvent") {
      title = `Created ${e.payload?.ref_type || "item"} in ${repo}`;
      msg = e.payload?.ref ? `Ref: ${e.payload.ref}` : "";
    } else if (e.type === "PullRequestEvent") {
      title = `${e.payload?.action || "PR"}: ${repo}`;
      msg = e.payload?.pull_request?.title || "";
    } else if (e.type === "IssuesEvent") {
      title = `${e.payload?.action || "Issue"}: ${repo}`;
      msg = e.payload?.issue?.title || "";
    } else {
      title = `${e.type} · ${repo}`;
    }

    mapped.push({ title, msg, date, repo });
  }

  return mapped;
}

async function renderGitHub(gh) {
  const sec = $("#gh-section");
  if (!gh?.enabled) return;

  $("#gh-title").textContent = gh.title || "Recent GitHub Activity";
  sec.style.display = "";

  try {
    const items = await fetchGitHubEvents(gh.username, gh.maxItems || 8);
    $("#gh-loading").style.display = "none";
    const list = $("#gh-list");
    list.innerHTML = "";
    items.forEach(it => {
      const div = document.createElement("div");
      div.className = "gh-item";
      div.innerHTML = `
        <div class="t">${it.title}</div>
        ${it.msg ? `<div class="m">${it.msg.replace(/\n/g, "<br>")}</div>` : ""}
        <div class="d">${it.date}</div>
      `;
      list.appendChild(div);
    });
  } catch (e) {
    $("#gh-loading").textContent = "GitHub activity could not be loaded right now.";
  }
}

function renderCoding(coding) {
  const sec = $("#coding-section");
  if (!coding?.enabled) return;
  sec.style.display = "";
  $("#coding-title").textContent = coding.title || "Problem Solving";
  $("#coding-note").textContent = coding.note || "";
}

function setFooter() {
  const el = $("#last-updated");
  const d = new Date();
  el.textContent = `Last updated: ${d.toISOString().slice(0,10)}`;
}

(async function init(){
  const data = await loadHomeJSON();

  applyTheme(data.theme);
  renderHero(data.hero);
  await renderAbout(data.about);   // await because renderAbout may fetch summaryFile
  renderAboutBadges(data.aboutBadges);
  renderFeaturedProjects(data.featuredProjects);
  renderEducation(data.education);
  renderAwards(data.awards);

  await renderGitHub(data.github);
  renderCoding(data.coding);
  renderFooter(data.footer);

  setFooter();
})();
