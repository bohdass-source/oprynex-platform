// Tells Bing and other IndexNow search engines that the pages in the sitemap changed. The key is public by design.
//   bun scripts/indexnow.ts
import { siteUrl } from "../src/lib/site-url";

const key = "0123456789abcdef0123456789abcdef";
const host = new URL(siteUrl).host;
const xml = await (await fetch(`${siteUrl}/sitemap.xml`)).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation: `${siteUrl}/${key}.txt`, urlList }),
});
console.log(`IndexNow: ${response.status}, ${urlList.length} pages`);
