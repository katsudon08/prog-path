/**
 * 実物の永続化アダプタを使った統合テスト。
 *
 * `bootstrap.test.ts` はコレクションを `Map` のフェイクで差し替えているため、
 * **SQLite 側の挙動（保存形式・スキーマ不一致時の処理）を 1 度も通らない**。
 * #192 で `SCHEMA_VERSION` の問題を見逃した直接の原因がこれ。
 *
 * ここでは OPFS の代わりに `node:sqlite` をドライバとして渡し、
 * それ以外（アダプタ・コレクション設定・`schemaMismatchPolicy`・`ensureInitialData`）は
 * すべて本番と同じものを動かす。
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { SQLInputValue } from "node:sqlite";

import { persistedCollectionOptions } from "@tanstack/browser-db-sqlite-persistence";
import type { BrowserWASQLiteDatabase } from "@tanstack/browser-db-sqlite-persistence";
import { createCollection } from "@tanstack/react-db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TUTORIAL_FOLDER_ID, UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import { buildTutorialMazes } from "../lib/tutorial-seed";
import { ensureInitialData } from "./bootstrap";
import { createCollections } from "./collections";
import { SCHEMA_VERSION, createPersistence } from "./persistence";
import { FolderSchema } from "./schema";
import type { Folder } from "./schema";

const USER_FOLDER_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const USER_FOLDER_NAME = "先生が作った大事なフォルダ";

/** #192 以前のアプリが書いていた形。型からは消えているので交差型で再現する。 */
const legacyFolder = (folder: Folder & { isDefault: boolean }): Folder => folder;

interface NodeSqliteDatabase extends BrowserWASQLiteDatabase {
  /** 生の接続。テストがアダプタを介さずテーブルを覗くために持つ。 */
  raw: DatabaseSync;
  close: () => Promise<void>;
}

/** アダプタが渡してくる値を node:sqlite が受け取れる形へ寄せる。 */
const toSqlInput = (value: unknown): SQLInputValue => {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return value;
  }
  if (value instanceof Uint8Array) {
    return value;
  }
  throw new TypeError(`SQLite へ渡せない値: ${typeof value}`);
};

/**
 * `node:sqlite` バックの {@link BrowserWASQLiteDatabase}。
 * アダプタが要求するのは `execute` だけなので、SELECT/PRAGMA は `all`、それ以外は `run` に流す。
 */
const createNodeSqliteDatabase = (file: string): NodeSqliteDatabase => {
  const sqlite = new DatabaseSync(file);
  return {
    raw: sqlite,
    execute: async <TRow = unknown>(
      sql: string,
      params: ReadonlyArray<unknown> = [],
    ): Promise<ReadonlyArray<TRow>> => {
      const statement = sqlite.prepare(sql);
      const bound = params.map(toSqlInput);
      if (/^\s*(select|pragma)/i.test(sql)) {
        return statement.all(...bound) as TRow[];
      }
      try {
        statement.run(...bound);
        return [];
      } catch (error) {
        // RETURNING 付きの文は run() が拒否するので all() に回す。それ以外は素通し。
        if (/statement returns/i.test(String((error as Error).message))) {
          return statement.all(...bound) as TRow[];
        }
        throw error;
      }
    },
    close: async () => {
      sqlite.close();
    },
  };
};

let directory: string;
let file: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "prog-path-db-"));
  file = join(directory, "prog-path.db");
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

/** 1 セッション分（本番と同じ経路でコレクションを作る）。 */
const openSession = async () => {
  const database = createNodeSqliteDatabase(file);
  const persistence = await createPersistence(database);
  const db = await createCollections(persistence);
  return { db, database, close: (): Promise<void> => database.close() };
};

/** コレクションの保存先テーブルから、生の JSON 文字列を読む。 */
const readStoredValues = (database: NodeSqliteDatabase, collectionId: string): string[] => {
  const [registry] = database.raw
    .prepare(`select table_name from collection_registry where collection_id = ?`)
    .all(collectionId) as { table_name: string }[];
  if (registry === undefined) {
    return [];
  }
  return (
    database.raw.prepare(`select value from "${registry.table_name}"`).all() as {
      value: string;
    }[]
  ).map((row) => row.value);
};

