import { Client } from "@notionhq/client";
import fs from "fs";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

async function fetchPages() {
  const pages = [];
  let cursor = undefined;

  while (true) {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    });
    pages.push(...response.results);
    if (!response.has_more) break;
    cursor = response.next_cursor;
  }

  return pages.map((page) => {
    const props = page.properties;
    const title =
      props["제목"]?.title?.[0]?.plain_text || "시황공유";
    const date = props["날짜"]?.date?.start;
    const url = props["URL"]?.url;
    return { title, start: date, url };
  });
}

async function buildEvents() {
  const events = await fetchPages();
  const js = `// 자동 생성됨: Notion DB → events.js
window.EVENTS = ${JSON.stringify(events, null, 2)};`;
  fs.writeFileSync("events.js", js);
  console.log(`✅ Generated events.js with ${events.length} events.`);
}

buildEvents().catch((err) => {
  console.error(err);
  process.exit(1);
});
