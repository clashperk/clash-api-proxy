import { Extension } from 'clashofclans.js';
import fetch from 'node-fetch';

const ext = new Extension({
	keyCount: 1,
	keyName: 'ClashPerk_API_Proxy_Token',
	email: process.env.SUPERCELL_EMAIL!,
	password: process.env.SUPERCELL_PASSWORD!
});

export default class Client {
	private tokens: string[] = [];
	private timeout = 30000;
	private tokenIndex = 0;

	private get token() {
		const token = this.tokens[this.tokenIndex];
		this.tokenIndex = (this.tokenIndex + 1) >= this.tokens.length ? 0 : (this.tokenIndex + 1);
		return token;
	}

	public async fetch(path: string) {
		const res = await fetch(`https://api.clashofclans.com${path}`, {
			headers: {
				Authorization: `Bearer ${this.token}`,
				Accept: 'application/json'
			},
			timeout: Number(this.timeout)
		}).catch(() => null);

		const parsed = await res?.json().catch(() => null);
		if (parsed) return { statusCode: res!.status, data: parsed };
		return { statusCode: 500, data: { message: 'Unknown error happened when handling the request.' } };
	}

	public async init() {
		await ext.login();
		return this.tokens.push(...ext.keys);
	}
}
