import type { Context, MiddlewareHandler } from "hono";

import {
	CookieOptions,
	SessionData,
	createWorkersKVSessionStorage,
	createCookieSessionStorage,
} from "@remix-run/cloudflare";

import { session } from "./session";

export function staticAssets(): MiddlewareHandler<{
	Bindings: { ASSETS: Fetcher };
}> {
	return async function staticAssets(ctx, next) {
		let response: Response;

		ctx.req.raw.headers.delete("if-none-match");

		try {
			response = await ctx.env.ASSETS.fetch(ctx.req.url, ctx.req.raw.clone());
			if (response.status >= 400) return next();
			return new Response(response.body, response);
		} catch {
			return next();
		}
	};
}

/* Middleware for sessions with Worker KV */
type WorkerKVBindingsObject<KV extends string, Secret extends string> = {
	[K in KV | Secret]: K extends KV ? KVNamespace : string;
};

type GetWorkerKVSecretsFunction<KV extends string, Secret extends string> = (
	context: Context<{ Bindings: WorkerKVBindingsObject<KV, Secret> }>,
) => string[];

export function workerKVSession<
	KVBinding extends string,
	SecretBinding extends string,
	Data = SessionData,
	FlashData = Data,
>(options: {
	autoCommit?: boolean;
	cookie: Omit<CookieOptions, "secrets"> & {
		name: string;
		secrets: GetWorkerKVSecretsFunction<KVBinding, SecretBinding>;
	};
	binding: KVBinding;
}): MiddlewareHandler {
	return session<
		{ Bindings: WorkerKVBindingsObject<KVBinding, SecretBinding> },
		"",
		Record<string, unknown>,
		Data,
		FlashData
	>({
		autoCommit: options.autoCommit,
		createSessionStorage(context) {
			if (!(options.binding in context.env)) {
				throw new ReferenceError("The binding for the kvSession is not set.");
			}

			let secrets = options.cookie.secrets(context);

			if (secrets.length === 0) {
				throw new ReferenceError("The secrets for the kvSession are not set.");
			}

			return createWorkersKVSessionStorage<Data, FlashData>({
				kv: context.env[options.binding] as KVNamespace,
				cookie: { ...options.cookie, secrets },
			});
		},
	});
}

/* Middleware for sessions with Cookies */
type CookieBindingsObject<Secret extends string> = {
	[K in Secret]: string;
};

type GetCookieSecretsFunction<Secret extends string> = (
	context: Context<{ Bindings: CookieBindingsObject<Secret> }>,
) => string[];

export function cookieSession<
	SecretBinding extends string,
	Data = SessionData,
	FlashData = Data,
>(options: {
	autoCommit?: boolean;
	cookie: Omit<CookieOptions, "secrets"> & {
		name: string;
		secrets: GetCookieSecretsFunction<SecretBinding>;
	};
}): MiddlewareHandler {
	return session<
		{ Bindings: CookieBindingsObject<SecretBinding> },
		"",
		Record<string, unknown>,
		Data,
		FlashData
	>({
		autoCommit: options.autoCommit,
		createSessionStorage(context) {
			let secrets = options.cookie.secrets(context);

			if (secrets.length === 0) {
				throw new ReferenceError(
					"The secrets for the cookieSession are not set.",
				);
			}

			return createCookieSessionStorage<Data, FlashData>({
				cookie: { ...options.cookie, secrets },
			});
		},
	});
}
