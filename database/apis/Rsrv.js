require("../../config");
const express = require("express");
const router = express.Router();
const path = require("path");
const { requireOwner, requireLogin, checkLimit } = require("../lib/ServerF");
const { saveDatabase } = require("../lib/LoadDB");

//===================== 
router.post("/auth", async (req, res) => {
const { email, password } = req.body;
const userEntry = Object.entries(global.db.users).find(([username, user]) =>
(user.email === email || username === email) && user.password === password
);

const handleLogin = async (username, user, role = user.role || "user") => {
req.session.loggedIn = true;
req.session.email = user.email;
req.session.username = username;
req.session.role = role;
res.json({ success: true, role, username });
};

if (userEntry) {
const [username, user] = userEntry;
return handleLogin(username, user);
}

if (email === global.username && password === global.password) {
return handleLogin(email, { email }, "owner");
}

return res.status(401).json({
success: false,
message: "Email atau password salah!",
});
});

//===================== 
router.get("/auth/info", requireLogin, (req, res) => {
const email = req.session.email;
const users = global.db?.users || {};
const user = Object.values(users).find((u) => u.email === email);

if (email === global.username) {
return res.json({ email, role: "owner" });
}

if (!user) {
return res.status(404).json({
error: "User tidak ditemukan!",
redirect: "/",
});
}

return res.json({ email, role: user.role });
});

//===================== 
router.post("/logout", requireLogin, async (req, res) => {
if (!req.session.loggedIn)
return res.status(403).send("Forbidden: belum login");
const username = req.session.username;
console.log(`[${username}] User logout.`);
req.session.destroy((err) => {
if (err) {
console.error("Session destroy error:", err);
return res.status(500).send("Logout gagal");
}
res.redirect("/");
});
});
//===================== 
router.post("/create-user", requireLogin, requireOwner, (req, res) => {
let { username, password, role } = req.body;
username = username?.toLowerCase()?.trim();
password = password?.trim();
role = role?.toLowerCase();

if (!username || !password || !role) {
return res
.status(400)
.json({ error: "Isi semua data (username, password, role)" });
}

if (global.db.users[username]) {
return res.status(409).json({ error: "User sudah ada!" });
}

const generateApiKey = (length = 16) => {
const chars =
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
return Array.from({ length }, () =>
chars.charAt(Math.floor(Math.random() * chars.length))
).join("");
};

const apiKey = `API_${generateApiKey(24)}`;
const email = `${username}@api.local`;

global.db.users[username] = {
email,
password,
role,
apiKey,
usage: 0,
};

saveDatabase(global.db);

res.json({
success: true,
message: `User ${username} berhasil dibuat.`,
apiKey,
role,
password,
email,
});
});

//===================== 
router.post("/delete-user", requireLogin, requireOwner, async (req, res) => {
const { email } = req.body;
if (!email) return res.status(400).json({ error: "Email tidak boleh kosong" });

const userEntry = Object.entries(global.db.users).find(
([, user]) => user.email === email
);

if (!userEntry)
return res.status(404).json({ error: "User tidak ditemukan" });

const [username] = userEntry;
const isSelfDelete = req.session.email === email;

delete global.db.users[username];
saveDatabase(global.db);

if (isSelfDelete) {
req.session.destroy(() => {
res.json({
success: true,
message: "Akun Anda telah dihapus.",
redirect: "/",
});
});
} else {
res.json({
success: true,
message: `User ${email} berhasil dihapus.`,
});
}
});

//===================== 
router.get("/list-users", requireLogin, requireOwner, (req, res) => {
try {
const users = Object.entries(global.db.users).map(([username, user]) => ({
username,
email: user.email,
password: user.password,
role: user.role,
apiKey: user.apiKey,
usage: user.usage || 0,
}));
res.json({ users });
} catch (e) {
console.error("Error saat ambil user:", e);
res.status(500).json({ error: "Gagal ambil data user" });
}
});

//===================== 
router.get("/cekapikey", requireLogin, (req, res) => {
const email = req.session.email;
const users = global.db?.users || {};
const user = Object.values(users).find((u) => u.email === email);

if (email === global.username) {
return res.json({ apikey: global.apikey });
}

if (!user)
return res.status(404).json({ error: "User tidak ditemukan!" });

res.json({ apikey: user.apiKey });
});
//===================== 
router.get("/domain-info", (req, res) => {
res.json({
success: true,
domain: global.domain
});
});
//===================== 
module.exports = router;