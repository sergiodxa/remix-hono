import { Session, SessionData, SessionStorage } from "@remix-run/cloudflare";
import { Context, Env, Input, MiddlewareHandler } from "hono";

const sessionStorageSymbol = Symbol();
const sessionSymbol = Symbol();

export function session<
	E extends Env = Record<string, never>,
	P extends string = "",
	I extends Input = Record<string, never>,
	Data = SessionData,
	FlashData = Data,
>(options: {
	autoCommit?: boolean;
	createSessionStorage(env: Context<E, P, I>): SessionStorage<Data, FlashData>;
}): MiddlewareHandler {
	return async function middleware(context, next) {
		let sessionStorage = options.createSessionStorage(context.env);

		context.set(sessionStorageSymbol, sessionStorage);

		// If autoCommit is disabled, we just create the SessionStorage and make it
		// available with context.get(sessionStorageSymbol), then call next() and
		// return.
		if (!options.autoCommit) return await next();

		// If autoCommit is enabled, we get the Session from the request.
		let session = await sessionStorage.getSession(
			context.req.raw.headers.get("cookie"),
		);

		// And make it available with context.get(sessionSymbol).
		context.set(sessionSymbol, session);

		// Then we call next() to let the rest of the middlewares run.
		await next();

		// Finally, we commit the session before the response is sent.
		context.header("set-cookie", await sessionStorage.commitSession(session), {
			append: true,
		});
	};
}

export function getSessionStorage<Data = SessionData, FlashData = Data>(
	context: Context,
): SessionStorage<Data, FlashData> {
	return context.get(sessionStorageSymbol);
}

export function getSession<Data = SessionData, FlashData = Data>(
	context: Context,
): Session<Data, FlashData> {
	return context.get(sessionSymbol);
}
