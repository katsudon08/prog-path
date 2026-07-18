// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { LOOP_COMMAND_KIND } from "@/entities/command";
import type { Command } from "@/entities/command";
import type { InsertionPoint } from "@/features/command-management";

import { CommandPanel } from "./command-panel";

// jsdom は scrollIntoView 未実装。オートスクロール呼び出しを観測するためスタブする。
const scrollIntoView = vi.fn();
Element.prototype.scrollIntoView = scrollIntoView;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const SIMPLE: Command[] = [
  { kind: "forward" },
  { kind: "turnRight" },
  { kind: "forward" },
  { kind: "ifHole" },
];

const noop = (): void => {};

describe("CommandPanel", () => {
  it("空スタックでも追加スロットを 1 つ描く", () => {
    render(<CommandPanel commands={[]} onSelectInsertionPoint={noop} onDeleteCommand={noop} />);
    expect(screen.getAllByLabelText("ここに追加")).toHaveLength(1);
  });

  it("命令数だけノードを描き、スロットは length+1 個", () => {
    render(<CommandPanel commands={SIMPLE} onSelectInsertionPoint={noop} onDeleteCommand={noop} />);
    expect(screen.getAllByLabelText("ここに追加")).toHaveLength(SIMPLE.length + 1);
    // 削除ボタンは 1 ノードに 1 つ → ノード数と一致。
    expect(screen.getAllByLabelText("けす")).toHaveLength(SIMPLE.length);
  });

  it("ループの入れ子を ×N 付きで描く", () => {
    const nested: Command[] = [
      {
        kind: LOOP_COMMAND_KIND,
        count: 3,
        children: [
          { kind: "forward" },
          { kind: LOOP_COMMAND_KIND, count: 2, children: [{ kind: "turnRight" }] },
        ],
      },
    ];
    render(<CommandPanel commands={nested} onSelectInsertionPoint={noop} onDeleteCommand={noop} />);
    expect(screen.getByText(/ループ.*×3/)).toBeDefined();
    expect(screen.getByText(/ループ.*×2/)).toBeDefined();
    // 外側 loop + 内側 loop + forward + turnRight = 4 ノード。
    expect(screen.getAllByLabelText("けす")).toHaveLength(4);
  });

  it("root スロット押下で正しい InsertionPoint を通知する", () => {
    const onSelect = vi.fn();
    render(
      <CommandPanel commands={SIMPLE} onSelectInsertionPoint={onSelect} onDeleteCommand={noop} />,
    );
    const slots = screen.getAllByLabelText("ここに追加");
    fireEvent.click(slots[3]);
    expect(onSelect).toHaveBeenCalledWith<[InsertionPoint]>({ containerPath: [], index: 3 });
  });

  it("ループ子コンテナ末尾スロットの InsertionPoint を通知する", () => {
    const onSelect = vi.fn();
    const tree: Command[] = [
      {
        kind: LOOP_COMMAND_KIND,
        count: 2,
        children: [{ kind: "forward" }, { kind: "turnRight" }],
      },
    ];
    render(
      <CommandPanel commands={tree} onSelectInsertionPoint={onSelect} onDeleteCommand={noop} />,
    );
    // DOM 順: root0, [0]0, [0]1, [0]2(=loop 子末尾), root1 → index 3 が loop 子末尾。
    const slots = screen.getAllByLabelText("ここに追加");
    fireEvent.click(slots[3]);
    expect(onSelect).toHaveBeenCalledWith<[InsertionPoint]>({ containerPath: [0], index: 2 });
  });

  it("selected をハイライト（aria-pressed）する", () => {
    render(
      <CommandPanel
        commands={SIMPLE}
        selected={{ containerPath: [], index: 1 }}
        onSelectInsertionPoint={noop}
        onDeleteCommand={noop}
      />,
    );
    const slots = screen.getAllByLabelText("ここに追加");
    expect(slots[1].getAttribute("aria-pressed")).toBe("true");
    expect(slots[0].getAttribute("aria-pressed")).toBe("false");
  });

  it("selected 未指定ならどのスロットも既定ハイライトしない", () => {
    render(<CommandPanel commands={SIMPLE} onSelectInsertionPoint={noop} onDeleteCommand={noop} />);
    const slots = screen.getAllByLabelText("ここに追加");
    expect(slots.every((slot) => slot.getAttribute("aria-pressed") === "false")).toBe(true);
  });

  it("削除ボタン押下で正しい CommandPath を通知する（確認は挟まない）", () => {
    const onDelete = vi.fn();
    render(
      <CommandPanel commands={SIMPLE} onSelectInsertionPoint={noop} onDeleteCommand={onDelete} />,
    );
    // 3 番目（index 2）のノードの「けす」を押す → 即 onDeleteCommand([2])。確認 UI は無い。
    fireEvent.click(screen.getAllByLabelText("けす")[2]);
    expect(onDelete).toHaveBeenCalledWith([2]);
    expect(screen.queryByText("はい")).toBeNull();
  });

  it("ネストした削除ボタンは loop 子のパスを通知する", () => {
    const onDelete = vi.fn();
    const tree: Command[] = [
      {
        kind: LOOP_COMMAND_KIND,
        count: 2,
        children: [{ kind: "forward" }, { kind: "turnRight" }],
      },
    ];
    render(
      <CommandPanel commands={tree} onSelectInsertionPoint={noop} onDeleteCommand={onDelete} />,
    );
    // 削除ボタン DOM 順: loop 自身[0], 子[0,0], 子[0,1]。子の 2 番目 → [0,1]。
    fireEvent.click(screen.getAllByLabelText("けす")[2]);
    expect(onDelete).toHaveBeenCalledWith([0, 1]);
  });

  it("activePath を aria-current で強調し、scrollIntoView を呼ぶ", () => {
    const { container } = render(
      <CommandPanel
        commands={SIMPLE}
        activePath={[0]}
        onSelectInsertionPoint={noop}
        onDeleteCommand={noop}
      />,
    );
    expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it("activePath 未指定なら強調もスクロールもしない", () => {
    const { container } = render(
      <CommandPanel commands={SIMPLE} onSelectInsertionPoint={noop} onDeleteCommand={noop} />,
    );
    expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(0);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("readOnly は追加スロットも削除ボタンも描かない（実行中は編集不可）", () => {
    render(
      <CommandPanel
        commands={SIMPLE}
        readOnly
        onSelectInsertionPoint={noop}
        onDeleteCommand={noop}
      />,
    );
    expect(screen.queryAllByLabelText("ここに追加")).toHaveLength(0);
    expect(screen.queryAllByLabelText("けす")).toHaveLength(0);
  });

  it("readOnly でもノードは描き、activePath の強調・オートスクロールは効く", () => {
    const { container } = render(
      <CommandPanel
        commands={SIMPLE}
        readOnly
        activePath={[0]}
        onSelectInsertionPoint={noop}
        onDeleteCommand={noop}
      />,
    );
    // 命令チップは描かれる（実行中ノードが aria-current="step" で 1 つ強調される）。
    expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
    expect(scrollIntoView).toHaveBeenCalled();
  });
});
