// 천안독서모임 아카이브 — 데이터 로딩 & 렌더링

const SPINE_COLORS = ["#4a6350", "#6b2f34", "#33455a", "#8a6a2f", "#8a4a2f", "#3d5c5a"];

function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return SPINE_COLORS[Math.abs(hash) % SPINE_COLORS.length];
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

async function loadData() {
  const apiUrl = (window.CONFIG && window.CONFIG.API_URL) || "";
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("네트워크 응답 오류: " + res.status);
      const data = await res.json();
      return { books: data.books || [], meetings: data.meetings || [], live: true };
    } catch (err) {
      console.warn("Apps Script API 로딩 실패, 샘플 데이터로 대체합니다:", err);
    }
  }
  return { books: window.SAMPLE_DATA.books, meetings: window.SAMPLE_DATA.meetings, live: false };
}

function renderShelf(books, meetings) {
  const grid = document.getElementById("shelf-grid");
  const countEl = document.getElementById("book-count");
  if (!grid) return;

  if (countEl) countEl.textContent = `총 ${books.length}권`;

  if (books.length === 0) {
    grid.innerHTML = `<p class="state-msg">아직 등록된 책이 없습니다. 시트에 첫 책을 추가해보세요.</p>`;
    return;
  }

  const meetingByBook = {};
  meetings.forEach(m => { meetingByBook[m.bookId] = m; });

  grid.innerHTML = books.map(b => {
    const color = hashColor(b.title || b.id || "");
    const rating = b.rating != null && b.rating !== "" ? `★ ${b.rating}` : "";
    const meeting = meetingByBook[b.meetingId];
    return `
      <article class="spine-card">
        <div class="spine-bar" style="background:${color}">
          ${rating ? `<span class="rating">${escapeHtml(rating)}</span>` : ""}
        </div>
        <h3>${escapeHtml(b.title)}</h3>
        <p class="author">${escapeHtml(b.author)}</p>
        <p class="oneliner">${escapeHtml(b.oneLiner || "")}</p>
        ${meeting ? `<span class="meta-tag">no. ${escapeHtml(meeting.id)}</span>` : ""}
      </article>
    `;
  }).join("");
}

function renderCatalog(books, meetings) {
  const grid = document.getElementById("catalog-grid");
  const countEl = document.getElementById("meeting-count");
  if (!grid) return;

  if (countEl) countEl.textContent = `총 ${meetings.length}회`;

  if (meetings.length === 0) {
    grid.innerHTML = `<p class="state-msg">아직 기록된 모임이 없습니다. 시트에 첫 회차를 추가해보세요.</p>`;
    return;
  }

  const bookById = {};
  books.forEach(b => { bookById[b.id] = b; });

  const sorted = [...meetings].sort((a, b) => (a.id < b.id ? 1 : -1));

  grid.innerHTML = sorted.map(m => {
    const book = bookById[m.bookId] || {};
    const attendees = Array.isArray(m.attendees) ? m.attendees : String(m.attendees || "").split(",").map(s => s.trim()).filter(Boolean);
    const topics = Array.isArray(m.topics) ? m.topics : String(m.topics || "").split(",").map(s => s.trim()).filter(Boolean);
    const stampParts = String(m.date || "").split(".");
    const stampLine1 = stampParts.length >= 2 ? `${stampParts[1]}.${stampParts[2] || ""}` : (m.date || "");
    const stampLine2 = stampParts[0] || "";

    return `
      <article class="catalog-card">
        <p class="catalog-no">no. ${escapeHtml(m.id)} · ${escapeHtml((book.id || "").toUpperCase())}</p>
        <h3>${escapeHtml(book.title || "(제목 없음)")}</h3>
        <p class="book-author">${escapeHtml(book.author || "")}</p>
        ${m.keyQuote ? `<p class="catalog-quote">“${escapeHtml(m.keyQuote)}”</p>` : ""}
        ${topics.length ? `<ul class="catalog-topics">${topics.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>` : ""}
        <div class="catalog-footer">
          <span>참석 ${attendees.length}명 · ${escapeHtml(attendees.join(", "))}</span>
          <span class="catalog-stamp">${escapeHtml(stampLine1)}<br>${escapeHtml(stampLine2)}</span>
        </div>
      </article>
    `;
  }).join("");
}

(async function init() {
  const { books, meetings } = await loadData();
  renderShelf(books, meetings);
  renderCatalog(books, meetings);

  const heroBookCount = document.getElementById("hero-book-count");
  const heroMeetingCount = document.getElementById("hero-meeting-count");
  if (heroBookCount) heroBookCount.textContent = books.length;
  if (heroMeetingCount) heroMeetingCount.textContent = meetings.length;
})();
