# Remix/React Router + Hono

> [React Router](https://remix.run) is a web framework for building web
> applications, which can run on the Edge.

> [Hono](https://hono.dev) is a small and ultrafast web framework for the Edges.

This adapter allows you to use Hono with React Router, so you can use the best
of each one.

Let Hono power your HTTP server and its middlewares, then use React Router to
build your web application.

## Installation

Install the package

```sh
npm add remix-hono
```

The following packages are optional dependencies, you will need to install them
depending on what features from remix-hono you're using.

- `@react-router/cloudflare` if you're using Cloudflare integration.
- `i18next` and `remix-i18next` if you're using the i18n middleware.
- `zod` if you're using `typedEnv`.

> [!NOTE] You don't really need to install them if you don't use them, but you
> will need to install them yourself (they don't come not automatically) if you
> use the features that depends on those packages.

## Usage

Create your Hono + React Routers server:

```ts
import { logDevReady } from "@react-router/cloudflare";
import { Hono } from "hono";
// You can also use it with other runtimes
import { handle } from "hono/cloudflare-pages";
import { reactRouter } from "remix-hono/handler";

import build from "./build/server";

if (process.env.NODE_ENV === "development") logDevReady(build);

/* type your Cloudflare bindings here */
type Bindings = {};

/* type your Hono variables (used with c.get/c.set) here */
type Variables = {};

type ContextEnv = { Bindings: Bindings; Variables: Variables };

const server = new Hono<ContextEnv>();

// Add the React Router middleware to your Hono server
server.use(
	"*",
	reactRouter({
		build,
		mode: process.env.NODE_ENV as "development" | "production",
		// getLoadContext is optional, the default function is the same as here
		getLoadContext(c) {
			return c.env;
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
	basicAuth({ username: "hono", password: "react-router" }),
	// Ensure React Router request handler is the last one
	reactRouter(options),
);
```

With just that, your app will now have basic auth protection, which can work
great of preview applications.

## Session Management

Additionally to the `reactRouter` Hono middleware, there are other three
middlewares to work with React Router sessions.

Because React Router sessions typically use a secret coming from the environment
you will need access to Hono `c.env` to use them. If you're using the Worker KV
session storage you will also need to pass the KV binding to the middleware.

You can use the different middlewares included in this package to do that:

```ts
import { session } from "remix-hono/session";
import { createWorkerKVSessionStorage } from "@react-router/cloudflare";

server.use(
	"*",
	session({
		autoCommit: true,
		createSessionStorage(c) {
			return createWorkersKVSessionStorage({
				kv: c.env.MY_KV_BINDING,
				cookie: {
					name: "session",
					httpOnly: true,
					secrets: [c.SESSION_SECRET],
				},
			});
		},
	}),
);
```

Now, setup the React Router middleware after your session middleware and use the
helpers `getSessionStorage` and `getSession` to access the SessionStorage and
Session objects.

> **Note** The Session object will only be defined if autoCommit was set as true
> in the session middleware options. If you set it to false, you will need to
> call `sessionStorage.getSession()` manually.

```ts
import { getSessionStorage, getSession } from "remix-hono/session";

server.use(
	"*",
	reactRouter<ContextEnv>({
		build,
		mode: process.env.NODE_ENV as "development" | "production",
		// getLoadContext is optional, the default function is the same as here
		getLoadContext(c) {
			let sessionStorage = getSessionStorage(c);
			let session = getSession(c);

			// Return them here to access them in your loaders and actions
			return { ...c.env, sessionStorage, session };
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
			// In this function, you can access c.env to get the session secret
			secrets(c) {
				return [c.env.SECRET];
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
			// In this function, you can access c.env to get the session secret
			secrets(c) {
				return [c.env.SECRET];
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

First install `@react-router/cloudflare` if you haven't installed it yet.

```sh
npm add @react-router/cloudflare
```

Then use the middleware in your server.

```ts
import { staticAssets } from "remix-hono/cloudflare";
import { reactRouter } from "remix-hono/handler";

server.use(
	"*",
	staticAssets(),
	// Add React Router request handler as the last middleware
	reactRouter(options),
);
```

## i18next integration

If you're using [remix-i18next](https://github.com/sergiodxa/remix-i18next) to
support i18n in your React Router app, the `i18next` middleware let's you setup
it for your React Router app as a middleware that you can later use in your
`getLoadContext` function to pass the `locale` and `t` functions to your loaders
and actions.

First install `i18next` and `remix-i18next` if you haven't already.

```sh
npm add i18next remix-i18next
```

Then use the middleware in your server.

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
	reactRouter({
		build,
		mode: process.env.NODE_ENV as "development" | "production",
		// getLoadContext is optional, the default function is the same as here
		getLoadContext(c) {
			// get the locale from the context
			let locale = i18next.getLocale(c);
			// get t function for the default namespace
			let t = await i18next.getFixedT(c);
			// get t function for a specific namespace
			let errorT = await i18next.getFixedT(c, "error");
			return { env: c.env, locale, t, errorT };
		},
	}),
);
```

There's also an `i18next.get` function that returns the `RemixI18Next` instance
in case you need it.

## HTTPS Only

You can enforce your server to use HTTPS only with the `httpsOnly` middleware.

```ts
import { httpsOnly } from "remix-hono/security";

server.use("*", httpsOnly());
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

## Typed Envs with Zod

The `typedEnv` helper let's you get the environment variables for any runtimes
and use Zod to validate it against a schema.

First install Zod if you haven't installed it yet.

```sh
npm add zod
```

Then use the helper in any middleware or request handler.

```ts
import { typedEnv } from "remix-hono/typed-env";

// Define your schema
const Schema = z.object({ SECRET: z.string() });

// Use the helper
server.get("/about", (c) => {
	let env = typedEnv(c, Schema);
	let secret = env.SECRET; // or typedEnv(c, Schema, "SECRET");
	// do something here
});
```

## Author

- [Sergio Xalambrí](https://sergiodxa.com)

## License

- MIT License
