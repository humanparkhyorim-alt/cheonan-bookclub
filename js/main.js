// ── 탭 전환 ──
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ── 라이트박스 ──
const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
lightbox.innerHTML = `<button class="lightbox-close">×</button><img src="" alt="" />`;
document.body.appendChild(lightbox);
lightbox.querySelector('.lightbox-close').onclick = () => lightbox.classList.remove('open');
lightbox.onclick = (e) => { if (e.target === lightbox) lightbox.classList.remove('open'); };

function openLightbox(src) {
  lightbox.querySelector('img').src = src;
  lightbox.classList.add('open');
}

// ── Apps Script에서 데이터 fetch ──
async function fetchSheet(sheet) {
  const url = `${APPS_SCRIPT_URL}?sheet=${sheet}`;
  const res = await fetch(url);
  const data = await res.json();
  return data;
}

const KAKAO_API_KEY = "3bea7d660e89d4d70ff023f81cea0988";

// ── 카카오 책 검색 ──
async function fetchBookCover(title) {
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(title)}&size=1`,
      { headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` } }
    );
    const data = await res.json();
    if (data.documents && data.documents.length > 0) {
      return {
        cover: data.documents[0].thumbnail,
        description: data.documents[0].contents,
      };
    }
  } catch (e) { console.warn('카카오 API 오류:', e); }
  return { cover: '', description: '' };
}

// ── 별점 렌더 ──
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? '½' : '';
  return '★'.repeat(full) + half;
}

// ── D-day 계산 ──
function getDday(dateStr) {
  if (!dateStr) return '';
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0,0,0,0);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return '🎉 오늘 모임!';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

// ── 현재 읽는 책 카드 렌더 ──
async function renderCurrentBook(books) {
  const el = document.getElementById('currentBook');
  const current = books.find(b => b.status === 'current');
  if (!current) { el.style.display = 'none'; return; }

  const kakao = await fetchBookCover(current.title);
  const coverSrc = current.cover || kakao.cover;
  const desc = current.description || kakao.description || '';
  const questions = current.questions ? current.questions.split(',') : [];
  const dday = getDday(current.meeting_date);

  el.innerHTML = `
    <div class="current-book-card">
      <div class="current-book-inner">
        <div class="current-cover-wrap">
          ${coverSrc
            ? `<img src="${coverSrc}" alt="${current.title}" class="current-cover-img" />`
            : `<span class="cover-title">${current.title}</span>`}
        </div>
        <div class="current-book-info">
          <div class="current-label">📖 이번 달 책</div>
          <div class="current-title">${current.title}</div>
          <div class="current-author">${current.author}</div>
          ${dday ? `<div class="current-dday">${dday}</div>` : ''}
          ${desc ? `<div class="current-desc">${desc.length > 120 ? desc.slice(0,120) + '…' : desc}</div>` : ''}
        </div>
      </div>
      ${questions.length ? `
        <div class="current-questions">
          <div class="questions-label">이번 달 생각해볼 것들</div>
          ${questions.map(q => `<div class="question-item">Q. ${q.trim()}</div>`).join('')}
        </div>` : ''}
    </div>
  `;
}

// ── 회차 기록 렌더 ──
function renderMeetings(meetings) {
  const el = document.getElementById('meetingsList');
  if (!meetings.length) { el.innerHTML = '<p class="loading">아직 기록이 없어요</p>'; return; }

  el.innerHTML = meetings.map((m, i) => `
    <div class="meeting-card">
      <div class="meeting-meta">
        <div class="meeting-num">${meetings.length - i}</div>
        <div class="meeting-date">${m.date}</div>
      </div>
      <div class="meeting-book">${m.book}</div>
      <div class="meeting-author">${m.author}</div>
      ${m.topics ? `<div class="tag-list">${m.topics.split(',').map(t => `<span class="tag">${t.trim()}</span>`).join('')}</div>` : ''}
      ${m.quote ? `<div class="meeting-quote">"${m.quote}"</div>` : ''}
      ${m.attendees ? `<div class="meeting-attendees">참석 · ${m.attendees}</div>` : ''}
      ${m.photos ? `
        <div class="meeting-photos">
          ${m.photos.split(',').map(p => `<img class="meeting-photo" src="${p.trim()}" alt="모임 사진" onclick="openLightbox('${p.trim()}')" />`).join('')}
        </div>` : ''}
    </div>
  `).join('');
}

// ── 책 아카이브 렌더 ──
async function renderBooks(books) {
  const el = document.getElementById('bookGrid');
  if (!books.length) { el.innerHTML = '<p class="loading">아직 책이 없어요</p>'; return; }

  const withCovers = await Promise.all(books.map(async b => {
    if (b.cover) return b;
    const kakao = await fetchBookCover(b.title);
    return { ...b, cover: kakao.cover };
  }));

  el.innerHTML = withCovers.map(b => `
    <div class="book-item">
      <div class="book-cover-wrap">
        ${b.cover
          ? `<img class="book-cover-img" src="${b.cover}" alt="${b.title}" onclick="openLightbox('${b.cover}')" />`
          : `<span class="book-cover-text">${b.title}</span>`}
      </div>
      <div class="book-item-title">${b.title}</div>
      <div class="book-item-author">${b.author}</div>
      ${b.rating ? `<div class="book-rating">${renderStars(parseFloat(b.rating))}</div>` : ''}
    </div>
  `).join('');
}

// ── 갤러리 렌더 ──
function renderGallery(photos) {
  const el = document.getElementById('galleryGrid');
  if (!photos.length) { el.innerHTML = '<p class="loading">사진이 없어요</p>'; return; }

  el.innerHTML = photos.map(p => `
    <div>
      <div class="gallery-item" onclick="openLightbox('${p.url}')">
        <img src="${p.url}" alt="${p.caption || ''}" />
      </div>
      ${p.caption ? `<div class="gallery-caption">${p.caption}</div>` : ''}
    </div>
  `).join('');
}

// ── 멤버 렌더 ──
function renderMembers(members) {
  const el = document.getElementById('membersList');
  if (!members.length) { el.innerHTML = '<p class="loading">멤버가 없어요</p>'; return; }

  el.innerHTML = members.map(m => `
    <div class="member-card">
      <div class="member-avatar">${m.name[0]}</div>
      <div>
        <div class="member-name">${m.name}</div>
        ${m.sentence ? `<div class="member-sentence">"${m.sentence}"</div>` : ''}
      </div>
    </div>
  `).join('');
}

// ── 히어로 통계 업데이트 ──
function updateStats(meetings, books, members) {
  document.getElementById('statMeetings').textContent = meetings.length;
  document.getElementById('statBooks').textContent = books.length;
  document.getElementById('statMembers').textContent = members.length;
  if (meetings.length > 0) {
    document.getElementById('heroBookTitle').textContent = meetings[0].book;
  }
}

// ── 전체 초기화 ──
async function init() {
  try {
    const [meetings, books, gallery, members] = await Promise.all([
      fetchSheet('meetings'),
      fetchSheet('books'),
      fetchSheet('gallery'),
      fetchSheet('members'),
    ]);

    await renderCurrentBook(books);
    renderMeetings(meetings);
    await renderBooks(books);
    renderGallery(gallery);
    renderMembers(members);
    updateStats(meetings, books, members);

  } catch (e) {
    console.error(e);
    document.getElementById('meetingsList').innerHTML =
      '<p class="loading">⚠️ 데이터를 불러오지 못했어요. config.js의 URL을 확인해주세요.</p>';
  }
}

init();
