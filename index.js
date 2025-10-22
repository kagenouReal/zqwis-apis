/*
WELCOME TO ZSTRESZER
-----
Name: Zstreszer
Creator: Kagenou
Helper: Chatgpt
*/
//============
require('./config');
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs-extra');
const rateLimit = require('express-rate-limit');
const {parseInterval, loadDatabase } = require('./database/lib/LoadDB');
const {requireOwner, preventLoginIfLoggedIn, requireLogin, resetUsageAll } = require('./database/lib/ServerF');
//============
//Database Load
global.db = loadDatabase();
setInterval(() => {
resetUsageAll(); 
}, parseInterval());
//===========
//Server Start
const app = express();
const PORT = global.port;
app.use((req, res, next) => {
console.log(`[ PESAN ] ${req.method} ${req.url}`);
next();
});
//============
const limiter = rateLimit({
windowMs: 15 * 60 * 1000, 
max: 1000,
handler: (req, res, next) => {
res.status(502).send(`
<html>
<head>
<title>502 Bad Gateway</title>
<style>
body {
background-color: #1e1e1e;
color: #fff;
font-family: monospace;
display: flex;
justify-content: center;
align-items: center;
height: 100dvh;
flex-direction: column;
}
h1 {
font-size: 5em;
margin: 0;
}
p {
font-size: 1.5em;
margin-top: 10px;
color: #aaa;
}
</style>
</head>
<body>
<h1>502</h1>
<p>Bad Gateway Detected - Jangan nyepam woi!</p>
</body>
</html>
`);
},
headers: true
});
//============
app.use(session({
secret: 'Kagenou-Ganteng',
resave: false,
saveUninitialized: true,
cookie: { secure: false }
}));
app.use(limiter);
app.use(express.json());
//============
app.use((req, res, next) => {
if (req.path.endsWith(".html") && !req.session.loggedIn) {
return res.redirect("/");
}
next();
});
app.use(express.static(path.join(__dirname, 'public')));
//============
//APIS Router
const srvApi = require('./database/apis/Rsrv');
const mainApi = require('./database/apis/Rapi');
app.use('/api', srvApi,mainApi);
//============
//Router Html
app.get('/', preventLoginIfLoggedIn, (req, res) => {
res.sendFile(path.join(__dirname, 'public/login/acces.html'))});
//
app.get('/dashboard', requireLogin, (req, res) => {
res.sendFile(path.join(__dirname, 'public/dashboard/home.html'))});
//
app.get('/cadmin', requireLogin, requireOwner, (req, res) => {
res.sendFile(path.join(__dirname, 'public/cadmin/own.html'))});
//
app.get('/docsmenu', requireLogin, (req, res) => {
res.sendFile(path.join(__dirname, 'public/docsmenu/apishelp.html'));
});
//============
app.use((req, res, next) => {
const notFoundPage = path.join(__dirname, 'public/404.html')
if (fs.existsSync(notFoundPage)) {
res.status(404).sendFile(notFoundPage);
} else {
res.status(404).send('404 - Not Found');
}});
//============
app.use((err, req, res, next) => {
console.error(`[ERROR] ${err.stack}`);
res.status(500).send('500 - Server Error');
next();
});
//============
console.log(`███████╗████████╗██████╗ ███████╗███████╗███████╗  
╚══███╔╝╚══██╔══╝██╔══██╗██╔════╝██╔════╝██╔════╝  
  ███╔╝    ██║   ██████╔╝█████╗  ███████╗███████╗  
 ███╔╝     ██║   ██╔══██╗██╔══╝  ╚════██║╚════██║  
███████╗   ██║   ██║  ██║███████╗███████║███████║  
╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝`)  
app.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`)});  
