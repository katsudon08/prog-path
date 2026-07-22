import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { FloorSwitcher } from "./floor-switcher";

/** 選択状態を持って切替を実際に反映するデモラッパ。 */
const FloorSwitcherDemo = ({ floorCount }: { floorCount: number }): React.JSX.Element => {
  const [floor, setFloor] = useState(0);
  return (
    <div className="flex items-center gap-6">
      <FloorSwitcher floorCount={floorCount} visibleFloor={floor} onSelect={setFloor} />
      <p className="text-foreground text-base">
        いま {floor + 1} かいを ひょうじちゅう
        {floorCount <= 1 && "（1 かいだてでは スイッチャは でない）"}
      </p>
    </div>
  );
};

const meta = {
  title: "widgets/ar-stage/FloorSwitcher",
  component: FloorSwitcher,
  args: {
    floorCount: 3,
    visibleFloor: 0,
    onSelect: () => {},
  },
  argTypes: {
    floorCount: { control: { type: "number", min: 1, max: 3 } },
    visibleFloor: { control: { type: "number", min: 0, max: 2 } },
    onSelect: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof FloorSwitcher>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 3 階建て（上の階ほど上・現在階を solid で強調）。 */
export const ThreeFloors: Story = {};

/** 2 階建て・2 階を表示中。 */
export const TwoFloorsSecondSelected: Story = {
  args: { floorCount: 2, visibleFloor: 1 },
};

/** 1 階建てでは何も描かない（表示されないことの確認）。 */
export const SingleFloorHidden: Story = {
  render: () => <FloorSwitcherDemo floorCount={1} />,
};

/** 切替を実際に操作できる Playground。 */
export const Interactive: Story = {
  render: () => <FloorSwitcherDemo floorCount={3} />,
};
