// Netlify Function: /.netlify/functions/parse-task
// 중요: OPENAI_API_KEY는 HTML에 넣지 말고 Netlify Environment variables에만 저장하세요.

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "OPENAI_API_KEY is not configured" })
    };
  }

  try {
    const { text, today, timezone } = JSON.parse(event.body || "{}");

    const input = `
오늘 날짜: ${today}
시간대: ${timezone || "Asia/Seoul"}

사용자의 업무 입력:
${text}

아래 JSON 형식으로만 응답해.
마크다운 코드블록은 쓰지 마.

{
  "title": "업무명",
  "project": "아이노우 | 폴로AI | 마에스틱 | 카톡숏폼 | 온라인교회 | 가이오 | 기타 중 하나",
  "dueDate": "YYYY-MM-DD",
  "priority": "높음 | 보통 | 낮음",
  "memo": "짧은 메모"
}

규칙:
- 사용자가 오늘, 내일, 이번 주 목요일, 금요일, 월말처럼 말하면 오늘 날짜 기준으로 실제 날짜로 변환해.
- 프로젝트명이 명확하지 않으면 기타로 둬.
- 마감일이 없으면 오늘 날짜로 둬.
- 중요도 표현이 없으면 보통으로 둬.
- 한국어로 자연스럽게 정리해.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: errorText })
      };
    }

    const data = await response.json();
    const outputText =
      data.output_text ||
      (data.output || [])
        .flatMap(item => item.content || [])
        .map(content => content.text || "")
        .join("\n");

    const jsonText = outputText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(jsonText);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: parsed })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message })
    };
  }
};
