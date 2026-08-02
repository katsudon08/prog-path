// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { buildTutorialMazes, TUTORIAL_MAZE_ID } from "@/shared/db";

import { MazePicker } from "./maze-picker";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// チュートリアル迷路（カリキュラム順）。件数はここから取り、テストに直接書かない。
const MAZES = buildTutorialMazes();

describe("MazePicker", () => {
  it("渡した迷路の件数だけカードを描く", () => {
    render(<MazePicker mazes={MAZES} onSelect={vi.fn()} />);

    expect(screen.getAllByRole("button")).toHaveLength(MAZES.length);
    for (const maze of MAZES) {
      expect(screen.getByText(maze.name)).toBeDefined();
    }
  });

  it("カード押下でその迷路の id を onSelect へ渡す", () => {
    const onSelect = vi.fn();
    render(<MazePicker mazes={MAZES} onSelect={onSelect} />);

    // 「くりかえし」の 1 件だけを押す（描画順は props の順という契約に依存）。
    const index = MAZES.findIndex((maze) => maze.id === TUTORIAL_MAZE_ID.LOOP);
    fireEvent.click(screen.getAllByRole("button")[index]);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(TUTORIAL_MAZE_ID.LOOP);
  });

  it("迷路が 1 件も無いときは作り方を案内し、カードを描かない", () => {
    render(<MazePicker mazes={[]} onSelect={vi.fn()} />);

    expect(screen.getByText(/めいろが まだ ありません/)).toBeDefined();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
