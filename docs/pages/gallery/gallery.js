async function loadPageData() {
  const res = await fetch("gallery.json", { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

(async function init() {
  const data = await loadPageData();
  if (!data) return;

  const titleEl = document.querySelector("#page-title");
  if (titleEl && data.title) titleEl.textContent = data.title;

  const noteEl = document.querySelector("#page-note");
  if (noteEl && data.note) noteEl.textContent = data.note;

  if (data.title) document.title = data.title;
})();
