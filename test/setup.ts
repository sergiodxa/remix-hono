import { createWorkersKVSessionStorage } from "@react-router/cloudflare";
import { mock } from "bun:test";
import { createCookieSessionStorage } from "react-router";

import * as session from "../src/session";

mock.module("@react-router/cloudflare", () => {
	return {
		createWorkersKVSessionStorage: mock().mockImplementation(
			createWorkersKVSessionStorage,
		),
	};
});

mock.module("react-router", () => {
	return {
		createCookieSessionStorage: mock().mockImplementation(
			createCookieSessionStorage,
		),
	};
});

mock.module("../src/session.ts", () => {
	return {
		session: mock().mockImplementation(session.session),
		getSession: mock().mockImplementation(session.getSession),
		getSessionStorage: mock().mockImplementation(session.getSessionStorage),
	};
});
