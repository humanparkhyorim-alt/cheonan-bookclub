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
  return await res.json();
}

// ── Google Books API 직접 호출 ──
// maxResults를 여러 개 받아서, 그중 표지 이미지(imageLinks)가 있는
// 첫 번째 판본을 골라 씀. (검색 1등 판본에 표지가 없는 경우 대응)
async function fetchBookCover(title, author) {
  try {
    const q = author ? `${title} ${author}` : title;
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10&key=AIzaSyBm9D8bUspMGBhC4-P5DO_Qv-i8cA6sYA8`
    );
    if (!res.ok) {
      console.warn('구글북스 API 응답 실패:', res.status);
      return { cover: '', description: '' };
    }
    const data = await res.json();
    if (!data.items) return { cover: '', description: '' };

    const match = data.items.find(item => item.volumeInfo?.imageLinks?.thumbnail);
    if (!match) return { cover: '', description: '' };

    const info = match.volumeInfo;
    return {
      cover: info.imageLinks.thumbnail.replace('http:', 'https:'),
      description: info.description || ''
    };
  } catch (e) {
    console.warn('표지 오류:', e);
  }
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

  let coverSrc = current.cover;
  let desc = current.description || '';

  if (!coverSrc) {
    const fetched = await fetchBookCover(current.title, current.author);
    coverSrc = fetched.cover;
    if (!desc) desc = fetched.description;
  }

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
    const fetched = await fetchBookCover(b.title, b.author);
    return { ...b, cover: fetched.cover };
  }));

  el.innerHTML = withCovers.map(b => {
    const questions = b.discussion_questions ? b.discussion_questions.split('|').map(q => q.trim()).filter(Boolean) : [];
    const sources = b.sources ? b.sources.split('|').map(s => s.trim()).filter(Boolean) : [];

    // "이름 (URL)" 형식을 링크로 변환
    const sourceLinks = sources.map(s => {
      const m = s.match(/^(.*)\((https?:\/\/[^)]+)\)$/);
      return m ? `<a href="${m[2]}" target="_blank" rel="noopener">${m[1].trim()}</a>` : s;
    }).join(', ');

    return `
      <div class="book-item">
        <div class="book-cover-wrap">
          ${b.cover
            ? `<img class="book-cover-img" src="${b.cover}" alt="${b.title}" onclick="openLightbox('${b.cover}')" />`
            : `<span class="book-cover-text">${b.title}</span>`}
        </div>
        <div class="book-item-title">${b.title}</div>
        <div class="book-item-author">${b.author}</div>
        ${b.rating ? `<div class="book-rating">${renderStars(parseFloat(b.rating))}</div>` : ''}
        ${(b.context || questions.length) ? `
          <div class="book-discussion">
            ${b.context ? `<p class="discussion-context">${b.context}</p>` : ''}
            ${questions.length ? `
              <p class="discussion-label">생각해볼 것들</p>
              <ul class="discussion-list">
                ${questions.map(q => `<li>${q}</li>`).join('')}
              </ul>` : ''}
            ${sourceLinks ? `<p class="discussion-source">출처: ${sourceLinks}</p>` : ''}
          </div>` : ''}
      </div>
    `;
  }).join('');
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
// ── 노션 아카이브 렌더 ──
function renderNotion(items) {
  const el = document.getElementById('notionGrid');
  if (!items.length) { el.innerHTML = '<p class="loading">아직 등록된 기록이 없어요</p>'; return; }

  el.innerHTML = items.map(n => `
    <div class="notion-card">
      <div class="notion-icon">${n.emoji || '📝'}</div>
      <div class="notion-title">${n.title || '(제목 없음)'}</div>
      ${n.date ? `<div class="notion-date">${n.date}</div>` : ''}
      ${n.description ? `<div class="notion-desc">${n.description}</div>` : ''}
      ${n.url ? `<a class="notion-link" href="${n.url}" target="_blank" rel="noopener">노션에서 보기 ↗</a>` : ''}
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
const [meetings, books, gallery, members, notion] = await Promise.all([
  fetchSheet('meetings'),
  fetchSheet('books'),
  fetchSheet('gallery'),
  fetchSheet('members'),
  fetchSheet('notion'),
]);

await renderCurrentBook(books);
renderMeetings(meetings);
await renderBooks(books);
renderGallery(gallery);
renderMembers(members);
renderNotion(notion);
updateStats(meetings, books, members);

  } catch (e) {
    console.error(e);
    document.getElementById('meetingsList').innerHTML =
      '<p class="loading">⚠️ 데이터를 불러오지 못했어요. config.js의 URL을 확인해주세요.</p>';
  }
}

init();
