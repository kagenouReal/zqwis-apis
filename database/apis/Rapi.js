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
router.get("/tiktokinfo",requireLogin,checkLimit, async (req, res) => {
const { username } = req.params;
if (!username) return res.status(400).json({ success: false, error: "Username required" });
try {
const data = await getTiktokInfo(username);
res.json({ success: true, data });
} catch (e) {
res.status(500).json({ success: false, error: e.message });
}
});
//=====================
router.get("/mal", requireLogin,checkLimit,async (req, res) => {
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
//=====================
router.get("/mediafire", requireLogin,checkLimit,async (req, res) => {
const url = req.query.url;
if (!url) return res.status(400).json({ success: false, error: "URL required" });
try {
const data = await mediafire(url);
res.json({ success: !!data, data });
} catch (e) {
res.status(500).json({ success: false, error: e.message });
}
});
//=====================
router.get("/hentai", requireLogin,checkLimit,async (req, res) => {
const galleryId = req.query.id || null;
const maxPages = parseInt(req.query.max) || 10;
try {
const data = await randomHentai(galleryId, maxPages);
res.json({ success: !!data, data });
} catch (e) {
res.status(500).json({ success: false, error: e.message });
}
});
//=====================
router.get("/motionbg",requireLogin,checkLimit, async (req, res) => {
const text = req.query.q;
try {
const data = await getMotionBG(text);
res.json({ success: !!data, data });
} catch (e) {
res.status(500).json({ success: false, error: e.message });
}
});
//=====================
router.get("/skurama", requireLogin,checkLimit,async (req, res) => {
const query = req.query.q;
const limit = parseInt(req.query.limit) || 1;
if (!query) return res.status(400).json({ success: false, error: "Query required" });
try {
const data = await SKurama(query, limit);
res.json({ success: true, data });
} catch (e) {
res.status(500).json({ success: false, error: e.message });
}
});
//=====================
router.get("/dkurama", requireLogin,checkLimit,async (req, res) => {
const url = req.query.url;
if (!url) return res.status(400).json({ success: false, error: "URL required" });
try {
const data = await DKurama(url);
res.json({ success: !!data, data });
} catch (e) {
res.status(500).json({ success: false, error: e.message });
}
});
//====================
router.get('/tracking', requireLogin,checkLimit,async (req, res) => {
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
//=====================
router.get('/gtguide',requireLogin,checkLimit, async (req, res) => {
const name = req.query.name;
if (!name) {
return res.status(400).json({ success: false, error: "Query parameter 'name' required" });
}

try {
const data = await gtguide(name);
if (!data) {
return res.status(404).json({ success: false, error: "Hero not found" });
}
return res.json({ success: true, data });
} catch (err) {
console.error(err);
return res.status(500).json({ success: false, error: err.message });
}
});

module.exports = router;