// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { Command } from "@/entities/command";
import { createInitialMaze } from "@/entities/maze";
import type { Maze } from "@/entities/maze";
import type { CommandPath, InsertionPoint } from "@/features/command-management";
import { UNCATEGORIZED_FOLDER_ID } from "@/shared/config";
import type { ArStageController, OpenCameraFn } from "@/widgets/ar-stage";

import { ArRunWorkspace } from "./ar-run-workspace";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// 永久 pending のカメラ取得。ArStage を camera.status="loading" に固定して R3F Canvas を
// 描かせない（jsdom に WebGL は無い）。解決しないので act 警告になる遅延更新も起きない。
const pendingOpenCamera: OpenCameraFn = () => new Promise(() => {});

const MAZE: Maze = {
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name: "テスト用のめいろ",
  folderId: UNCATEGORIZED_FOLDER_ID,
  createdAt: 0,
  updatedAt: 0,
  ...createInitialMaze(5, 1),
};

const SIMPLE: Command[] = [
  { kind: "forward" },
  { kind: "turnRight" },
  { kind: "forward" },
  { kind: "ifHole" },
];

const noop = (): void => {};

/** ArStageController を満たす偽 controller（既定は「編集中・命令 4 つ」）。 */
const createController = (overrides: Partial<ArStageController> = {}): ArStageController => ({
  maze: MAZE,

  status: "idle",
  isEditable: true,
  isRunning: false,
  canRun: true,
  robot: null,
  moveCount: 0,
  robotAction: null,
  visibleFloor: 0,
  setVisibleFloor: noop,

  run: noop,
  pause: noop,
  resume: noop,
  reset: noop,
  closeResult: noop,

  successOpen: false,
  failureOpen: false,
  failureReason: null,

  commands: SIMPLE,
  selected: { containerPath: [], index: SIMPLE.length },
  openLoopPaths: [],
  activePath: null,
  readOnly: false,
  selectInsertionPoint: noop,
  deleteCommand: noop,

  deleteDialogOpen: false,
  deleteTargetLabel: null,
  confirmDelete: noop,
  cancelDelete: noop,

  unclosedLoopDialogOpen: false,
  dismissUnclosedLoop: noop,

  handleQr: noop,
  lastOutcome: null,
  loopDialogOpen: false,
  confirmLoop: noop,
  cancelLoop: noop,

  ...overrides,
});

const renderWorkspace = (overrides: Partial<ArStageController> = {}) =>
  render(
    <ArRunWorkspace controller={createController(overrides)} openCamera={pendingOpenCamera} />,
  );

describe("ArRunWorkspace", () => {
  it("実行中コマンド（activePath）を CommandPanel へ橋渡しして 1 つだけ強調する", () => {
    const { container } = renderWorkspace({ activePath: [1], readOnly: true });
    expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
  });

  it("activePath が null なら強調しない（?? undefined へ変換している証明）", () => {
    const { container } = renderWorkspace({ activePath: null });
    expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(0);
  });

  it("selected（次の追加位置）を橋渡しして末尾スロットだけハイライトする", () => {
    // CommandPanel は selected 未指定でも末尾を推測しない（忠実な鏡）ため、橋渡しが外れると
    // 「次にどこへ入るか」の表示が黙って消える。
    renderWorkspace();
    const slots = screen.getAllByLabelText("ここに追加");
    expect(slots[SIMPLE.length].getAttribute("aria-pressed")).toBe("true");
    expect(slots[0].getAttribute("aria-pressed")).toBe("false");
  });

  it("openLoopPaths を橋渡しして構築中ループを「まだ とじてないよ」で示す", () => {
    // 橋渡しが外れると、閉じ忘れが画面のどこにも出なくなる（トーストは数秒で消えるため）。
    renderWorkspace({
      commands: [{ kind: "loop", count: 3, children: [{ kind: "forward" }] }],
      openLoopPaths: [[0]],
    });
    expect(screen.getByText("まだ とじてないよ")).toBeDefined();
  });

  it("openLoopPaths が空なら構築中の表示を出さない", () => {
    renderWorkspace({
      commands: [{ kind: "loop", count: 3, children: [{ kind: "forward" }] }],
      openLoopPaths: [],
    });
    expect(screen.queryByText("まだ とじてないよ")).toBeNull();
  });

  it("readOnly を橋渡しし、追加スロットも削除ボタンも描かない", () => {
    renderWorkspace({ readOnly: true });
    expect(screen.queryAllByLabelText("ここに追加")).toHaveLength(0);
    expect(screen.queryAllByLabelText("けす")).toHaveLength(0);
  });

  it("削除ボタン押下で controller.deleteCommand に対象パスを渡す（#239 の導線）", () => {
    const deleteCommand = vi.fn();
    renderWorkspace({ deleteCommand });

    fireEvent.click(screen.getAllByLabelText("けす")[2]);
    expect(deleteCommand).toHaveBeenCalledWith<[CommandPath]>([2]);
  });

  it("追加スロット押下で controller.selectInsertionPoint に対象位置を渡す", () => {
    const selectInsertionPoint = vi.fn();
    renderWorkspace({ selectInsertionPoint });

    fireEvent.click(screen.getAllByLabelText("ここに追加")[3]);
    expect(selectInsertionPoint).toHaveBeenCalledWith<[InsertionPoint]>({
      containerPath: [],
      index: 3,
    });
  });

  it("カメラ取得中でもコマンドパネルは描かれる（ArStage の外に出している）", () => {
    renderWorkspace();
    // カメラ取得待ちの表示（CameraLoading の <output> = role="status"）が出ている状態。
    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.getAllByLabelText("ここに追加")).toHaveLength(SIMPLE.length + 1);
  });

  it("右パネルを名前付きランドマークにし、迷路名を表示する", () => {
    renderWorkspace();
    expect(screen.getByRole("region", { name: "つくったプログラム" })).toBeDefined();
    expect(screen.getByText(MAZE.name)).toBeDefined();
  });
});
