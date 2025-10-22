const express = require("express");
const router = express.Router();
const { tracking, instagramscrape, tiktokscrape,getTiktokInfo,ssweb, gtguide, myanimelist, mediafire, SKurama, DKurama, getMotionBG, randomHentai } = require("../lib/Listapi");
const { requireOwner, requireLogin,checkLimit } = require('../lib/ServerF');
//=====================
router.get("/instagram", requireLogin,checkLimit, async (req, res) => {
const url = req.query.url;
if (!url) return res.status(400).json({ error: "Missing URL query parameter" });

try {
const data = await instagramscrape(url);
res.json({ success: true, data });
} catch(e) {
res.status(e.status || 500).json({ success: false, error: e.message });
}
});
//=====================
router.get("/tiktok", requireLogin,checkLimit, async (req, res) => {
const url = req.query.url;
if (!url) return res.status(400).json({ error: "Missing URL query parameter" });

try {
const data = await tiktokscrape(url);
res.json({ success: true, data });
} catch(e) {
res.status(e.status || 500).json({ success: false, error: e.message });
}
});
//=====================
router.get("/ssweb", requireLogin, checkLimit, async (req, res) => {
const url = req.query.url;
if (!url) return res.status(400).json({ error: "Missing URL query parameter" });
const opts = {
mode: req.query.mode,
quality: 80,
cleanMode: req.query.cleanMode !== "false"
};
try {
const data = await ssweb(url, opts);
res.json({ success: true, data });
} catch (e) {
res.status(e.status || 500).json({ success: false, error: e.message });
}
});
//=====================
// TikTok user info
router.get("/tiktokinfo", async (req, res) => {
const { username } = req.params;
if (!username) return res.status(400).json({ success: false, error: "Username required" });
try {
const data = await getTiktokInfo(username);
res.json({ success: true, data });
} catch (e) {
res.status(500).json({ success: false, error: e.message });
}
});

// MyAnimeList search
router.get("/mal", async (req, res) => {
const query = req.query.q;
const type = req.query.type || "anime";
if (!query) return res.status(400).json({ success: false, error: "Query required" });
try {
const data = await myanimelist(query, type);
res.json({ success: true, data });
} catch (e) {
res.status(500).json({ success: false, error: e.message });
}
});

// Mediafire download info
router.get("/mediafire", async (req, res) => {
const url = req.query.url;
if (!url) return res.status(400).json({ success: false, error: "URL required" });
try {
const data = await mediafire(url);
res.json({ success: !!data, data });
} catch (e) {
res.status(500).json({ success: false, error: e.message });
}
});

// Random Hentai
router.get("/hentai", async (req, res) => {
const galleryId = req.query.id || null;
const maxPages = parseInt(req.query.max) || 10;
try {
const data = await randomHentai(galleryId, maxPages);
res.json({ success: !!data, data });
} catch (e) {
res.status(500).json({ success: false, error: e.message });
}
});

// MotionBG
router.get("/motionbg", async (req, res) => {
const text = req.query.q;
try {
const data = await getMotionBG(text);
res.json({ success: !!data, data });
} catch (e) {
res.status(500).json({ success: false, error: e.message });
}
});

// SKurama search
router.get("/skurama", async (req, res) => {
const query = req.query.q;
const limit = parseInt(req.query.limit) || 5;
if (!query) return res.status(400).json({ success: false, error: "Query required" });
try {
const data = await SKurama(query, limit);
res.json({ success: true, data });
} catch (e) {
res.status(500).json({ success: false, error: e.message });
}
});

// DKurama download links
router.get("/dkurama", async (req, res) => {
const url = req.query.url;
if (!url) return res.status(400).json({ success: false, error: "URL required" });
try {
const data = await DKurama(url);
res.json({ success: !!data, data });
} catch (e) {
res.status(500).json({ success: false, error: e.message });
}
});

// tracking endpoint
router.get('/tracking', async (req, res) => {
const trackingNumber = req.query.number; 
if (!trackingNumber) {
return res.status(400).json({ success: false, error: "Tracking number is required" });
}

try {
const data = await tracking(trackingNumber);
res.json({ success: true, data });
} catch (err) {
console.error("Tracking error:", err.message);
res.status(500).json({ success: false, error: err.message });
}
});

module.exports = router;