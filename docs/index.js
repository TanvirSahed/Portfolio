(function initCommonNav() {
  const script = document.currentScript || document.querySelector('script[data-nav-json]');
  const jsonPath = script?.dataset?.navJson || "index.json";
  const header = document.querySelector("[data-common-nav]");
  if (!header) return;

  const nameEl = header.querySelector("#nav-name-left");
  const itemsWrap = header.querySelector("#nav-items");

  const NAME_STYLE_VARS = [
    "--nav-name-font",
    "--nav-name-size",
    "--nav-name-weight",
    "--nav-name-letter-spacing",
    "--nav-name-transform",
    "--nav-name-color"
  ];

  function applyNameStyle(style) {
    if (!nameEl) return;

    NAME_STYLE_VARS.forEach(v => nameEl.style.removeProperty(v));
    nameEl.classList.remove("is-logo");

    if (!style) return;

    const cfg = typeof style === "string" ? { variant: style } : style;
    if (!cfg || typeof cfg !== "object") return;

    const variant = String(cfg.variant || "").trim().toLowerCase();
    if (["logo", "jersey", "embroidered"].includes(variant)) {
      nameEl.classList.add("is-logo");
    }

    if (cfg.font) nameEl.style.setProperty("--nav-name-font", cfg.font);
    if (cfg.size) nameEl.style.setProperty("--nav-name-size", cfg.size);
    if (cfg.weight) nameEl.style.setProperty("--nav-name-weight", cfg.weight);
    if (cfg.letterSpacing) nameEl.style.setProperty("--nav-name-letter-spacing", cfg.letterSpacing);
    if (cfg.transform) nameEl.style.setProperty("--nav-name-transform", cfg.transform);
    if (cfg.color) nameEl.style.setProperty("--nav-name-color", cfg.color);
  }

  function renderNav(nav) {
    if (!itemsWrap) return;
    itemsWrap.innerHTML = "";

    if (nameEl) {
      nameEl.textContent = nav?.nameLeft || "";
      nameEl.href = nav?.homeHref || "../home/home.html";
      applyNameStyle(nav?.nameLeftStyle);
    }

    (nav?.items || []).forEach((item) => {
      if (!item?.href || !item?.label) return;
      const a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.label;
      itemsWrap.appendChild(a);
    });
  }

  fetch(jsonPath, { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && data.nav) renderNav(data.nav);
    })
    .catch(() => {
      // leave any existing nav links in place on failure
    });
})();
