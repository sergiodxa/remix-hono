import type { Context, Env, Input, MiddlewareHandler } from "hono";

import {
	CookieOptions,
	SessionData,
	createWorkersKVSessionStorage,
	createCookieSessionStorage,
} from "@remix-run/cloudflare";
import { cacheHeader } from "pretty-cache-header";

import { session } from "./session";

interface StaticAssetsOptions {
	cache?: Parameters<typeof cacheHeader>[0];
}

export function staticAssets<
	E extends Env = Record<string, never>,
	P extends string = "",
	I extends Input = Record<string, never>,
>(options: StaticAssetsOptions = {}): MiddlewareHandler<E, P, I> {
	return async function staticAssets(ctx, next) {
		let binding = ctx.env?.ASSETS as Fetcher | undefined;

		if (!binding) throw new ReferenceError("The binding ASSETS is not set.");

		let response: Response;

		ctx.req.raw.headers.delete("if-none-match");

		try {
			response = await binding.fetch(ctx.req.url, ctx.req.raw.clone());

			// If the request failed, we just call the next middleware
			if (response.status >= 400) return await next();

			response = new Response(response.body, response);

			// If cache options are configured, we set the cache-control header
			if (options.cache) {
				response.headers.set("cache-control", cacheHeader(options.cache));
			}

			return response;
		} catch {
			return await next();
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
}): MiddlewareHandler<{
	Bindings: WorkerKVBindingsObject<KVBinding, SecretBinding>;
}> {
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
}): MiddlewareHandler<{ Bindings: CookieBindingsObject<SecretBinding> }> {
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
