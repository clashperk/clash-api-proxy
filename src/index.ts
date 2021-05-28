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

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

app.get('/', (req, res) => {
	return res.status(200).json({ status: 'ok' });
});

if (process.env.AUTHORIZATION) {
	app.use((req, res, next) => {
		if (req.headers.authorization?.split(/ +/g).pop() !== process.env.AUTHORIZATION) {
			return res.status(403).json({ message: 'Missing Authorization Token!', reason: 'accessDenied' });
		}
		next();
	});
}

app.use(log, async (req, res) => {
	const response = await client.fetch(`${req.path}?${stringify(req.query as ParsedUrlQueryInput)}`);
	return res.status(response.statusCode).json(response.data);
});

(async () => {
	await client.init();

	app.listen(process.env.PORT, () => {
		console.log(`[SERVER] Listening on Port ${process.env.PORT}`);
	});
})();
