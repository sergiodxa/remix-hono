import type { Context } from "hono";
import type { Session, SessionData, SessionStorage } from "react-router";

import { createMiddleware } from "hono/factory";

type Env = {
	Variables: Record<symbol, unknown>;
};

const sessionStorageKey = Symbol();
const sessionKey = Symbol();

export function session<Data = SessionData, FlashData = Data>(options: {
	autoCommit?: boolean;
	createSessionStorage(c: Context): SessionStorage<Data, FlashData>;
}) {
	return createMiddleware<Env>(async (c, next) => {
		let sessionStorage = options.createSessionStorage(c);

		c.set(sessionStorageKey, sessionStorage);

		// If autoCommit is disabled, we just create the SessionStorage and make it
		// available with c.get(sessionStorageSymbol), then call next() and
		// return.
		if (!options.autoCommit) return await next();

		// If autoCommit is enabled, we get the Session from the request.
		let session = await sessionStorage.getSession(
			c.req.raw.headers.get("cookie"),
		);

		// And make it available with c.get(sessionSymbol).
		c.set(sessionKey, session);

		// Then we call next() to let the rest of the middlewares run.
		await next();

		// Finally, we commit the session before the response is sent.
		c.header("set-cookie", await sessionStorage.commitSession(session), {
			append: true,
		});
	});
}

export function getSessionStorage<Data = SessionData, FlashData = Data>(
	c: Context<Env>,
): SessionStorage<Data, FlashData> {
	let sessionStorage = c.get(sessionStorageKey);
	if (!sessionStorage) {
		throw new Error("A session middleware was not set.");
	}
	return sessionStorage as SessionStorage<Data, FlashData>;
}

export function getSession<Data = SessionData, FlashData = Data>(
	c: Context<Env>,
): Session<Data, FlashData> {
	let session = c.get(sessionKey);
	if (!session) {
		throw new Error("A session middleware was not set.");
	}
	return session as Session<Data, FlashData>;
}
