const FEEDS = [
  {
    name: "Google 뉴스 · AI",
    url: "https://news.google.com/rss/search?q=%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%20OR%20AI%20when%3A2d&hl=ko&gl=KR&ceid=KR%3Ako",
  },
  { name: "OpenAI", url: "https://openai.com/news/rss.xml" },
  { name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml" },
  { name: "Anthropic", url: "https://www.anthropic.com/news/rss.xml" },
  { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml" },
];

export default async function handler(request) {
  if (request.method !== "GET") return Response.json({ error: "GET 요청만 지원합니다." }, { status: 405 });

  try {
    const results = await Promise.allSettled(
      FEEDS.map(async (feed) => {
        const response = await fetch(feed.url, {
          headers: { "user-agent": "TodayAIPlanner/1.0 (+Netlify Function)" },
          signal: AbortSignal.timeout(7_000),
        });
        if (!response.ok) throw new Error(`${feed.name}: ${response.status}`);
        const xml = await response.text();
        return parseFeed(xml, feed.name);
      }),
    );

    const items = results
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value)
      .filter((item) => item.title && item.link)
      .filter((item, index, array) => array.findIndex((candidate) => normalizeTitle(candidate.title) === normalizeTitle(item.title)) === index)
      .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
      .slice(0, 18)
      .map((item) => ({ ...item, category: classify(item.title, item.description) }));

    if (!items.length) throw new Error("사용 가능한 뉴스 피드가 없습니다.");

    return Response.json(
      { items, updatedAt: new Date().toISOString() },
      {
        headers: {
          "cache-control": "public, max-age=900, s-maxage=1800, stale-while-revalidate=3600",
          "x-content-type-options": "nosniff",
        },
      },
    );
  } catch (error) {
    console.error("ai-news error:", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "AI 뉴스를 불러오지 못했습니다." }, { status: 502 });
  }
}

function parseFeed(xml, fallbackSource) {
  const chunks = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map((match) => match[0]);
  return chunks.slice(0, 20).map((chunk) => {
    const title = clean(readTag(chunk, "title"));
    const link = readLink(chunk);
    const description = clean(readTag(chunk, "description") || readTag(chunk, "summary") || readTag(chunk, "content"));
    const publishedAt = clean(readTag(chunk, "pubDate") || readTag(chunk, "published") || readTag(chunk, "updated"));
    const source = clean(readTag(chunk, "source")) || fallbackSource;
    return { title, link, description: truncate(description, 260), publishedAt, source };
  });
}

function readTag(chunk, tag) {
  const match = chunk.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] || "";
}

function readLink(chunk) {
  const atom = chunk.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i)?.[1];
  if (atom) return decodeEntities(atom.trim());
  return clean(readTag(chunk, "link"));
}

function clean(value) {
  return decodeEntities(
    String(value || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeEntities(value) {
  const entities = {
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&#39;": "'", "&apos;": "'", "&nbsp;": " ",
  };
  return value
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (match) => entities[match] || match)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function classify(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  if (/research|paper|study|benchmark|연구|논문|과학|모델 성능|학습/.test(text)) return "research";
  if (/policy|regulation|law|government|투자|규제|법안|정부|기업|산업|저작권|안전/.test(text)) return "policy";
  return "product";
}

function normalizeTitle(value) {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]/g, "").slice(0, 90);
}

function truncate(value, max) {
  return value.length > max ? `${value.slice(0, max).trim()}…` : value;
}
