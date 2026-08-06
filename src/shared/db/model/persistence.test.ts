import { beforeEach, describe, expect, it, vi } from "vitest";

// OPFS（OPFSCoopSyncVFS）は node では動かないため、ライブラリ境界をモックして
// 「どんな設定を渡しているか」だけを検証する。
const mocks = vi.hoisted(() => ({
  openBrowserWASQLiteOPFSDatabase: vi.fn(),
  createBrowserWASQLitePersistence: vi.fn(),
}));

vi.mock("@tanstack/browser-db-sqlite-persistence", () => mocks);

import { DB_NAME, SCHEMA_VERSION, createPersistence } from "./persistence";

const DATABASE = { marker: "opened-database" };
const PERSISTENCE = { marker: "created-persistence" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.openBrowserWASQLiteOPFSDatabase.mockResolvedValue(DATABASE);
  mocks.createBrowserWASQLitePersistence.mockReturnValue(PERSISTENCE);
});

describe("createPersistence", () => {
  it("DB_NAME の OPFS データベースを開く", async () => {
    await createPersistence();
    expect(mocks.openBrowserWASQLiteOPFSDatabase).toHaveBeenCalledWith({ databaseName: DB_NAME });
  });

  it("スキーマ不一致時にローカルを作り直す設定（reset）を必ず渡す", async () => {
    // **この 1 行を守るためだけのテスト。** 値のエコーに見えるが、外れたときの壊れ方が
    // 「例外で止まる」ではなく「無言で全断」なので、他のどのテストでも検出できない。
    //
    // 本アプリは sync を渡さないローカル専用構成のため、省略すると既定が
    // sync-absent-error になる。この既定はテーブルを消さず throw するだけで、その例外を
    // loopback sync が console.warn して ready 扱いにするため、エラー画面も出ないまま
    // 全件 0 件に見え、以後の書き込みが静かに全て失敗し続ける（リロードしても直らない）。
    // #192 のレビューで実機再現済み（→ persistence.ts / docs/db-design.md 6）。
    await createPersistence();
    expect(mocks.createBrowserWASQLitePersistence).toHaveBeenCalledWith(
      expect.objectContaining({ schemaMismatchPolicy: "reset" }),
    );
  });

  it("開いたデータベースをそのまま persistence に渡す", async () => {
    await createPersistence();
    expect(mocks.createBrowserWASQLitePersistence).toHaveBeenCalledWith(
      expect.objectContaining({ database: DATABASE }),
    );
  });

  it("生成した persistence を返す", async () => {
    await expect(createPersistence()).resolves.toBe(PERSISTENCE);
  });
});

describe("SCHEMA_VERSION", () => {
  it("正の整数（不一致判定は !== なので小数・負値・NaN は事故になる）", () => {
    expect(Number.isInteger(SCHEMA_VERSION)).toBe(true);
    expect(SCHEMA_VERSION).toBeGreaterThan(0);
  });
});

describe("DB_NAME", () => {
  it("非空文字列", () => {
    expect(typeof DB_NAME).toBe("string");
    expect(DB_NAME.length).toBeGreaterThan(0);
  });
});
