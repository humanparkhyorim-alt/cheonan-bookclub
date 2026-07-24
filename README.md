# 천안독서모임 아카이빙 사이트

## 세팅 순서

---

### 1단계 · Google Sheets 만들기

[sheets.google.com](https://sheets.google.com) 에서 새 스프레드시트 만들고
아래 시트 4개를 탭으로 추가하세요.

#### 시트명: `meetings` (회차 기록)
| date | book | author | topics | quote | attendees | photos |
|------|------|--------|--------|-------|-----------|--------|
| 2026년 7월 19일 | 데미안 | 헤르만 헤세 | 자아 탐색,선과 악 | 새는 알에서 나오려고 투쟁한다 | 제인,수현,민지 | https://drive링크1,https://drive링크2 |

#### 시트명: `books` (책 아카이브)
| title | author | cover | rating |
|-------|--------|-------|--------|
| 데미안 | 헤르만 헤세 | (표지 이미지 Drive 링크) | 4.5 |

#### 시트명: `gallery` (사진)
| url | caption |
|-----|---------|
| https://drive링크 | 1회차 모임 |

#### 시트명: `members` (멤버)
| name | sentence |
|------|---------|
| 제인 | 새는 알에서 나오려고 투쟁한다 |

---

### 2단계 · Google Drive 사진 링크 만들기

1. Google Drive에 사진 업로드
2. 사진 우클릭 → **링크 공유** → **링크 있는 모든 사용자**로 변경
3. 링크에서 ID 복사: `https://drive.google.com/file/d/**파일ID**/view`
4. 아래 형식으로 변환해서 Sheets에 입력:
   ```
   https://drive.google.com/uc?export=view&id=파일ID
   ```

---

### 3단계 · Apps Script 배포

1. 스프레드시트 상단 메뉴 → **확장 프로그램** → **Apps Script**
2. `apps-script.js` 파일 내용을 통째로 붙여넣기
3. `SHEET_ID`를 내 스프레드시트 URL의 ID로 교체
   - URL 예시: `https://docs.google.com/spreadsheets/d/**여기가ID**/edit`
4. 상단 **배포** → **새 배포** → 유형: **웹 앱**
5. 액세스: **모든 사용자** 선택 후 배포
6. 생성된 **웹 앱 URL** 복사

---

### 4단계 · config.js에 URL 붙여넣기

`js/config.js` 파일 열어서:
```js
const APPS_SCRIPT_URL = "여기에 붙여넣기";
```

---

### 5단계 · GitHub Pages 배포

```bash
# 터미널에서
git init
git add .
git commit -m "첫 번째 커밋"
git remote add origin https://github.com/아이디/레포이름.git
git push -u origin main
```

GitHub 레포 → Settings → Pages → Branch: main → Save

🎉 완료! `https://아이디.github.io/레포이름` 으로 접속 가능

---

### 새 회차 추가하는 법

Google Sheets `meetings` 탭에 새 행 추가하면 끝.
사이트 자동 반영됩니다.
