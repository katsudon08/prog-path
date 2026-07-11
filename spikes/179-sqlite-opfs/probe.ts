// #179 SQLite(WASM+OPFS) 永続化スパイク。
// 実コード（@/shared/db の initDb / MazeSchema）をブラウザで動かし、
// 迷路の追加がページ再読込を跨いで OPFS に永続するかを確認する。
import { UNCATEGORIZED_FOLDER_ID } from "@/shared/config";
import { initDb, MazeSchema, TILE_KIND } from "@/shared/db";
import type { AppDatabase, Maze } from "@/shared/db";

const SIZE = 5;
const logEl = document.getElementById("log");

const write = (text: string): void => {
  if (logEl) {
    logEl.textContent = text;
  }
};

/** 妥当な迷路を 1 件生成する（書き込み境界での Zod 検証も MazeSchema.parse で兼ねる）。 */
const makeMaze = (): Maze => {
  const now = Date.now();
  const floor: string[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, (): string => TILE_KIND.FLOOR),
  );
  floor[0][0] = TILE_KIND.START;
  floor[0][1] = TILE_KIND.GOAL;
  return MazeSchema.parse({
    id: crypto.randomUUID(),
    name: `迷路 ${new Date(now).toLocaleTimeString()}`,
    size: SIZE,
    floors: 1,
    tiles: [floor],
    folderId: UNCATEGORIZED_FOLDER_ID,
    createdAt: now,
    updatedAt: now,
  });
};

const render = async (db: AppDatabase): Promise<void> => {
  const folders = await db.folderCollection.toArrayWhenReady();
  const mazes = await db.mazeCollection.toArrayWhenReady();
  const hasUncategorized = folders.some((folder) => folder.id === UNCATEGORIZED_FOLDER_ID);
  const lines = [
    `フォルダ: ${folders.length} 件 (未分類あり: ${hasUncategorized ? "✓" : "✗"})`,
    `迷路: ${mazes.length} 件`,
    ...mazes.map((maze) => `  - ${maze.name} [${maze.id.slice(0, 8)}]`),
    "",
    mazes.length > 0
      ? "▶ この状態で［再読込］し、件数が保持されれば OPFS 永続化 OK"
      : "▶ ［迷路を1件追加］→［再読込］で永続を確認",
  ];
  write(lines.join("\n"));
};

const main = async (): Promise<void> => {
  const db = await initDb();
  await render(db);

  document.getElementById("add")?.addEventListener("click", () => {
    db.mazeCollection.insert(makeMaze());
    void render(db);
  });

  document.getElementById("clear")?.addEventListener("click", () => {
    void (async () => {
      const mazes = await db.mazeCollection.toArrayWhenReady();
      for (const maze of mazes) {
        db.mazeCollection.delete(maze.id);
      }
      await render(db);
    })();
  });

  document.getElementById("reload")?.addEventListener("click", () => {
    window.location.reload();
  });
};

void main().catch((error: unknown) => {
  write(`ERROR: ${String(error)}`);
});
