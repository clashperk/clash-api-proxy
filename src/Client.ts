import fetch from 'node-fetch';

export default class Client {
	private keyName = 'ClashPerk_API_Proxy_Token';
	private tokens: string[] = [];
	private timeout = 3000;
	private tokenIndex = 0;
	private keyCount = 1;

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
		if (parsed) return { statusCode: res!.status, data: parsed  };
		return { statusCode: 500, data: { message: 'Unknown error happened when handling the request.' } };
	}

	public async login() {
		const res = await fetch('https://developer.clashofclans.com/api/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: process.env.SUPERCELL_EMAIL!,
				password: process.env.SUPERCELL_PASSWORD!
			})
		});

		const data = await res.json();
		if (data.status && data.status.message === 'ok') return this.getKeys(res.headers.get('set-cookie')!);
	}

	private async getKeys(cookie: string) {
		const res = await fetch('https://developer.clashofclans.com/api/apikey/list', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', cookie }
		});

		const data = await res.json();

		const keys = data.keys.filter((key: any) => key.name === this.keyName);
		if (!keys.length) return this.createKey(cookie);

		for (const key of keys) await this.revokeKey(key, cookie);
		return Promise.allSettled(new Array(this.keyCount).fill(0).map(() => this.createKey(cookie)));
	}

	private async revokeKey(key: any, cookie: string) {
		const res = await fetch('https://developer.clashofclans.com/api/apikey/revoke', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', cookie },
			body: JSON.stringify({ id: key.id })
		});

		return res.json();
	}

	private async createKey(cookie: string) {
		const res = await fetch('https://developer.clashofclans.com/api/apikey/create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', cookie },
			body: JSON.stringify({ name: this.keyName, description: this.keyName, cidrRanges: [await this.getIP()] })
		});

		const data = await res.json();
		if (res.ok) {
			this.tokens.push(data.key.key);

			console.log('[KEY] New Key Created!');
			return Promise.resolve();
		}
	}

	private async getIP() {
		const res = await fetch('https://api.ipify.org/');
		return res.text();
	}
}
