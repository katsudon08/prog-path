import { afterEach, assert, beforeEach, describe, expect, it, vi } from "vitest";

import { StorageError } from "../error";
import { get, remove, set } from "./storage";

// node 環境には localStorage が無いので手で差す
const createFakeStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
};

const createBrokenStorage = () => {
  const boom = () => {
    throw new DOMException("", "SecurityError");
  };
  return { getItem: boom, setItem: boom, removeItem: boom };
};

let fake: ReturnType<typeof createFakeStorage>;

beforeEach(() => {
  fake = createFakeStorage();
  vi.stubGlobal("localStorage", fake);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("get", () => {
  it("保存した値を読む", () => {
    set("mazes", "[]");

    expect(get("mazes")).toEqual({ ok: true, value: "[]" });
  });

  it("未保存のキーは null を返しエラーにしない", () => {
    expect(get("mazes")).toEqual({ ok: true, value: null });
  });

  it("キーの前後の空白を無視して読む", () => {
    set("mazes", "[]");

    expect(get("  mazes  ")).toEqual({ ok: true, value: "[]" });
  });

  it("読めない端末では StorageError を返す", () => {
    vi.stubGlobal("localStorage", createBrokenStorage());

    expect(get("mazes")).toEqual({ ok: false, error: expect.any(StorageError) });
  });
});

describe("set", () => {
  it("progpath.v2. を付けたキーで保存する", () => {
    set("mazes", "[]");

    expect(fake.getItem("progpath.v2.mazes")).toBe("[]");
    expect(fake.getItem("mazes")).toBeNull();
  });

  it("保存できたら ok を返す", () => {
    expect(set("mazes", "[]")).toEqual({ ok: true, value: undefined });
  });

  it("キーの前後の空白を落として保存する", () => {
    set("  mazes  ", "[]");

    expect(fake.getItem("progpath.v2.mazes")).toBe("[]");
  });

  it("値の前後の空白を落として保存する", () => {
    set("mazes", "  []  ");

    expect(fake.getItem("progpath.v2.mazes")).toBe("[]");
  });

  it("書けない端末では StorageError を返す", () => {
    vi.stubGlobal("localStorage", createBrokenStorage());

    expect(set("mazes", "[]")).toEqual({ ok: false, error: expect.any(StorageError) });
  });

  it("元の例外を cause に残す", () => {
    vi.stubGlobal("localStorage", createBrokenStorage());
    const result = set("mazes", "[]");

    assert(!result.ok);
    expect(result.error.cause).toBeInstanceOf(DOMException);
  });
});

describe("remove", () => {
  it("保存した値を消す", () => {
    set("mazes", "[]");
    remove("mazes");

    expect(get("mazes")).toEqual({ ok: true, value: null });
  });

  it("キーの前後の空白を無視して消す", () => {
    set("mazes", "[]");
    remove("  mazes  ");

    expect(get("mazes")).toEqual({ ok: true, value: null });
  });

  it("未保存のキーを消してもエラーにしない", () => {
    expect(remove("mazes")).toEqual({ ok: true, value: undefined });
  });

  it("消せない端末では StorageError を返す", () => {
    vi.stubGlobal("localStorage", createBrokenStorage());

    expect(remove("mazes")).toEqual({ ok: false, error: expect.any(StorageError) });
  });
});

describe("localStorage が無い環境", () => {
  it("参照した時点の例外も StorageError にする", () => {
    vi.unstubAllGlobals();

    expect(get("mazes")).toEqual({ ok: false, error: expect.any(StorageError) });
  });
});
