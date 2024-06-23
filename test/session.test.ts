import { createCookieSessionStorage } from "@remix-run/cloudflare";
import { Context } from "hono";
import { describe, test, expect, vi, beforeEach, afterAll } from "vitest";

import { getSession, getSessionStorage, session } from "../src/session";

vi.mock("@remix-run/node", () => {
	return {
		createCookieSessionStorage: vi.fn(),
	};
});

vi.stubEnv("SESSION_SECRET", "s3cr3t");

const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: "session",
		httpOnly: true,
		secrets: [process.env.SESSION_SECRET!],
	},
});

const createSessionStorage = vi.fn().mockImplementation(() => sessionStorage);

const c = {
	set: vi.fn(),
	get: vi.fn(),
	req: {
		raw: {
			headers: {
				get: vi.fn().mockReturnValue("session=cookie"),
			},
		},
	},
	header: vi.fn(),
} as unknown as Context;

const spy = {
	getSession: vi
		.spyOn(sessionStorage, "getSession")
		.mockResolvedValue(await sessionStorage.getSession()),
	commitSession: vi.fn().mockResolvedValue("session cookie"),
};

describe(session.name, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterAll(() => {
		vi.resetAllMocks();
	});

	test("calls `next` if no `autoCommit`", async () => {
		let next = vi.fn().mockResolvedValueOnce(true);

		let middleware = session({
			autoCommit: false,
			createSessionStorage,
		});

		await middleware(c, next);

		expect(createSessionStorage).toHaveBeenCalledOnce();
		expect(c.set).toHaveBeenNthCalledWith(
			1,
			expect.any(Symbol),
			sessionStorage,
		);
		expect(next).toHaveBeenCalledOnce();
		expect(spy.getSession).not.toBeCalled();
	});

	test("`set-cookie` if `autoCommit`", async () => {
		let next = vi.fn().mockResolvedValueOnce(true);

		let middleware = session({
			autoCommit: true,
			createSessionStorage,
		});

		await middleware(c, next);

		expect(createSessionStorage).toHaveBeenCalledOnce();
		expect(c.set).toHaveBeenNthCalledWith(
			1,
			expect.any(Symbol),
			sessionStorage,
		);
		expect(spy.getSession).toHaveBeenCalledOnce();

		let sessionInContext = await sessionStorage.getSession();

		expect(c.set).toHaveBeenNthCalledWith(
			2,
			expect.any(Symbol),
			sessionInContext,
		);
		expect(next).toHaveBeenCalledOnce();
		expect(c.header).toHaveBeenLastCalledWith(
			"set-cookie",
			await sessionStorage.commitSession(sessionInContext),
			{
				append: true,
			},
		);
	});

	test("sets multiple sessions", async () => {
		let next = vi.fn().mockResolvedValueOnce(true);

		let middleware1 = session({
			autoCommit: true,
			createSessionStorage,
			sessionKey: "session-1",
			sessionStorageKey: "session-storage-1",
		});
		let middleware2 = session({
			autoCommit: true,
			createSessionStorage,
			sessionKey: "session-2",
			sessionStorageKey: "session-storage-2",
		});

		await middleware1(c, async () => {
			await middleware2(c, next);
		});

		expect(c.set).toHaveBeenNthCalledWith(
			1,
			"session-storage-1",
			sessionStorage,
		);
		expect(c.set).toHaveBeenNthCalledWith(
			3,
			"session-storage-2",
			sessionStorage,
		);
	});

	test("throws error if only one of sessionStorageKey or sessionKey is set", () => {
		expect(() =>
			session({
				autoCommit: true,
				createSessionStorage: createSessionStorage,
				sessionStorageKey: "session-storage-1",
			}),
		).toThrowError();

		expect(() =>
			session({
				autoCommit: true,
				createSessionStorage: createSessionStorage,
				sessionKey: "session-1",
			}),
		).toThrowError();
	});
});

describe(getSessionStorage.name, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterAll(() => {
		vi.resetAllMocks();
	});

	test("throws if no session storage", async () => {
		expect(() => getSessionStorage(c)).toThrowError(
			"A session middleware was not set.",
		);

		expect(c.get).toHaveBeenCalledWith(expect.any(Symbol));
	});

	test("returns session storage", async () => {
		let sessionStorage = getSessionStorage({
			get: vi.fn().mockReturnValueOnce({}),
		} as unknown as Context);

		expect(sessionStorage).not.toBeNull();
	});

	test("returns custom session storage", async () => {
		let get = vi.fn().mockReturnValueOnce({});
		getSessionStorage(
			{
				get: get,
			} as unknown as Context,
			"custom",
		);

		expect(get).toHaveBeenCalledWith("custom");
	});
});

describe(getSession.name, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterAll(() => {
		vi.resetAllMocks();
	});

	test("throws if no session storage", async () => {
		expect(() => getSession(c)).toThrowError(
			"A session middleware was not set.",
		);

		expect(c.get).toHaveBeenCalledWith(expect.any(Symbol));
	});

	test("returns session", async () => {
		let session = getSession({
			get: vi.fn().mockReturnValueOnce({}),
		} as unknown as Context);

		expect(session).not.toBeNull();
	});

	test("returns custom session", async () => {
		let get = vi.fn().mockReturnValueOnce({});
		getSession(
			{
				get: get,
			} as unknown as Context,
			"custom",
		);

		expect(get).toHaveBeenCalledWith("custom");
	});
});