describe("旧レコードからの移行（isDefault 廃止）", () => {
  it("旧 isDefault 付きの行を、消さず・重複させず・そのまま読み続ける", async () => {
    // --- セッション 1: #192 以前のアプリが書いた状態を実 SQLite 上に作る ---
    {
      const { db, close } = await openSession();
      await db.folderCollection.insert(
        legacyFolder({
          id: UNCATEGORIZED_FOLDER_ID,
          name: "未分類",
          isDefault: true,
          createdAt: 0,
        }),
      ).isPersisted.promise;
      await db.folderCollection.insert(
        legacyFolder({
          id: USER_FOLDER_ID,
          name: USER_FOLDER_NAME,
          isDefault: false,
          createdAt: 100,
        }),
      ).isPersisted.promise;
      await close();
    }

    // --- セッション 2: 現行コードで開き直す ---
    const { db, database, close } = await openSession();
    await ensureInitialData(db);
    const folders: ReadonlyArray<Folder> = await db.folderCollection.toArrayWhenReady();
    const ids = folders.map((folder) => folder.id);

    // ユーザーが作ったフォルダが purge されずに残っている（名前まで一致＝作り直しではない）。
    const user = folders.find((folder) => folder.id === USER_FOLDER_ID);
    expect(user?.name).toBe(USER_FOLDER_NAME);

    // 未分類は「無い」と誤判定されず、重複挿入もされない。
    expect(ids.filter((id) => id === UNCATEGORIZED_FOLDER_ID)).toHaveLength(1);

    // チュートリアルは不足分として補われる。
    expect(ids).toContain(TUTORIAL_FOLDER_ID);
    const mazes = await db.mazeCollection.toArrayWhenReady();
    expect(mazes).toHaveLength(buildTutorialMazes().length);

    // 旧フィールドはディスク上に残ったままだが、それが害にならないことが上記の前提
    // （掃引は行を消すだけで書き戻さないため、Zod が未知キーを剥がす性質だけが効いている）。
    const stored = readStoredValues(database, "folders");
    expect(stored.some((value) => value.includes(`"isDefault"`))).toBe(true);
    for (const value of stored) {
      expect(FolderSchema.safeParse(JSON.parse(value)).success).toBe(true);
    }

    await close();
  });
});

describe("SCHEMA_VERSION を上げたときの挙動", () => {
  /**
   * 版を上げた 2 回目以降のセッションを、本番と同じ persistence（`reset` 付き）で開く。
   * コレクション設定を直に書くのは、`SCHEMA_VERSION` が定数で差し替えられないため。
   * 検証対象はコレクション設定ではなく **persistence のポリシー**なので、そこは本物を使う。
   */
  const openWithSchemaVersion = async (schemaVersion: number) => {
    const database = createNodeSqliteDatabase(file);
    const persistence = await createPersistence(database);
    const folderCollection = createCollection(
      persistedCollectionOptions<Folder, string>({
        id: "folders",
        getKey: (folder: Folder) => folder.id,
        persistence,
        schemaVersion,
      }),
    );
    return { folderCollection, close: (): Promise<void> => database.close() };
  };

  it("版を上げると作り直され、以後は正常に読み書きできる（無言の全断にならない）", async () => {
    const seed: Folder = { id: USER_FOLDER_ID, name: USER_FOLDER_NAME, createdAt: 100 };
    const next: Folder = { id: UNCATEGORIZED_FOLDER_ID, name: "未分類", createdAt: 0 };

    // --- 旧版で保存 ---
    {
      const { folderCollection, close } = await openWithSchemaVersion(SCHEMA_VERSION);
      await folderCollection.insert(seed).isPersisted.promise;
      expect(await folderCollection.toArrayWhenReady()).toHaveLength(1);
      await close();
    }

    // --- 版を上げて開く: 中身は破棄されるが、**書き込みは成功しなければならない** ---
    {
      const { folderCollection, close } = await openWithSchemaVersion(SCHEMA_VERSION + 1);
      expect(await folderCollection.toArrayWhenReady()).toHaveLength(0);
      // ポリシーを外すとここが reject する（例外は loopback sync に握り潰され、
      // 画面にはエラーが出ないまま以後の保存が全て失敗し続ける）。#192 で実機再現済み。
      await expect(folderCollection.insert(next).isPersisted.promise).resolves.toBeDefined();
      await close();
    }

    // --- 再起動しても壊れたままにならない ---
    {
      const { folderCollection, close } = await openWithSchemaVersion(SCHEMA_VERSION + 1);
      const folders = await folderCollection.toArrayWhenReady();
      expect(folders.map((folder) => folder.id)).toEqual([UNCATEGORIZED_FOLDER_ID]);
      await close();
    }
  });
});
