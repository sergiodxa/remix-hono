import { afterAll, describe, expect, mock, spyOn, test } from "bun:test";
import { Context } from "hono";
import { createCookieSessionStorage } from "react-router";
import { getSession, getSessionStorage, session } from "../src/session";

const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: "session",
		httpOnly: true,
		secrets: ["s3cr3t"],
	},
});

const createSessionStorage = mock().mockImplementation(() => sessionStorage);

const c = {
	set: mock(),
	get: mock(),
	req: {
		raw: {
			headers: {
				get: mock().mockReturnValue("session=cookie"),
			},
		},
	},
	header: mock(),
} as unknown as Context;

const original = {
	getSession: sessionStorage.getSession,
	commitSession: sessionStorage.commitSession,
	destroySession: sessionStorage.destroySession,
};

const spy = {
	getSession: spyOn(sessionStorage, "getSession").mockImplementation(
		original.getSession,
	),
	commitSession: spyOn(sessionStorage, "commitSession").mockImplementation(
		original.commitSession,
	),
	destroySession: spyOn(sessionStorage, "destroySession").mockImplementation(
		original.destroySession,
	),
};

describe(session.name, () => {
	afterAll(() => {
		mock.restore();
	});

	test("calls `next` if no `autoCommit`", async () => {
		let next = mock().mockResolvedValueOnce(true);

		let middleware = session({
			autoCommit: false,
			createSessionStorage,
		});

		await middleware(c, next);

		expect(createSessionStorage).toHaveBeenCalledTimes(1);
		expect(c.set).toHaveBeenCalled();
		expect(next).toHaveBeenCalledTimes(1);
		expect(spy.getSession).toHaveBeenCalledTimes(0);
	});

	test("`set-cookie` if `autoCommit`", async () => {
		let next = mock().mockImplementation(() => Promise.resolve(true));

		let middleware = session({
			autoCommit: true,
			createSessionStorage,
		});

		await middleware(c, next);

		expect(createSessionStorage).toHaveBeenCalledTimes(2);
		expect(c.set).toHaveBeenNthCalledWith(
			2,
			expect.any(Symbol),
			sessionStorage,
		);
		expect(spy.getSession).toHaveBeenCalledTimes(1);

		let sessionInContext = await sessionStorage.getSession();

		expect(c.set).toHaveBeenCalled();
		expect(next).toHaveBeenCalledTimes(1);
		expect(c.header).toHaveBeenLastCalledWith(
			"set-cookie",
			await sessionStorage.commitSession(sessionInContext),
			{ append: true },
		);
	});
});

describe(getSessionStorage.name, () => {
	afterAll(() => {
		mock.restore();
	});

	test("throws if no session storage", async () => {
		expect(() => getSessionStorage(c)).toThrowError(
			"A session middleware was not set.",
		);

		expect(c.get).toHaveBeenCalledWith(expect.any(Symbol));
	});

	test("returns session storage", async () => {
		let sessionStorage = getSessionStorage({
			get: mock().mockReturnValueOnce({}),
		} as unknown as Context);

		expect(sessionStorage).not.toBeNull();
	});
});

describe(getSession.name, () => {
	afterAll(() => {
		mock.restore();
	});

	test("throws if no session storage", async () => {
		expect(() => getSession(c)).toThrowError(
			"A session middleware was not set.",
		);

		expect(c.get).toHaveBeenCalledWith(expect.any(Symbol));
	});

	test("returns session", async () => {
		let session = getSessionStorage({
			get: mock().mockReturnValueOnce({}),
		} as unknown as Context);

		expect(session).not.toBeNull();
	});
});
