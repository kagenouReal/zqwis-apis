require('../../config');
const os = require('os');
const {parseInterval, runtime, loadDatabase, saveDatabase } = require('./LoadDB');
const fs = require('fs');
const path = require('path');
global.db = loadDatabase();
//=============
function checkLimit(req, res, next) {
const apiKey = req.query.apikey || req.headers['x-api-key'];
if (apiKey && apiKey === global.apikey) {
req.session = req.session || {};
req.session.username = global.username;
return next();
}
const username = req.session?.username;
let user = global.db?.users?.[username];
const isMainOwner = username === global.username;
if (!user && isMainOwner) {
user = { role: 'owner', usage: 0 };
}
if (!user) {
return res.status(403).json({ error: '404: User nya gk ada', redirect: '/' });
}
const role = user.role || 'user';
const limits = global.limitConfig || {
user: 15,
premium: 30,
owner: Infinity
};
if (!user.usage) user.usage = 0;
if (user.usage >= limits[role]) {
return res.status(429).json({
success: false,
error: `429: Limit ${role} Habis, Tunggu Reset Lagi!`
});
}
user.usage++;
if (!isMainOwner) {
global.db.users[username] = user;
saveDatabase(global.db);
}
next();
}
//============
async function resetUsageAll() {
if (global.db && global.db.users) {
for (const email in global.db.users) {
if (global.db.users[email]) {
global.db.users[email].usage = 0;
console.log(`Reset Limit untuk user ${email}`);
}
}
if (typeof saveDatabase === 'function') {
saveDatabase(global.db);
}
console.log('[Limit] Semua usage berhasil direset');
}
const folderPath = path.join(__dirname, '../../public/assets');
const whitelist = ['logo.png', 'mine.mp4', 'miyu.mp4', 'sagiri.gif', 'saku.mp4', 'Snow.js'];
try {
const files = await fs.promises.readdir(folderPath);
for (const file of files) {
if (!whitelist.includes(file)) {
const filePath = path.join(folderPath, file);
const stats = await fs.promises.stat(filePath);
if (stats.isFile()) {
await fs.promises.unlink(filePath);
} else if (stats.isDirectory()) {
await fs.promises.rm(filePath, { recursive: true, force: true });
}
}
}
console.log('[Assets] Folder assets telah dibersihkan');
} catch (err) {
console.error('Error bersihin assets:', err);
}
}
//============
function requireLogin(req, res, next) {
const apiKeyRaw =
req.query.apikey ??
req.query.apiKey ??
req.headers['x-api-key'] ??
req.headers['X-API-KEY'] ??
(req.headers.authorization && req.headers.authorization.split(' ')[1]) ??
null;
const apiKey = apiKeyRaw ? String(apiKeyRaw).trim() : null;
function isValidApiKey(key) {
if (!key) return false;
const g = global.apikey ? String(global.apikey).trim() : null;
if (g && key.toLowerCase() === g.toLowerCase()) return { type: 'global', username: global.username };
const users = global.db?.users || {};
for (const [username, data] of Object.entries(users)) {
if (data?.apiKey && String(data.apiKey).trim().toLowerCase() === key.toLowerCase()) {
return { type: 'user', username };
}
}
return false;
}
const valid = isValidApiKey(apiKey);
if (valid) {
req.session = req.session || {};
req.session.username = valid.username || 'api';
req.session.loggedIn = true;
return next();
}
if (req.path.startsWith('/api')) {
if (!apiKey) return res.status(401).json({ success: false, error: '401: API key required' });
return res.status(401).json({ success: false, error: '401: Invalid API key' });
}
if (!req.session?.loggedIn) return res.redirect('/');
next();
}
//============
function preventLoginIfLoggedIn(req, res, next) {
if (req.session.loggedIn) {
return res.redirect('/dashboard'); 
}
next();
}
//============
function requireOwner(req, res, next) {
const apiKey = req.query.apikey || req.headers['x-api-key'];
if (apiKey && apiKey === global.apikey) {
req.session = req.session || {};
req.session.username = global.username;
return next();
}
const foundUser = Object.entries(global.db?.users || {})
.find(([uname, data]) => data.apiKey === apiKey);
if (foundUser) {
const [username, data] = foundUser;
if (data.role !== 'owner') {
return res.status(403).json({ error: "403: Lu Bukan Owner Anjg" });
}
req.session = req.session || {};
req.session.username = username;
return next();
}
if (!req.session?.loggedIn || !req.session.username) {
return res.status(401).json({ error: "401: Pergi Login Dulu Anjg" });
}
const username = req.session.username;
let sessionUser = global.db?.users?.[username];
if (!sessionUser && username === global.username) {
sessionUser = { role: 'owner' };
}
if (!sessionUser) {
return res.status(404).json({ error: "404: User nya gk ada", redirect: '/' });
}
if (sessionUser.role !== 'owner') {
if (req.headers.accept?.includes('application/json')) {
return res.status(403).json({ error: "403: Lu Bukan Owner Anjg", redirect: '/' });
} else {
return res.redirect('/');
}
}
return next();
}
//============
module.exports = { requireOwner, preventLoginIfLoggedIn, requireLogin, resetUsageAll, checkLimit };