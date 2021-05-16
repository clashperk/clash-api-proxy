import Env from 'dotenv';
Env.config();

import express, { Request, Response, NextFunction } from 'express';
import { stringify, ParsedUrlQueryInput } from 'querystring';
import Client from './Client';
import cors from 'cors';

const client = new Client();
const app = express();

const log = (req: Request, res: Response, next: NextFunction) => {
	const address = req.headers['x-real-ip'] || req.socket.remoteAddress?.replace(/[^0-9|.]+/gi, '');
	console.log(`[${address}] ${req.method} ${req.path}`);
	next();
};

app.use(cors());
app.get('/', (req, res) => {
	return res.status(200).json({ status: 'ok' });
});

app.use(log, async (req, res) => {
	const response = await client.fetch(`${req.path}?${stringify(req.query as ParsedUrlQueryInput)}`);
	return res.status(response.statusCode).json(response.data);
});

(async () => {
	await client.login();

	app.listen(process.env.PORT, () => {
		console.log(`[SERVER] Proxy Listening on Port ${process.env.PORT}`);
	});
})();
