# Remix + Hono

> [Remix](https://remix.run) is a web framework for building web applications,
> which can run on the Edge.

> [Hono](https://hono.dev) is a small and ultrafast web framework for the Edges.

This adapter allows you to use Hono with Remix, so you can use the best of each
one.

Let Hono power your HTTP server and its middlewares, then use Remix to build
your web application.

## Installation

```sh
npm add remix-hono @remix-run/cloudflare
```

## Usage

Create your Hono + Remix server:

```ts
import { logDevReady } from "@remix-run/cloudflare";
import * as build from "@remix-run/dev/server-build";
import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { remix } from "remix-hono/handler";

if (process.env.NODE_ENV === "development") logDevReady(build);

/* type your Cloudflare bindings here */
type Bindings = {};

/* type your Hono variables (used with ctx.get/ctx.set) here */
type Variables = {};

type ContextEnv = { Bindings: Bindings; Variables: Variables };

const server = new Hono<ContextEnv>();

// Add the Remix middleware to your Hono server
server.use(
	"*",
	remix({
		build,
		mode: process.env.NODE_ENV as "development" | "production",
		// getLoadContext is optional, the default function is the same as here
		getLoadContext(ctx) {
			return ctx.env;
		},
	}),
);

// Create a Cloudflare Pages request handler for your Hono server
export const onRequest = handle(server);
```

Now, you can add more Hono middlewares, like the basic auth middleware:

```ts
import { basicAuth } from "hono/basic-auth";

server.use(
	"*",
	basicAuth({ username: "hono", password: "remix" }),
	// Ensure Remix request handler is the last one
	remix(options),
);
```

With just that, your app will now have basic auth protection, which can work
great of preview applications.

## Session Management

Additionally to the `remix` Hono middleware, there are other three middlewares
to work with Remix sessions.

Because Remix sessions typically use a secret coming from the environment you
will need access to Hono `ctx.env` to use them. If you're using the Worker KV
session storage you will also need to pass the KV binding to the middleware.

You can use the different middlewares included in this package to do that:

```ts
import { session } from "remix-hono/session";
import { createWorkerKVSessionStorage } from "@remix-run/cloudflare";

server.use(
	"*",
	session({
		autoCommit: true,
		createSessionStorage(context) {
			return createWorkersKVSessionStorage({
				kv: context.env.MY_KV_BINDING,
				cookie: {
					name: "session",
					httpOnly: true,
					secrets: [context.SESSION_SECRET],
				},
			});
		},
	}),
);
```

Now, setup the Remix middleware after your session middleware and use the
helpers `getSessionStorage` and `getSession` to access the SessionStorage and
Session objects.

> **Note** The Session object will only be defined if autoCommit was set as true
> in the session middleware options. If you set it to false, you will need to
> call `sessionStorage.getSession()` manually.

```ts
import { getSessionStorage, getSession } from "remix-hono/session";

server.use(
	"*",
	remix<ContextEnv>({
		build,
		mode: process.env.NODE_ENV as "development" | "production",
		// getLoadContext is optional, the default function is the same as here
		getLoadContext(ctx) {
			let sessionStorage = getSessionStorage(ctx);
			let session = getSession(ctx);

			// Return them here to access them in your loaders and actions
			return { ...ctx.env, sessionStorage, session };
		},
	}),
);
```

The `session` middleware is generic and lets you use any session storage
mechanism. If you want to use the Worker KV session storage you can use the
`workerKVSession` middleware instead.

```ts
import { workerKVSession } from "remix-hono/cloudflare";

server.use(
	"*",
	workerKVSession({
		autoCommit: true, // same as in the session middleware
		cookie: {
			name: "session", // all cookie options as in createWorkerKVSessionStorage
			// In this function, you can access context.env to get the session secret
			secrets(context) {
				return [context.env.SECRET];
			},
		},
		// The name of the binding using for the KVNamespace
		binding: "KV_BINDING",
	}),
);
```

If you want to use the cookie session storage, you can use the `cookieSession`
middleware instead.

```ts
import { cookieSession } from "remix-hono/cloudflare";

server.use(
	"*",
	cookieSession({
		autoCommit: true, // same as in the session middleware
		cookie: {
			name: "session", // all cookie options as in createCookieSessionStorage
			// In this function, you can access context.env to get the session secret
			secrets(context) {
				return [context.env.SECRET];
			},
		},
	}),
);
```

In both `workerKVSession` and `cookieSession` you use `getSession` and
`getSessionStorage` imported from `remix-hono/session`

## Static Assets on Cloudflare

If you're using Remix Hono with Cloudflare, you will need to serve your static
from the public folder (except for `public/build`). The `staticAssets`
middleware serves this purpose.

```ts
import { staticAssets } from "remix-hono/cloudflare";
import { remix } from "remix-hono/handler";

server.use(
	"*",
	staticAssets(),
	// Add Remix request handler as the last middleware
	remix(options),
);
```

## i18next integration

If you're using [remix-i18next](https://github.com/sergiodxa/remix-i18next) to
support i18n in your Remix app, the `i18next` middleware let's you setup it for
your Remix app as a middleware that you can later use in your `getLoadContext`
function to pass the `locale` and `t` functions to your loaders and actions.

```ts
import { i18next } from "remix-hono/i18next";

// Same options as in remix-i18next
server.use("*", i18next(options));
```

Then, in your `getLoadContext` function you can access the `locale` and `t`
functions using the helpers `i18next.getLocale` and `i18next.getFixedT`.

```ts
server.use(
	"*",
	remix({
		build,
		mode: process.env.NODE_ENV as "development" | "production",
		// getLoadContext is optional, the default function is the same as here
		getLoadContext(ctx) {
			// get the locale from the context
			let locale = i18next.getLocale(context);
			// get t function for the default namespace
			let t = await i18next.getFixedT(context);
			// get t function for a specific namespace
			let errorT = await i18next.getFixedT(context, "error");
			return { env: ctx.env, locale, t, errorT };
		},
	}),
);
```

There's also an `i18next.get` function that returns the `RemixI18Next` instance
in case you need it.

## HTTPS Only

You can enforce your server to use HTTPS only with the `httpOnly` middleware.

```ts
import { httpOnly } from "remix-hono/security";

server.use("*", httpOnly());
```

## Trailing Slash

You can enforce your server to use trailing slashes with the `trailingSlash`
middleware.

```ts
import { trailingSlash } from "remix-hono/trailing-slash";

// By default, trailing slashes are disabled, so `https://company.tld/about/`
// will be redirect to `https://company.tld/about`
server.use("*", trailingSlash());
server.use("*", trailingSlash({ enabled: false }));

// You can also enable trailing slashes, so `https://company.tld/about` will be
// redirect to `https://company.tld/about/` instead
server.use("*", trailingSlash({ enabled: true }));
```

## Author

- [Sergio Xalambrí](https://sergiodxa.com)

## License

- MIT License
