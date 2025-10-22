// allscrape.js (atau allscrape.cjs)
require("../../config");
const { firefox,chromium,devices } = require('playwright');
const cheerio = require('cheerio');
const axios = require('axios');
const fuzzysort = require('fuzzysort');
const path = require('path');
const fs = require('fs');

async function ssweb(url, opts = {}) {
if (!url || typeof url !== "string") throw new Error("Invalid URL");
if (!/^https?:\/\//i.test(url)) url = "https://" + url;

const mode = opts.mode === "mobile" ? "mobile" : "desktop";
const quality = Number.isFinite(opts.quality) ? Math.max(1, Math.min(100, opts.quality)) : 60;
const cleanMode = opts.cleanMode === false ? false : true;
const VIEWPORTS = {
desktop: { width: 1280, height: 720 },
mobile: { width: 720, height: 1280 }
};
const vp = VIEWPORTS[mode];
const fname = `ssweb_${mode}_${Date.now()}.jpg`;
const outPath = path.resolve('./public/assets', fname); 
const publicUrl = `${global.domain}/assets/${fname}`; 
const args = [
'--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
'--disable-background-networking','--disable-background-timer-throttling',
'--disable-backgrounding-occluded-windows','--disable-breakpad',
'--disable-client-side-phishing-detection','--disable-component-update',
'--disable-default-apps','--disable-domain-reliability','--disable-extensions',
'--disable-features=AudioServiceOutOfProcess','--disable-hang-monitor',
'--disable-ipc-flooding-protection','--disable-popup-blocking',
'--disable-prompt-on-repost','--disable-renderer-backgrounding',
'--disable-sync','--disable-translate','--metrics-recording-only','--mute-audio',
'--no-first-run','--no-default-browser-check','--password-store=basic',
'--use-mock-keychain','--hide-scrollbars','--window-size=1280,720','--disable-gpu'
];
const browser = await chromium.launch({ headless: true, args });
const page = await browser.newPage();
await page.setViewportSize(vp);
if (cleanMode) {
await page.route("**/*", (route) => {
const u = route.request().url().toLowerCase();
if (/doubleclick|adsystem|googlesyndication|adservice|taboola|outbrain|adnxs|pubmatic|banner|\/ads\//.test(u) ||
u.match(/\.(mp4|webm|mp3|ogg)$/)) {
try { route.abort(); } catch { route.continue(); }
} else route.continue();
});
await page.addStyleTag({
content: `
iframe, ins, .ad, .ads, .adsbygoogle, .banner, .sponsor, .cookie, .popup, .overlay, 
[id*="ad_"], [class*="ad-"], [class*="banner"], [class*="sponsor"] {
display:none !important; visibility:hidden !important; height:0 !important; width:0 !important; overflow:hidden !important;
}
body { background: #ffffff !important; }
`
});
}
try {
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(600);
await page.screenshot({
path: outPath,
type: "jpeg",
quality,
fullPage: false
});
await browser.close();
return {
file: publicUrl,
mode,
width: vp.width,
height: vp.height,
quality
};
} catch (err) {
try { await browser.close(); } catch {}
throw err;
}
}

async function gtguide(name) {
try {
const res = await axios.get("https://guardiantalesguides.com/game/guardians/", {
headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' },
timeout: 20000
});

const $ = cheerio.load(res.data);
const heroes = [];
$('.portrait a').each((i, el) => {
const href = $(el).attr('href');
const heroName = $(el).find('.topDetails .name').text().trim();
if (heroName && href) heroes.push({ name: heroName, url: 'https://guardiantalesguides.com' + href });
});

if (!heroes.length) throw new Error('❌ Tidak ada hero ditemukan.');
const result = fuzzysort.go(name, heroes.map(h => h.name), { limit: 1, threshold: -500 });
if (!result.length) throw new Error('❌ Hero tidak ditemukan.');
const bestName = result[0].target;
const hero = heroes.find(h => h.name === bestName);

const detailRes = await axios.get(hero.url, {
headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' },
timeout: 20000
});

const $$ = cheerio.load(detailRes.data);
const data = {};
data.name = $$('h1.heading').text().trim();
data.image = 'https://guardiantalesguides.com' + $$('div.portrait img').attr('src');
data.school = $$('div.stats div:contains("School:") em').text().trim();
data.groupBuff = $$('div.stats div:contains("Group Buff:") em').text().trim();
data.introduced = $$('div.stats div:contains("Introduced:")').text().replace('Introduced:', '').trim();

data.abilities = [];
$$('#guardianInfo > div').each((i, el) => {
const type = $$(el).find('.heading').text().trim();
const title = $$(el).find('.text h5').text().trim();
const desc = $$(el).find('.text').text().replace(title, '').trim();
data.abilities.push({ type, title, desc });
});

data.bestItems = [];
$$('.bestInSlots .item').each((i, el) => {
const itemName = $$(el).find('.topDetails .name').text().trim();
const itemType = $$(el).find('.topDetails .type').text().trim();
const itemImg = $$(el).find('img').attr('src');
const drop = $$(el).find('.detail').text().trim();
if (itemName) {
data.bestItems.push({
name: itemName,
type: itemType,
drop: drop,
image: itemImg.startsWith('http') ? itemImg : 'https://guardiantalesguides.com' + itemImg
});
}
});

const safeName = hero.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
const fileName = `gt_${safeName}.jpg`;
const outputPath = path.resolve(global.outPath || './public/assets', fileName);
const publicUrl = `${global.domain}/assets/${fileName}`;

const args = [
'--no-sandbox',
'--disable-setuid-sandbox',
'--disable-dev-shm-usage',
'--disable-background-networking',
'--disable-background-timer-throttling',
'--disable-backgrounding-occluded-windows',
'--disable-breakpad',
'--disable-client-side-phishing-detection',
'--disable-component-update',
'--disable-default-apps',
'--disable-domain-reliability',
'--disable-extensions',
'--disable-features=AudioServiceOutOfProcess',
'--disable-hang-monitor',
'--disable-ipc-flooding-protection',
'--disable-popup-blocking',
'--disable-prompt-on-repost',
'--disable-renderer-backgrounding',
'--disable-sync',
'--disable-translate',
'--metrics-recording-only',
'--mute-audio',
'--no-first-run',
'--no-default-browser-check',
'--password-store=basic',
'--use-mock-keychain',
'--hide-scrollbars',
'--window-size=1080,1600',
'--disable-gpu'
];

const browser = await chromium.launch({ headless: true, args });
const page = await browser.newPage();

await page.route('**/*', route => {
const url = route.request().url();
if (/doubleclick|adsystem|adservice|googlesyndication|taboola|outbrain|adnxs|rubicon|pubmatic|scorecardresearch|facebook|twitter|tiktok|youtube/i.test(url) ||
url.includes('/ads/') || url.includes('banner') || url.includes('affiliate')) {
route.abort();
} else {
route.continue();
}
});

await page.addStyleTag({
content: `
iframe, ins, .ad, .ads, .banner, .sponsor, [id*="ad_"], [class*="ad-"], [class*="banner"], [class*="sponsor"] {
display: none !important;
visibility: hidden !important;
height: 0 !important;
width: 0 !important;
}
`
});

await page.setViewportSize({ width: 1080, height: 1600 });
await page.goto(hero.url, { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(600);

await page.screenshot({
path: outputPath,
type: 'jpeg',
quality: 50,
clip: { x: 0, y: 195, width: 1080, height: 1400 - 195 }
});

await browser.close();

return { 
hero: hero.name, 
file: publicUrl, 
details: data 
};
} catch (err) {
console.error('❌ Error:', err.message);
return null;
}
}

async function getTiktokInfo(username) {
const url = `https://www.tiktok.com/@${username}`;
const { data: html } = await axios.get(url, {
headers: {
"User-Agent":
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
},
});
const $ = cheerio.load(html);
const jsonData = $("#__UNIVERSAL_DATA_FOR_REHYDRATION__").text();
if (!jsonData) throw new Error("Tidak menemukan data JSON TikTok");
const data = JSON.parse(jsonData);
const userDetail = data?.__DEFAULT_SCOPE__?.["webapp.user-detail"]?.userInfo;
const user = userDetail?.user || {};
const stats = userDetail?.stats || {};
return {
id: user.id,
secUid: user.secUid,
uniqueId: user.uniqueId,
nickname: user.nickname,
avatar: user.avatarLarger,
signature: user.signature,
verified: user.verified,
createTime: user.createTime
? new Date(user.createTime * 1000).toISOString()
: null,
settings: {
commentSetting: user.commentSetting,
duetSetting: user.duetSetting,
stitchSetting: user.stitchSetting,
downloadSetting: user.downloadSetting,
openFavorite: user.openFavorite,
privateAccount: user.privateAccount,
},
stats: {
followers: stats.followerCount,
following: stats.followingCount,
likes: stats.heartCount,
videos: stats.videoCount,
friends: stats.friendCount,
},
commerceUser: user?.commerceUserInfo?.commerceUser ?? null,
embedPermission: user.profileEmbedPermission,
isEmbedBanned: user.isEmbedBanned,
};
}

async function getHTML(url) {
const { data } = await axios.get(url, {
headers: {
'User-Agent': 'Mozilla/5.0 (Linux; Android 12; kageireng/1.0)',
},
timeout: 20000,
});
return data;
}

async function myanimelist(query, type = "anime") {
try {
const searchUrl = `https://myanimelist.net/${type}.php?q=${encodeURIComponent(query)}&cat=${type}`;
const { data: searchHtml } = await axios.get(searchUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
const $ = cheerio.load(searchHtml);
const first = $("a.hoverinfo_trigger").first();
const url = first.attr("href");
if (!url) return null;
const { data: html } = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
const $$ = cheerio.load(html);
let thumb = $$(".leftside img").attr("data-src") || $$(".leftside img").attr("src");
if (thumb) thumb = thumb.replace(/(\.jpg|\.png)$/, "l$1");
const title = $$("h1.title-name strong").text().trim() || $$("h1 span[itemprop='name']").text().trim();
const info = {};
$$('h2:contains("Alternative Titles")').nextUntil('h2').each((_, el) => {
$$(el).find('div.spaceit_pad, span').each((_, span) => {
const label = $$(span).find('.dark_text').text().trim().replace(':', '');
if (!label) return;
const value = $$(span).clone().find('.dark_text').remove().end().text().trim().replace(/\s+/g, ' ');
if (label && value) info[label] = value;
});
});
$$("#content div.spaceit_pad, #content div.information").each((_, el) => {
const label = $$(el).find(".dark_text").text().trim().replace(":", "");
if (!label) return;
const links = $$(el).find("a").map((_, a) => $$(a).text().trim()).get();
const value = links.length ? links.join(", ") : $$(el).clone().find(".dark_text").remove().end().text().replace(/\s+/g, " ").trim();
if (label && value) info[label] = value;
});
const genres = $$(".leftside div a[href*='/"+type+"/genre/']").map((_, a) => $$(a).text().trim()).get();
if (genres.length) info['Genres'] = genres.join(", ");
const wantedInfo = [
"English","Synonyms","Japanese","German","Spanish","French",
"Type","Episodes","Volumes","Chapters","Status","Aired","Published","Premiered","Broadcast",
"Producers","Authors","Studios","Serialization","Source","Genres","Theme","Demographic","Duration","Rating"
];
const clean = text => text ? text.replace(/\s+/g, " ").trim() : "-";
const cleanInfo = {};
for (const key of wantedInfo) if(info[key]) cleanInfo[key] = clean(info[key]);
const stats = {};
$$("h2:contains('Statistics')").nextAll("div.spaceit_pad").each((_, el) => {
const statEl = $$(el).clone();
statEl.find("sup, small").remove();
const label = statEl.find(".dark_text").text().trim().replace(":", "");
const value = statEl.clone().find(".dark_text").remove().end().text().replace(/\s+/g," ").trim();
if(label && value) stats[label] = value;
});
const cleanStat = text => {
if(!text) return "-";
text = text.replace(/indicates.*$/i,"").trim();
text = text.replace(/\s+\d+$/,"").trim();
text = text.replace(/(\d)(?=(\d{3})+(?!\d))/g,"$1,");
return text;
}
const normalizedStats = {
Score: clean(stats.Score || info.Score),
Popularity: cleanStat(stats.Popularity || info.Popularity),
Members: cleanStat(stats.Members || info.Members),
Favorites: cleanStat(stats.Favorites || info.Favorites)
};
return {
title: clean(title),
url,
thumb,
info: cleanInfo,
stats: normalizedStats
};
} catch(e) {
console.error("❌ Error scraping:",e.message);
return null;
}
}

async function mediafire(url) {
try {
const { data } = await axios.get(url, {
headers: { "User-Agent": "Mozilla/5.0" }
});
const $ = cheerio.load(data);
const downloadLink =
$('a#downloadButton').attr('href') ||
$('a.popsok').attr('href') ||
$('a[aria-label="Download file"]').attr('href');
const fileName = $("div.filename").text().trim() || $("a#downloadButton").text().trim() || "mediafire_file";
const fileSize = $("div.details").first().text().trim().split("\n")[0] || "-";
if (downloadLink && downloadLink.startsWith('https://download')) {
return { url: downloadLink, name: fileName, size: fileSize };
} else return null;
} catch (e) {
console.error(e);
return null;
}
}

async function randomHentai(galleryId, maxPages) {
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const hentaiScraper = async () => {
try {
const randomPage = getRandomInt(1, maxPages);
const detailUrl = `https://imhentai.xxx/view/${galleryId}/${randomPage}/`;
const res = await axios.get(detailUrl, {
headers: { 'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" },
timeout: 15000 
}); 
const $ = cheerio.load(res.data); 
const imageUrl = $('#gimg').attr('src');
if (!imageUrl || !imageUrl.endsWith('.jpg')) return null;
return {
imageUrl: imageUrl
};
} catch (error) {
console.error("[IMHENTAI] Failed:", error.message);
return null;
}
};
const waifuNekoApi = async () => {
try {
const res = await axios.get(`https://api.waifu.pics/nsfw/neko`);
const json = res.data;
if (json.url) {
return {
imageUrl: json.ur
};
}
return null;
} catch (error) {
console.error("[WAIFU NEKO] Failed:", error.message);
return null;
}
};
const waifuWaifuApi = async () => {
try {
const res = await axios.get(`https://api.waifu.pics/nsfw/waifu`);
const json = res.data;
if (json.url) {
return {
imageUrl: json.url
};
}
return null;
} catch (error) {
console.error("[WAIFU WAIFU] Failed:", error.message);
return null;
}
};
const apis = [
hentaiScraper,
waifuNekoApi,
waifuWaifuApi
];
let result = null;
let attempts = 0;
while (!result && attempts < apis.length) {
attempts++;
const randomIndex = Math.floor(Math.random() * apis.length);
const selectedApi = apis[randomIndex];
result = await selectedApi();
if (result && result.imageUrl) {
return result;
} 
apis.splice(randomIndex, 1); 
}
return null; 
}

async function getMotionBG(text) {
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
let detailUrl = null;
if (text && text.startsWith("https://motionbgs.com")) {
detailUrl = text;
} else {
try {
let page = getRandomInt(1, 80); 
const url = `https://motionbgs.com/tag:anime/${page}/`;
const html = await getHTML(url);
const $ = cheerio.load(html);
let detailLinks = [];
$('.tmb a').each((i, el) => {
const relativeHref = $(el).attr('href');
if (relativeHref) {
detailLinks.push("https://motionbgs.com" + relativeHref);
}
});
if (detailLinks.length === 0) {
return null;
} 
detailUrl = detailLinks[getRandomInt(0, detailLinks.length - 1)];
} catch (e) {
console.error("❌ Error during random search:", e.message);
return null;
}
} 
if (!detailUrl) return null;
try {
const res = await getHTML(detailUrl);
const $ = cheerio.load(res);
const title = $('title').text().trim() || $('h1.ttl').text().trim() || "No Title Found";
const videoSource = $('video source').attr('src'); 
if (!videoSource) return null;
const idMatch = videoSource.match(/\/media\/(\d+)\//); 
if (idMatch && idMatch[1]) {
const wallpaperId = idMatch[1];
const finalHdLink = `https://motionbgs.com/dl/hd/${wallpaperId}`;
return {
title: title,
id: wallpaperId,
hd_link: finalHdLink,
detail_url: detailUrl
};
}
return null;
} catch (error) {
console.error("❌ Error during final extraction:", error.message);
return null;
}
}

async function SKurama(searchText, limit = 5) { 
const searchUrl = `https://m2.kuramanime.tel/anime?order_by=popular&search=${encodeURIComponent(searchText)}&page=1`;
try {
const html = await getHTML(searchUrl);
const $ = cheerio.load(html);
const animeList = []; 
$('#animeList .filter__gallery a').each((i, el) => {
if (i >= limit) return false;
const href = $(el).attr('href');
const title = $(el).find('h5.sidebar-title-h5').text().trim();
const thumb =
$(el).find('.product__sidebar__view__item').attr('data-setbg') ||
$(el).find('img').attr('src') || null;

if (href && title) animeList.push({ title, href, thumb });
});
if (!animeList.length) return [];
const results = [];
for (const anime of animeList) {
try {
const detailHtml = await getHTML(anime.href);
const $$ = cheerio.load(detailHtml); 
const epHtml = $$('#episodeLists').attr('data-content') || '';
const batchHtml = $$('#episodeBatchLists').attr('data-content') || '';
const ep$ = cheerio.load(epHtml);
const batch$ = cheerio.load(batchHtml);
const episodes = [];
const batches = [];
ep$('a').each((_, a) => {
const link = ep$(a).attr('href');
if (link && link.includes('/episode/')) episodes.push(link);
});
batch$('a').each((_, a) => {
const link = batch$(a).attr('href');
if (link && link.includes('/batch/')) batches.push(link);
});
results.push({
title: anime.title || 'Unknown',
href: anime.href,
thumb: anime.thumb,
episodes: episodes.length ? episodes : null,
batches: batches.length ? batches : null,
});
} catch (e) {
console.log(`[error] ${anime.title}: ${e.message}`);
}
}
return results;
} catch (e) {
return [];
}
}

async function DKurama(url) {
const args = [
'--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-accelerated-2d-canvas',
'--disable-accelerated-jpeg-decoding','--disable-accelerated-video-decode','--disable-audio-output',
'--disable-background-networking','--disable-background-timer-throttling','--disable-backgrounding-occluded-windows',
'--disable-breakpad','--disable-client-side-phishing-detection','--disable-component-update','--disable-default-apps',
'--disable-domain-reliability','--disable-extensions','--disable-features=TranslateUI,BlinkGenPropertyTrees,AudioServiceOutOfProcess',
'--disable-hang-monitor','--disable-ipc-flooding-protection','--disable-renderer-backgrounding','--disable-sync',
'--disable-software-rasterizer','--mute-audio','--no-default-browser-check','--no-first-run','--metrics-recording-only',
'--password-store=basic','--use-mock-keychain','--headless=new','--blink-settings=imagesEnabled=false',
'--hide-scrollbars','--window-size=1,1'
];

const browser = await chromium.launch({ headless: true, args });
const page = await browser.newPage();

let targetHtml = null;
let pageHtml = null; 

page.on('response', async (response) => {
const resUrl = response.url();
if (resUrl.includes('kuramadrive') || resUrl.includes('animeDownloadLink')) {
try {
const body = await response.text();
if (body.includes('animeDownloadLink')) targetHtml = body; 
} catch {}
}
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(10000); 
pageHtml = await page.content(); 
await browser.close();

if (!targetHtml && !pageHtml) return null;

const downloads = [];
const $ = cheerio.load(targetHtml || ''); 
$('#animeDownloadLink h6').each((_, el) => {
const resoText = $(el).text().trim();
const links = [];
const nextLinks = $(el).nextUntil('h6', 'a');
nextLinks.each((__, a) => {
const name = $(a).text().trim().replace(/\s+/g, ' ');
const href = $(a).attr('href');
if (href && href.startsWith('http')) links.push({ name, href });
});
if (links.length) downloads.push({ resolution: resoText, links });
});

const streams = [];
const $$ = cheerio.load(pageHtml || '');
$$('video#player source').each((_, el) => {
const res = $$(el).attr('size') || 'Unknown';
const src = $$(el).attr('src');
if (src && src.startsWith('http')) streams.push({ resolution: res, url: src });
});
return {
url: url,
downloads: downloads.length ? downloads : null,
streams: streams.length ? streams : null,
};
}

async function tiktokscrape(url) {
if (!url) return;
let cleanUrl = url; 
if (url.includes('vt.tiktok.com')) {
try {
const resp = await axios.get(url, { maxRedirects: 0, validateStatus: null });
cleanUrl = resp.headers.location || url; 
} catch (e) {
if (e.response && e.response.request && e.response.request.res) {
 cleanUrl = e.response.request.res.responseUrl;
} else {
 console.error("Gagal mendapatkan clean URL:", e.message);
}
}
}

const isImagePost = cleanUrl.includes('/photo/');
const isVideoPost = cleanUrl.includes('/video/');
if (!isImagePost && !isVideoPost) return;

function normalizeToArray(v) {
if (!v) return [];
if (Array.isArray(v)) return v;
return [v];
}
 
if (isImagePost) {
const iphone = devices['iPhone 13'];
const args = [
'--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas',
'--disable-accelerated-jpeg-decoding', '--disable-accelerated-video-decode', '--disable-audio-output',
'--disable-background-networking', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
'--disable-breakpad', '--disable-client-side-phishing-detection', '--disable-component-update', '--disable-default-apps',
'--disable-domain-reliability', '--disable-extensions', '--disable-features=TranslateUI,BlinkGenPropertyTrees,AudioServiceOutOfProcess',
'--disable-hang-monitor', '--disable-ipc-flooding-protection', '--disable-renderer-backgrounding', '--disable-sync',
'--disable-software-rasterizer', '--mute-audio', '--no-default-browser-check', '--no-first-run', '--metrics-recording-only',
'--password-store=basic', '--use-mock-keychain', '--headless=new', '--blink-settings=imagesEnabled=false',
'--hide-scrollbars', '--window-size=1,1'
];
const browser = await chromium.launch({ headless: true, args });
const context = await browser.newContext({
...iphone,
userAgent: iphone.userAgent,
locale: 'en-US',
});
const page = await context.newPage();

async function downloadBuffer(url, referer) {
const headers = {
Referer: referer || 'https://www.tiktok.com/',
Accept: '*/*',
};
const resp = await context.request.get(url, { headers, failOnStatusCode: false });
if (!resp) throw new Error('No response');
if (resp.status() >= 400)
throw new Error(`HTTP ${resp.status()} when downloading ${url}`);
return { buf: await resp.body(), headers: resp.headers() };
}

function findPhotoDataFromJson(json) {
if (!json || typeof json !== 'object') return null;
let found = null;
(function scan(obj) {
if (!obj || typeof obj !== 'object' || found) return;
if (obj.itemStruct?.imagePost) found = obj.itemStruct;
else if (obj.imagePost?.images) found = obj;
else for (const k in obj) scan(obj[k]);
})(json);
return found;
}

try {
await page.goto(cleanUrl, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2000);
let raw = await page
.locator('#__UNIVERSAL_DATA_FOR_REHYDRATION__')
.textContent()
.catch(() => null);
let json = null;
if (raw) {
try {
json = JSON.parse(raw);
} catch (e) {
const m = raw.match(/\{[\s\S]*\}/);
if (m) try { json = JSON.parse(m[0]); } catch {}
}
}
if (!json) {
const allScripts = await page.$$eval(
'script[type="application/json"], script',
els => els.map(e => e.textContent).filter(Boolean)
);
for (const s of allScripts) {
if (s.includes('imagePost')) {
try { json = JSON.parse(s); break; }
catch (e) {
const m = s.match(/\{[\s\S]*\}/);
if (m) try { json = JSON.parse(m[0]); break; } catch {}
}
}
}
}
if (!json) throw new Error('JSON not found');
const scope = json.__DEFAULT_SCOPE__ || json;
const photoData = findPhotoDataFromJson(scope);
if (!photoData) throw new Error('photo data not found');
const imageList = normalizeToArray(photoData.imagePost?.images || []);
if (!imageList.length) throw new Error('no images found');
const imageUrls = imageList
.map(img => img.imageURL?.urlList?.[0] || img.imageURL?.urlList?.[1])
.filter(Boolean);
const username = photoData.author?.uniqueId || 'unknown_user';
const caption = photoData.desc || photoData.title || '';
const postId = photoData.id || `post_${Date.now()}`;
const createTime = photoData.createTime
? new Date(photoData.createTime * 1000).toISOString()
: null;
 
const imagePaths = []; 

for (let i = 0; i < imageUrls.length; i++) {
const imgUrl = imageUrls[i];
try {
const { buf, headers } = await downloadBuffer(imgUrl, page.url());
const photoFileName = `${Date.now()}_photo_${i + 1}.jpg`;
const photoFullSavePath = path.resolve('./public/assets', photoFileName);

fs.writeFileSync(photoFullSavePath, buf);
imagePaths.push(`/assets/${photoFileName}`); 
} catch (err) {
 console.error(`Gagal mengunduh gambar ke-${i + 1}:`, err.message);
}
}
let audioUrlSegment = null, musicUrl = null;
let musicTitle = "";
let musicAuthor = "";
const music = photoData.music || photoData.musicInfo || null;
if (music) {
musicUrl = music.playUrl || music.playAddr || music.playAddrLowbr || null;
if (musicUrl) {
try {
const { buf, headers } = await downloadBuffer(musicUrl, page.url());

const audioFileName = `${Date.now()}_audio.mp3`;
const audioFullSavePath = path.resolve('./public/assets', audioFileName);
fs.writeFileSync(audioFullSavePath, buf);
audioUrlSegment = `/assets/${audioFileName}`; 

if (music.title) musicTitle = music.title;
if (music.authorName || music.author) musicAuthor = music.authorName || music.author;
} catch (err) {
 console.error('Gagal mengunduh musik:', err.message);
}
}
}
const photoUrls = imagePaths.map(p => `${global.domain}${p}`);
const audioUrl = audioUrlSegment ? `${global.domain}${audioUrlSegment}` : null;
const meta = {
id: postId || null,
type: "image",
desc: caption || null,
author: {
id: photoData.author?.id || null,
username: photoData.author?.uniqueId || username || null,
nickname: photoData.author?.nickname || null,
},
stats: {
likes: photoData.stats?.diggCount || 0,
share: photoData.stats?.shareCount || 0,
comment: photoData.stats?.commentCount || 0,
views: photoData.stats?.playCount || 0,
save: photoData.stats?.collectCount || 0,
},
createTime: createTime ? new Date(createTime).toISOString() : null,
music: {
title: musicTitle || null,
author: musicAuthor || null,
},
url: cleanUrl,
scrapedAt: new Date().toISOString(),
};

return {
type: "image",
photoUrls: photoUrls, 
audioUrl: audioUrl, 
meta,
};
} catch (err) {
console.error('❌ Error (Image Post):', err.message);
return null;
} finally {
try { await page.close(); } catch {}
try { await context.close(); } catch {}
try { await browser.close(); } catch {}
}
}
if (isVideoPost) {
const iphone = devices['iPhone 13'];
const args = [
'--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas',
'--disable-accelerated-jpeg-decoding', '--disable-accelerated-video-decode', '--disable-audio-output',
'--disable-background-networking', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
'--disable-breakpad', '--disable-client-side-phishing-detection', '--disable-component-update', '--disable-default-apps',
'--disable-domain-reliability', '--disable-extensions', '--disable-features=TranslateUI,BlinkGenPropertyTrees,AudioServiceOutOfProcess',
'--disable-hang-monitor', '--disable-ipc-flooding-protection', '--disable-renderer-backgrounding', '--disable-sync',
'--disable-software-rasterizer', '--mute-audio', '--no-default-browser-check', '--no-first-run', '--metrics-recording-only',
'--password-store=basic', '--use-mock-keychain', '--headless=new', '--blink-settings=imagesEnabled=false',
'--hide-scrollbars', '--window-size=1,1'
];
const browser = await chromium.launch({ headless: true, args });
const context = await browser.newContext({
...iphone,
userAgent: iphone.userAgent,
locale: 'en-US',
});
const page = await context.newPage();

function extFromContentType(ct) {
if (!ct) return null;
ct = ct.split(';')[0].trim().toLowerCase();
if (ct.includes('mp4')) return '.mp4';
if (ct.includes('mpeg')) return '.mp3';
if (ct.includes('audio') && ct.includes('mp4')) return '.m4a';
if (ct.includes('webm')) return '.webm';
if (ct.includes('ogg')) return '.ogg';
return null;
}

async function downloadBuffer(url, referer) {
const headers = {
Referer: referer || 'https://www.tiktok.com/',
Accept: 'video/mp4,video/*;q=0.9,*/*;q=0.8'
};
const resp = await context.request.get(url, { headers, failOnStatusCode: false });
if (!resp) throw new Error('No response');
if (resp.status() >= 400)
throw new Error(`HTTP ${resp.status()} when downloading ${url}`);
return { buf: await resp.body(), headers: resp.headers() };
}

function findVideoDataFromJson(json) {
if (!json || typeof json !== 'object') return null;
let found = null;
function scan(obj) {
if (!obj || typeof obj !== 'object' || found) return;
if (obj.itemStruct && obj.itemStruct.video) found = obj.itemStruct;
if (obj.video && (obj.id || obj.createTime || obj.desc)) found = obj;
for (const k of Object.keys(obj)) {
try { scan(obj[k]); if (found) return; } catch {}
}
}
scan(json);
return found;
}

try {
await page.goto(cleanUrl, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);

let raw = await page.locator('#__UNIVERSAL_DATA_FOR_REHYDRATION__').textContent().catch(() => null);
let json = null;
if (raw) {
try { json = JSON.parse(raw); }
catch (e) {
const m = raw.match(/\{[\s\S]*\}/);
if (m) try { json = JSON.parse(m[0]); } catch {}
}
}
if (!json) {
const allScripts = await page.$$eval('script[type="application/json"], script', els => els.map(e => e.textContent).filter(Boolean));
for (const s of allScripts) {
if (s.includes('itemStruct') || s.includes('playAddr')) {
try { json = JSON.parse(s); break; }
catch (e) {
const m = s.match(/\{[\s\S]*\}/);
if (m) try { json = JSON.parse(m[0]); break; } catch {}
}
}
}
}
if (!json) throw new Error('JSON not found');
const scope = json.__DEFAULT_SCOPE__ || json;
const videoData = findVideoDataFromJson(scope);
if (!videoData) throw new Error('video data not found');

let candidateUrls = [];
if (videoData.video) {
if (typeof videoData.video.playAddr === 'string') candidateUrls.push(videoData.video.playAddr);
if (videoData.video.playAddrStruct?.UrlList) candidateUrls.push(...videoData.video.playAddrStruct.UrlList);
}
if (videoData.playAddr) candidateUrls.push(videoData.playAddr);
candidateUrls = [...new Set(candidateUrls.filter(Boolean))];

if (!candidateUrls.length) throw new Error('No candidate video URLs found');
const videoFileName = videoData.id ? `${videoData.id}.mp4` : `${Date.now()}.mp4`; 
const videoFullSavePath = path.resolve('./public/assets', videoFileName);
const videoUrlSegment = `/assets/${videoFileName}`; 
let savedVideo = false;
for (const url of candidateUrls) {
try {
const { buf } = await downloadBuffer(url, page.url());
if (!buf || buf.length < 100) continue;

fs.writeFileSync(videoFullSavePath, buf); 
savedVideo = true;
break;
} catch (err) {
console.error(`Gagal mengunduh URL video ${url}:`, err.message);
}
}
let savedAudio = false, audioUrlSegment = null; 
let musicUrl = null;
let musicTitle = null;
let musicAuthor = null;
const music = videoData.music || videoData.musicInfo || null;
if (music) {
musicUrl = music.playUrl || music.playAddr || music.playAddrLowbr || null;
musicTitle = music.title || 'Unknown Title';
musicAuthor = music.authorName || music.author || 'Unknown Artist';

const uniqMusic = [...new Set(normalizeToArray(musicUrl || music.playAddrStruct?.UrlList))];

for (const mUrl of uniqMusic) {
try {
const { buf, headers } = await downloadBuffer(mUrl, page.url());
if (!buf || buf.length < 50) continue;
const audioFileName = `${Date.now()}_audio.mp3`;
const audioFullSavePath = path.resolve('./public/assets', audioFileName);
fs.writeFileSync(audioFullSavePath, buf); 
audioUrlSegment = `/assets/${audioFileName}`; 
savedAudio = true;
break;
} catch (err) {
console.error(`Gagal mengunduh musik URL ${mUrl}:`, err.message);
}
}
}
const videoUrl = savedVideo ? `${global.domain}${videoUrlSegment}` : null;
const audioUrl = savedAudio ? `${global.domain}${audioUrlSegment}` : null;
const meta = {
id: videoData.id || null,
type: "video",
desc: videoData.desc || null,
author: {
id: videoData.author?.id || null,
username: videoData.author?.uniqueId || null,
nickname: videoData.author?.nickname || null,
},
stats: {
likes: videoData.stats?.diggCount || 0,
share: videoData.stats?.shareCount || 0,
comment: videoData.stats?.commentCount || 0,
views: videoData.stats?.playCount || 0,
save: videoData.stats?.collectCount || 0,
},
createTime: videoData.createTime
? new Date(videoData.createTime * 1000).toISOString()
: null,
music: {
title: musicTitle,
author: musicAuthor,
},
url: cleanUrl,
scrapedAt: new Date().toISOString(),
};

return {
type: "video",
videoUrl: videoUrl, 
audioUrl: audioUrl, 
meta,
};
} catch (err) {
console.error('❌ Error (Video Post):', err.message);
return null;
} finally {
try { await page.close(); } catch {}
try { await context.close(); } catch {}
try { await browser.close(); } catch {}
}
}
}

async function instagramscrape(instaUrl) {
class CustomError extends Error { constructor(m,s=500){super(m);this.name='CustomError';this.status=s;} }
const isImagePost = /\/p\//.test(instaUrl);
const isVideoPost = /\/reel\/|\/reels\//.test(instaUrl);
if (!isImagePost && !isVideoPost) throw new CustomError('Invalid Instagram URL',400);
const args=[
'--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-accelerated-2d-canvas',
'--disable-accelerated-jpeg-decoding','--disable-accelerated-video-decode','--disable-audio-output',
'--disable-background-networking','--disable-background-timer-throttling','--disable-backgrounding-occluded-windows',
'--disable-breakpad','--disable-client-side-phishing-detection','--disable-component-update','--disable-default-apps',
'--disable-domain-reliability','--disable-extensions','--disable-features=TranslateUI,BlinkGenPropertyTrees,AudioServiceOutOfProcess',
'--disable-hang-monitor','--disable-ipc-flooding-protection','--disable-renderer-backgrounding','--disable-sync',
'--disable-software-rasterizer','--mute-audio','--no-default-browser-check','--no-first-run','--metrics-recording-only',
'--password-store=basic','--use-mock-keychain','--headless=new','--blink-settings=imagesEnabled=false',
'--hide-scrollbars','--window-size=1,1'
];
const browser = await chromium.launch({ headless: true, args });
const page = await browser.newPage();
let result = {};
const metadataRegex = /^([\d,]+)\s+likes,?\s*([\d,]+)\s+comments\s*-\s*(\w+)\s+on\s+([^:]+):\s*['"]?/i;
try {
if (isImagePost) {
const match = instaUrl.match(/\/p\/([a-zA-Z0-9_-]+)\//);
if (!match) throw new CustomError('Invalid Instagram URL', 400);
const SHORTCODE = match[1];
const thumbOeSet = new Set();
const fullUrls = new Set();
let caption = '';
let postUrl = instaUrl;
page.on('response', async (response) => {
const url = response.url();
if (!url.startsWith('https://www.instagram.com/graphql/query/?doc_id=')) return;
try {
const ct = (response.headers()['content-type'] || '').toLowerCase();
if (!ct.includes('application/json')) return;
const json = await response.json();
if (!json) return;
const findThumbnailOe = (obj) => {
if (!obj || typeof obj !== 'object') return;
if (obj.shortcode === SHORTCODE && obj.thumbnail_src) {
const thumbUrl = obj.thumbnail_src.replace(/\\u0026/g, '&');
const oe = new URL(thumbUrl).searchParams.get('oe');
if (oe) thumbOeSet.add(oe);
}
for (const v of Object.values(obj)) findThumbnailOe(v);
};
const collectFullUrls = (obj) => {
if (!obj || typeof obj !== 'object') return;
const checkAndAdd = (urlStr) => {
const fixedUrl = urlStr.replace(/\\u0026/g, '&');
const urlObj = new URL(fixedUrl);
const oe = urlObj.searchParams.get('oe');
const stp = urlObj.searchParams.get('stp') || '';
if (oe && thumbOeSet.has(oe) && stp.includes('dst-')) {
fullUrls.add(fixedUrl);
}
};
if (obj.display_url) checkAndAdd(obj.display_url);
if (obj.edge_sidecar_to_children?.edges) {
for (const e of obj.edge_sidecar_to_children.edges) {
if (e.node?.display_url) checkAndAdd(e.node.display_url);
}
}
for (const v of Object.values(obj)) collectFullUrls(v);
};
findThumbnailOe(json);
collectFullUrls(json);
} catch (e) {
console.warn(' Parsing error :', e.message);
}
});
await page.goto(instaUrl, { waitUntil: 'networkidle' });
let waited = 0;
while (fullUrls.size === 0 && waited < 7000) {
await new Promise(r => setTimeout(r, 500));
waited += 500;
}
const html = await page.content();
const $ = cheerio.load(html);
caption = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
caption = caption.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
postUrl = $('meta[property="og:url"]').attr('content') || instaUrl;
const media = Array.from(fullUrls);
const matchMetadata = caption.match(/^([\d\.\,KM]+)\s+likes,?\s*([\d\.\,KM]+)\s+comments\s*-\s*(\S+)\s+on\s+([^:]+):?\s*/i);
let likes = '0';
let comments = '0';
let authorUsername = null;
let createdAtDate = null;
if (matchMetadata) {
likes = matchMetadata[1];
comments = matchMetadata[2]; 
authorUsername = matchMetadata[3];
createdAtDate = matchMetadata[4].trim();
caption = caption.substring(matchMetadata[0].length).trim();
}
caption = caption.replace(/['"]\s*$/, '').trim();
caption = caption.replace(/\s{2,}/g, ' ').trim();
const hashtags = [...(caption.match(/#\w+/g) || [])];
const mentions = [...(caption.match(/@[\w\.]+/g) || [])];
result = {
type: 'image',
media,
postUrl,
caption,
authorUsername,
likes,
comments,
createdAtDate,
hashtags,
mentions
};
}
if (isVideoPost) {
let videoUrl = null;
page.on('response', async response => {
const url = response.url();
if (!url.startsWith('https://www.instagram.com/graphql/query/?doc_id=')) return;
try {
const ct = (response.headers()['content-type'] || '').toLowerCase();
if (!ct.includes('application/json')) return;
const json = await response.json();
if (!json) return;
if(json.shortcode_media?.video_url && !videoUrl){
videoUrl = json.shortcode_media.video_url.replace(/\\u0026/g, '&');
}
} catch(e){ console.warn('JSON parse failed:', e.message); }
});
await page.goto(instaUrl,{waitUntil:'networkidle'});
await page.waitForTimeout(3000);
const $ = cheerio.load(await page.content());
if(!videoUrl) videoUrl = $('video').attr('src');
if(!videoUrl) throw new CustomError('Video media not found',404);
let caption = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
caption = caption.replace(/\n+/g,' ').replace(/\s{2,}/g,' ').trim();
const matchMetadata = caption.match(metadataRegex);
let likes = 0;
let comments = 0;
let authorUsername = null;
let createdAtDate = null;
if (matchMetadata) {
likes = parseInt(matchMetadata[1].replace(/,/g, ''), 10);
comments = parseInt(matchMetadata[2].replace(/,/g, ''), 10);
authorUsername = matchMetadata[3];
createdAtDate = matchMetadata[4].trim();
caption = caption.substring(matchMetadata[0].length).trim();
} 
caption = caption.replace(/['"]\s*$/, '').trim();
caption = caption.replace(/\s{2,}/g, ' ').trim(); 
const hashtags = [...(caption.match(/#\w+/g)||[])];
const mentions = [...(caption.match(/@\w+/g)||[])];
result = {
type: 'video',
media: [videoUrl],
postUrl: $('meta[property="og:url"]').attr('content')||instaUrl,
caption, 
authorUsername,
likes,
comments,
createdAtDate, 
hashtags,
mentions
};
}
} catch(e){ throw e instanceof CustomError?e:new CustomError(e.message); }
finally { if(page) await page.close().catch(()=>{}); if(browser) await browser.close().catch(()=>{}); }
return result;
}

async function tracking(trackingNumber) {
if (!trackingNumber) return null;
const HOME_URL = 'https://www.tracking.my/';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const DETECT_TIMEOUT = 8000; 
const TRACK_WAIT = 10000;
const BLOCK_RESOURCES = ['image', 'media', 'font'];
const browser = await chromium.launch({
headless: true,
args: [
'--no-sandbox',
'--disable-setuid-sandbox',
'--disable-dev-shm-usage',
'--disable-gpu',
'--mute-audio',
'--hide-scrollbars'
]
});
const context = await browser.newContext({
userAgent: USER_AGENT,
viewport: { width: 1200, height: 900 }
});
const page = await context.newPage();
await page.route('**/*', route => {
try {
const t = route.request().resourceType();
const u = route.request().url();
if (BLOCK_RESOURCES.includes(t) || u.match(/\.(png|jpe?g|webp|svg|gif|mp4|webm|ogg)(\?.*)?$/i)) {
return route.abort();
}
} catch (e) {}
return route.continue();
});
let detectedCourier = null;
let detectRawFrames = [];
let trackingResult = null;
page.on('websocket', ws => {
const wsUrl = ws.url();
ws.on('framereceived', ev => {
try {
const j = JSON.parse(ev.payload);
detectRawFrames.push({ wsUrl, payload: j });
if (!detectedCourier && j?.courier) detectedCourier = j.courier;
if (!trackingResult && (j?.result || j?.latest_status || j?.tracking_result || j?.delivery_date)) {
trackingResult = { source: 'ws-frame', wsUrl, data: j };
}
} catch {}
});
ws.on('framesent', ev => {
try {
const j = JSON.parse(ev.payload);
detectRawFrames.push({ wsUrl, outgoing: j });
} catch {}
});
});
try {
await page.goto(HOME_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
const selectors = [
'#formTrackingInputModal', 
'#formTrackingInputSidebar',
'input[id^="formTrackingInput"]',
'input[type="text"].text-uppercase', 
'input[placeholder*="Tracking number"]'
];
let inputHandle = null;
for (const sel of selectors) {
try { const h = await page.$(sel); if (h) { inputHandle = h; break; } } catch {}
}
if (!inputHandle) inputHandle = await page.$('input[type="text"]');
if (!inputHandle) throw new Error('Could not find tracking input on homepage.');
await inputHandle.focus();
await page.evaluate(el => el.value = '', inputHandle);
await inputHandle.type(trackingNumber, { delay: 20 });
await page.evaluate(el => el.dispatchEvent(new Event('input', { bubbles: true })), inputHandle);
const detectStart = Date.now();
while (!detectedCourier && Date.now() - detectStart < DETECT_TIMEOUT) await new Promise(r => setTimeout(r, 150));
if (!detectedCourier) {
for (let f of detectRawFrames) {
if (f.payload?.courier) { detectedCourier = f.payload.courier; break; }
}
}
if (!detectedCourier) {
try {
await page.evaluate(tn => {
const el = document.querySelector('input[type="text"].text-uppercase') || document.querySelector('input[placeholder*="Tracking number"]');
if (el) { el.value = tn; el.dispatchEvent(new Event('input', { bubbles: true })); }
}, trackingNumber);
const extraStart = Date.now();
while (!detectedCourier && Date.now() - extraStart < 3000) await new Promise(r => setTimeout(r, 150));
} catch {}
}
if (!detectedCourier) {
if (trackingResult) return trackingResult.data;
return { found: false, reason: 'courier_not_detected', detectFrames: detectRawFrames.length };
}
const trackingUrl = `https://www.tracking.my/${detectedCourier}/${trackingNumber}`;
await page.goto(trackingUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
const trackStart = Date.now();
while (!trackingResult && Date.now() - trackStart < TRACK_WAIT) await new Promise(r => setTimeout(r, 200));
if (trackingResult) {
return { found: true, source: trackingResult.source, wsUrl: trackingResult.wsUrl, courier: detectedCourier, data: trackingResult.data };
} else {
let pageJson = null;
try {
const content = await page.evaluate(() => {
const ids = ['#__UNIVERSAL_DATA_FOR_REHYDRATION__', '#__APP_DATA__', '#__NUXT__', '#__NEXT_DATA__'];
for (const id of ids) { const el = document.querySelector(id); if (el?.textContent) return el.textContent; }
const scripts = Array.from(document.querySelectorAll('script[type="application/json"], script[id*="__UNIVERSAL"]'));
for (const s of scripts) if (s.textContent) return s.textContent;
return document.body?.innerText || null;
});
if (content) { const m = content.match(/\{[\s\S]*\}/); if (m) pageJson = JSON.parse(m[0]); }
} catch {}
if (pageJson) return { found: true, source: 'page-json', data: pageJson };
return { found: false, reason: 'no-tracking-data-captured', detectFrames: detectRawFrames.length };
}
} catch (err) {
return { error: true, message: err.message };
} finally {
try { await page.close(); } catch {}
try { await context.close(); } catch {}
try { await browser.close(); } catch {}
}
}
module.exports = {tracking, instagramscrape, tiktokscrape,getTiktokInfo,ssweb, gtguide, myanimelist, mediafire, SKurama, DKurama, getMotionBG, randomHentai };