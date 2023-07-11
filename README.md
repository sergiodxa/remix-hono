# Remix adapter for Hono

[Remix](https://remix.run) is a web framework for building web applications,
which can run on the Edge.

[Hono](https://hono.dev) is a small and ultrafast web framework for the Edges.

This adapter allows you to use Hono with Remix, so you can use the best of each
one.

Let Hono power your HTTP server and its middlewares, then use Remix to build
your web application.

## Installation

```sh
npm add remix-hono
```

## Usage

Create your Hono + Remix server:

```ts
import { logDevReady } from "@remix-run/cloudflare";
import * as build from "@remix-run/dev/server-build";
import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { remix } from "remix-hono";

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
	remix<ContextEnv>({
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

server.use("*", basicAuth({ username: "hono", password: "remix" }));
// Ensure Remix request handler is the last one
server.use("*", remix(options));
```

With just that, your app will now have basic auth protection, which can work
great of preview applications.

## Author

- [Sergio Xalambrí](https://sergiodxa.com)

## License

- MIT License
