require('dotenv').config();
const url = require('url');
const cors = require('cors');
const express = require('express');
const proxy = require('express-http-proxy');
const { Client } = require('clashofclans.js');
const client = new Client({ token: process.env.TOKEN, timeout: 3000 });
const port = process.env.PORT || 8080;
const app = express();

const getIP = (req) => {
	return req.headers['x-real-ip'] || req.connection && req.connection.remoteAddress && req.connection.remoteAddress.replace(/[^0-9|.]+/gi, '')
}

app.use(cors());

app.get('/', (req, res) => {
	return res.send('You are in the wrong part of town!');
});

app.use(async (req, res) => {
	if (req.headers.token !== process.env.AUTH) return res.status(403).json({ message: 'Invalid Authorization' });
	console.log(`[${getIP(req)}] GET ${url.parse(req.url).path}`);
	const response = await client.fetch(`https://api.clashofclans.com${url.parse(req.url).path}`).catch(() => null);
	if (!response) return res.status(504).json({});
	return res.status(response.status).json(response);
});

/* app.use(proxy('https://api.clashofclans.com', {
	filter: function (req, res) {
		return req.method == 'GET';
	},
	proxyReqPathResolver: function (req, res) {
		console.log(`[${getIP(req)}] GET ${url.parse(req.url).path}`)
		return url.parse(req.url).path;
	},
	proxyReqOptDecorator: function (req) {
		req.headers['Authorization'] = req.headers.authorization || `Bearer ${token}`;
		return req;
	}
}));*/

app.listen(port, () => {
	console.log(`Proxy Listening on Port ${port}`);
});
