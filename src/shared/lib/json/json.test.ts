import { assert, describe, expect, it } from "vitest";

import { JsonParseError, JsonStringifyError } from "../error";
import { parse, stringify } from "./json";

describe("parse", () => {
  it("JSON として読める文字列を値にして返す", () => {
    expect(parse('{"name":"めいろ","layers":[]}')).toEqual({
      ok: true,
      value: { name: "めいろ", layers: [] },
    });
  });

  it("JSON の null は成功として返す", () => {
    expect(parse("null")).toEqual({ ok: true, value: null });
  });

  it("壊れた文字列は JsonParseError を返す", () => {
    expect(parse('{"name":')).toEqual({ ok: false, error: expect.any(JsonParseError) });
  });

  it("空文字は JsonParseError を返す", () => {
    expect(parse("")).toEqual({ ok: false, error: expect.any(JsonParseError) });
  });

  it("元の例外を cause に残す", () => {
    const result = parse("{");

    assert(!result.ok);
    expect(result.error.cause).toBeInstanceOf(SyntaxError);
  });
});

describe("stringify", () => {
  it("値を JSON の文字列にして返す", () => {
    expect(stringify([{ id: "a" }])).toEqual({ ok: true, value: '[{"id":"a"}]' });
  });

  it("循環参照は JsonStringifyError を返す", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(stringify(circular)).toEqual({ ok: false, error: expect.any(JsonStringifyError) });
  });

  it("BigInt は JsonStringifyError を返す", () => {
    expect(stringify(1n)).toEqual({ ok: false, error: expect.any(JsonStringifyError) });
  });

  it("undefined は JsonStringifyError を返す", () => {
    expect(stringify(undefined)).toEqual({ ok: false, error: expect.any(JsonStringifyError) });
  });

  it("関数は JsonStringifyError を返す", () => {
    expect(stringify(() => "x")).toEqual({ ok: false, error: expect.any(JsonStringifyError) });
  });

  it("元の例外を cause に残す", () => {
    const result = stringify(1n);

    assert(!result.ok);
    expect(result.error.cause).toBeInstanceOf(TypeError);
  });
});
