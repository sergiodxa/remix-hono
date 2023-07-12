import {
	CookieOptions,
	SessionData,
	createWorkersKVSessionStorage,
} from "@remix-run/cloudflare";
import { Context, Hono, MiddlewareHandler } from "hono";

import { session } from "./session";

type GetSecretsFunction<KV extends string, Secret extends string> = (
	context: Context<{ Bindings: BindingsObject<KV, Secret> }>,
) => string[];

type BindingsObject<KV extends string, Secret extends string> = {
	[K in KV | Secret]: K extends KV ? KVNamespace : string;
};

export function kvSession<
	KVBinding extends string,
	SecretBinding extends string,
	Data = SessionData,
	FlashData = Data,
>(options: {
	autoCommit?: boolean;
	cookie: Omit<CookieOptions, "secrets"> & {
		name: string;
		secrets: GetSecretsFunction<KVBinding, SecretBinding>;
	};
	binding: KVBinding;
}): MiddlewareHandler {
	return session<
		{ Bindings: BindingsObject<KVBinding, SecretBinding> },
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

new Hono().use(
	"*",
	kvSession({
		autoCommit: true,
		cookie: {
			name: "session",
			secrets(context) {
				return [context.env.SECRET];
			},
		},
		binding: "KV_BINDING",
	}),
);
