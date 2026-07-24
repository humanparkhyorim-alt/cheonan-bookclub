// ──────────────────────────────────────────────
// 천안독서모임 · Google Apps Script 백엔드
// Google Apps Script 에디터에 이 코드를 붙여넣으세요
// ──────────────────────────────────────────────

const SHEET_ID = "YOUR_GOOGLE_SHEET_ID_HERE"; // ← 스프레드시트 ID로 교체

function doGet(e) {
  const sheet = e.parameter.sheet;
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName(sheet);

  if (!ws) {
    return jsonResponse([]);
  }

  const [headers, ...rows] = ws.getDataRange().getValues();

  const data = rows
    .filter(row => row[0] !== "") // 빈 행 제외
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
      return obj;
    });

  return jsonResponse(data);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
