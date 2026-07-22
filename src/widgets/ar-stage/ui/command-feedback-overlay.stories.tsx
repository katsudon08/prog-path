import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { COMMAND_KIND } from "@/entities/command";
import {
  COMMAND_BUILDER_ERROR_CODE,
  COMMAND_BUILDER_IGNORED_REASON,
  COMMAND_BUILDER_OUTCOME_TYPE,
} from "@/features/command-management";
import type { CommandBuilderOutcome } from "@/features/command-management";
import { Button } from "@/shared/ui";

import { CommandFeedbackOverlay } from "./command-feedback-overlay";
import type { CommandStackOutcome } from "../model/types";

const POINT = { containerPath: [], index: 0 };

/** ボタンで outcome を発火し、トーストの表示 → 自動フェードアウトを確認するデモ。 */
const OverlayDemo = (): React.JSX.Element => {
  const [last, setLast] = useState<CommandStackOutcome | null>(null);

  const emit = (outcome: CommandBuilderOutcome): void => {
    setLast((prev) => ({ seq: (prev?.seq ?? 0) + 1, outcome }));
  };

  const samples: { label: string; outcome: CommandBuilderOutcome }[] = [
    {
      label: "命令追加（forward）",
      outcome: {
        type: COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_ADDED,
        commandKind: COMMAND_KIND.FORWARD,
        nextInsertionPoint: POINT,
      },
    },
    {
      label: "命令追加（ifHole）",
      outcome: {
        type: COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_ADDED,
        commandKind: COMMAND_KIND.IF_HOLE,
        nextInsertionPoint: POINT,
      },
    },
    {
      label: "ループ確定",
      outcome: {
        type: COMMAND_BUILDER_OUTCOME_TYPE.LOOP_ADDED,
        loopPath: [0],
        nextInsertionPoint: POINT,
      },
    },
    {
      label: "ループ終了",
      outcome: {
        type: COMMAND_BUILDER_OUTCOME_TYPE.LOOP_CLOSED,
        closedLoopPath: [0],
        nextInsertionPoint: POINT,
      },
    },
    {
      label: "無視（cooldown）",
      outcome: {
        type: COMMAND_BUILDER_OUTCOME_TYPE.IGNORED,
        reason: COMMAND_BUILDER_IGNORED_REASON.COOLDOWN,
      },
    },
    {
      label: "エラー（不明な QR）",
      outcome: {
        type: COMMAND_BUILDER_OUTCOME_TYPE.ERROR,
        error: { code: COMMAND_BUILDER_ERROR_CODE.INVALID_QR_PAYLOAD, message: "internal" },
      },
    },
    {
      label: "loop-count-pending（トーストは出ない）",
      outcome: {
        type: COMMAND_BUILDER_OUTCOME_TYPE.LOOP_COUNT_PENDING,
        insertionPoint: POINT,
      },
    },
  ];

  return (
    <div className="flex w-[40rem] max-w-full flex-col gap-4">
      <div className="border-border bg-card relative h-48 overflow-hidden rounded-xl border">
        <CommandFeedbackOverlay lastOutcome={last} />
      </div>
      <div className="flex flex-wrap gap-2">
        {samples.map(({ label, outcome }) => (
          <Button
            key={label}
            size="sm"
            variant="outline"
            tone="neutral"
            onClick={() => emit(outcome)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};

const meta = {
  title: "widgets/ar-stage/CommandFeedbackOverlay",
  component: CommandFeedbackOverlay,
  args: { lastOutcome: null },
  argTypes: {
    lastOutcome: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof CommandFeedbackOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

/** ボタンで各 outcome を発火 → 2.5 秒で自動フェードアウトする様子を確認できる。 */
export const Interactive: Story = {
  render: () => <OverlayDemo />,
};
