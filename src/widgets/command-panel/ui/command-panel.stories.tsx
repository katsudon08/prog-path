import { useEffect, useMemo, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { isLoopCommand, LOOP_COMMAND_KIND } from "@/entities/command";
import type { Command } from "@/entities/command";
import { COMMAND_BUILDER_OUTCOME_TYPE, deleteCommandAt } from "@/features/command-management";
import type { CommandPath, InsertionPoint } from "@/features/command-management";

import { CommandPanel } from "./command-panel";

// ---- サンプルの命令木 -------------------------------------------------------

const SIMPLE: Command[] = [
  { kind: "forward" },
  { kind: "turnRight" },
  { kind: "forward" },
  { kind: "ifHole" },
];

const NESTED: Command[] = [
  { kind: "forward" },
  {
    kind: LOOP_COMMAND_KIND,
    count: 3,
    children: [
      { kind: "forward" },
      {
        kind: LOOP_COMMAND_KIND,
        count: 2,
        children: [{ kind: "turnRight" }, { kind: "forward" }],
      },
      { kind: "ifHole" },
    ],
  },
  { kind: "turnLeft" },
];

const TALL: Command[] = [
  { kind: "forward" },
  { kind: "turnRight" },
  { kind: "forward" },
  { kind: "forward" },
  { kind: "turnLeft" },
  {
    kind: LOOP_COMMAND_KIND,
    count: 4,
    children: [{ kind: "forward" }, { kind: "turnRight" }, { kind: "ifHole" }],
  },
  { kind: "forward" },
  { kind: "turnRight" },
  { kind: "forward" },
  { kind: "ifHole" },
];

/**
 * コンテナ末尾（＝プログラム末尾・append 位置）の挿入位置を返す。
 * 起動時の既定選択に使う（親が初期 `selected` として末尾を渡す想定。widget 自身は既定を推測しない）。
 */
const tailPoint = (commands: readonly Command[]): InsertionPoint => ({
  containerPath: [],
  index: commands.length,
});

/** 木を pre-order で辿り、全ノードのパスを集める（実行中ハイライトのデモ用）。 */
const collectPaths = (commands: readonly Command[], base: number[] = []): number[][] => {
  const out: number[][] = [];
  commands.forEach((command, index) => {
    const path = [...base, index];
    out.push(path);
    if (isLoopCommand(command)) out.push(...collectPaths(command.children, path));
  });
  return out;
};

// ---- controlled 操作用の wrapper（robot-3d.stories の PlaythroughDemo に倣う）---------

/** 命令木・選択位置を state で持ち、追加位置クリックと削除を実際に反映するデモ。 */
const CommandPanelDemo = ({
  initialCommands,
  initialSelected,
}: {
  initialCommands: Command[];
  initialSelected?: InsertionPoint;
}): React.JSX.Element => {
  const [commands, setCommands] = useState<readonly Command[]>(initialCommands);
  const [selected, setSelected] = useState<InsertionPoint | undefined>(initialSelected);

  const handleDelete = (path: CommandPath): void => {
    // 削除ロジックは features の純粋関数を使う（page #190 と同じ配線を模す）。
    const result = deleteCommandAt(
      { commands, openLoopPaths: [], pendingLoopStart: null, nextQrAcceptedAt: 0 },
      path,
    );
    setCommands(result.state.commands);
    // 削除で命令木が変わったら選択を再同期する（stale な selected を残さない＝忠実な鏡の契約）。
    if (result.outcome.type === COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_DELETED) {
      setSelected(result.outcome.nextInsertionPoint);
    }
  };

  return (
    <CommandPanel
      commands={commands}
      selected={selected}
      onSelectInsertionPoint={setSelected}
      onDeleteCommand={handleDelete}
      className="h-full"
    />
  );
};

/** activePath を一定間隔で進め、実行中強調＋オートスクロールを再生する。 */
const RunningDemo = ({ commands }: { commands: Command[] }): React.JSX.Element => {
  const paths = useMemo(() => collectPaths(commands), [commands]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % paths.length);
    }, 900);
    return () => clearInterval(timer);
  }, [paths.length]);

  return (
    <CommandPanel
      commands={commands}
      activePath={paths[index]}
      readOnly
      onSelectInsertionPoint={() => {}}
      onDeleteCommand={() => {}}
      className="h-full"
    />
  );
};

// ---- meta -------------------------------------------------------------------

const meta = {
  title: "widgets/command-panel/CommandPanel",
  component: CommandPanel,
  args: {
    commands: [],
    onSelectInsertionPoint: () => {},
    onDeleteCommand: () => {},
    // 固定高さの箱いっぱいに広げ、内容がはみ出したら CommandPanel 内部でスクロールさせる。
    className: "h-full",
  },
  argTypes: {
    commands: { control: false },
    selected: { control: false },
    activePath: { control: false },
    className: { control: false },
  },
  // 固定高さ・縦積みのカードに収め、CommandPanel(h-full) を箱いっぱいに広げて内部スクロール
  // （手動スクロール・Running のオートスクロール）を確認できるようにする。
  decorators: [
    (Story) => (
      <div className="border-border bg-card flex h-96 w-80 flex-col overflow-hidden rounded-xl border p-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CommandPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 空スタック。追加スロットは1つだけ。起動時の既定として末尾（＝唯一の追加位置）を親が selected に渡しハイライト。 */
export const Empty: Story = { args: { commands: [], selected: tailPoint([]) } };

/** 単純な命令列。各命令の前後に追加位置スロット。起動時の既定として末尾（append 位置）を親が selected に渡しハイライト。 */
export const SimpleSequence: Story = { args: { commands: SIMPLE, selected: tailPoint(SIMPLE) } };

/** ループの入れ子。字下げ＋左ボーダーでネスト、`×N` で回数を表示。起動時の既定として末尾をハイライト。 */
export const NestedLoops: Story = { args: { commands: NESTED, selected: tailPoint(NESTED) } };

/** 途中の追加位置を選択した状態（末尾以外のスロットがハイライト）。 */
export const Selected: Story = {
  args: { commands: SIMPLE, selected: { containerPath: [], index: 1 } },
};

/** 箱を超える背の高いスタック。内部の overflow-y-auto を手動スクロールで確認できる。起動時の既定として末尾をハイライト。 */
export const Scrollable: Story = { args: { commands: TALL, selected: tailPoint(TALL) } };

/** 表示専用（実行フェーズ等）。追加スロット・削除ボタンを出さず、命令木を読むだけの状態。 */
export const ReadOnly: Story = { args: { commands: NESTED, readOnly: true } };

/** 実行中コマンドの強調＋オートスクロールを自動再生する。 */
export const Running: Story = {
  render: () => <RunningDemo commands={TALL} />,
};

/** 追加位置クリック→選択反映、削除→木から即消える、を実際に操作できる Playground。起動時は末尾を選択。 */
export const Interactive: Story = {
  render: () => <CommandPanelDemo initialCommands={NESTED} initialSelected={tailPoint(NESTED)} />,
};
