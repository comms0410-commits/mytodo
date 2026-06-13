const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== "POST") {
    return json({ error: "POST 요청만 지원합니다." }, 405);
  }

  try {
    const body = await request.json();
    const text = String(body?.text || "").trim();
    if (!text) return json({ error: "정리할 내용을 입력해 주세요." }, 400);
    if (text.length > 4_000) return json({ error: "입력은 4,000자 이하로 작성해 주세요." }, 400);

    const userKey = request.headers.get("x-openai-key")?.trim();
    const apiKey = userKey || process.env.OPENAI_API_KEY;
    if (!apiKey) return json({ error: "OpenAI API 키가 설정되지 않았습니다." }, 401);
    if (!apiKey.startsWith("sk-")) return json({ error: "OpenAI API 키 형식이 올바르지 않습니다." }, 401);

    const today = /^\d{4}-\d{2}-\d{2}$/.test(body?.today || "") ? body.today : new Date().toISOString().slice(0, 10);
    const timezone = String(body?.timezone || "Asia/Seoul").slice(0, 80);
    const knownProjects = Array.isArray(body?.knownProjects)
      ? body.knownProjects.map(String).slice(0, 30)
      : [];

    const openAIResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        store: false,
        reasoning: { effort: "low" },
        instructions: [
          "You convert Korean natural-language plans into actionable todo items.",
          "Split multiple actions into separate tasks.",
          "Resolve relative dates using the supplied local date and timezone.",
          "Do not invent obligations that are not present in the user's text.",
          "Use concise Korean task titles that start with an action.",
          "Priority uses 1=highest, 2=very important, 3=important, 4=normal.",
          "If time, project, labels, or description are unknown, use null/empty values as allowed by the schema.",
        ].join(" "),
        input: `현재 날짜: ${today}\n시간대: ${timezone}\n기존 프로젝트: ${knownProjects.join(", ") || "없음"}\n사용자 입력: ${text}`,
        text: {
          format: {
            type: "json_schema",
            name: "organized_todo_list",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                tasks: {
                  type: "array",
                  minItems: 1,
                  maxItems: 20,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      dueDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
                      dueTime: { type: ["string", "null"], pattern: "^\\d{2}:\\d{2}$" },
                      priority: { type: "integer", enum: [1, 2, 3, 4] },
                      project: { type: "string" },
                      labels: { type: "array", items: { type: "string" }, maxItems: 5 },
                    },
                    required: ["title", "description", "dueDate", "dueTime", "priority", "project", "labels"],
                  },
                },
              },
              required: ["summary", "tasks"],
            },
          },
        },
      }),
    });

    const payload = await openAIResponse.json().catch(() => ({}));
    if (!openAIResponse.ok) {
      const message = payload?.error?.message || "OpenAI API 요청에 실패했습니다.";
      const status = openAIResponse.status === 401 ? 401 : openAIResponse.status === 429 ? 429 : 502;
      return json({ error: status === 401 ? "API 키를 확인해 주세요." : status === 429 ? "API 사용 한도 또는 요청 횟수를 확인해 주세요." : message }, status);
    }

    const outputText = extractOutputText(payload);
    if (!outputText) return json({ error: "AI 응답에서 할 일 데이터를 찾지 못했습니다." }, 502);

    const organized = JSON.parse(outputText);
    return json({
      summary: organized.summary,
      tasks: organized.tasks,
      model: payload.model || DEFAULT_MODEL,
    });
  } catch (error) {
    console.error("organize-task error:", error instanceof Error ? error.message : "unknown error");
    return json({ error: "AI 정리 중 서버 오류가 발생했습니다." }, 500);
  }
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string") return payload.output_text;
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders() });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-openai-key",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  };
}
