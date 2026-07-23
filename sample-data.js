// API_URL이 비어있을 때 사이트 미리보기를 위한 샘플 데이터입니다.
// 실제 운영 시에는 Google Sheets 데이터로 자동 대체됩니다.
window.SAMPLE_DATA = {
  books: [
    {
      id: "pachinko",
      title: "파친코",
      author: "이민진",
      rating: 4.5,
      oneLiner: "이름 없이 살다 간 사람들에 대한 이야기",
      meetingId: "2026-07"
    },
    {
      id: "human-acts",
      title: "소년이 온다",
      author: "한강",
      rating: 4.8,
      oneLiner: "말할 수 없는 것을 말하려는 시도",
      meetingId: "2026-06"
    },
    {
      id: "kafka-shore",
      title: "해변의 카프카",
      author: "무라카미 하루키",
      rating: 4.2,
      oneLiner: "예언과 우연이 뒤섞인 성장의 지도",
      meetingId: "2026-05"
    }
  ],
  meetings: [
    {
      id: "2026-07",
      date: "2026.07.19",
      bookId: "pachinko",
      attendees: ["제인", "수현", "민지"],
      topics: ["정체성과 이름", "세대 간 상처", "이민자의 언어"],
      keyQuote: "역사는 우리를 망쳤지만, 그래도 상관없다"
    },
    {
      id: "2026-06",
      date: "2026.06.21",
      bookId: "human-acts",
      attendees: ["제인", "수현", "동혁", "민지"],
      topics: ["기억과 증언", "육체와 존엄"],
      keyQuote: "당신은 그 눈을 봤어야 했다"
    },
    {
      id: "2026-05",
      date: "2026.05.17",
      bookId: "kafka-shore",
      attendees: ["수현", "동혁"],
      topics: ["운명론", "이중 서사 구조"],
      keyQuote: "세상에서 가장 강한 십오 세가 되는 것"
    }
  ]
};
