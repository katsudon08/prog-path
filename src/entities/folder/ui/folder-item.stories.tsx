import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { TUTORIAL_FOLDER_ID, UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import { buildFolderSections } from "../lib/build-folder-sections";
import { FOLDER_VISUALS } from "../model/folder-visual";
import type { Folder } from "../model/types";
import { FolderItem } from "./folder-item";

const USER_FOLDER: Folder = {
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name: "じっけん",
  createdAt: 100,
};
const RACE_FOLDER: Folder = {
  id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  name: "きょうそう",
  createdAt: 200,
};
const TUTORIAL_FOLDER: Folder = { id: TUTORIAL_FOLDER_ID, name: "チュートリアル", createdAt: 1 };
const UNCATEGORIZED_FOLDER: Folder = { id: UNCATEGORIZED_FOLDER_ID, name: "未分類", createdAt: 0 };

/** 行末スロットの見本。実際の中身は #194 / #196 が組む。 */
const MenuButton = (): React.JSX.Element => (
  <button
    type="button"
    aria-label="フォルダの メニュー"
    className="flex size-tap shrink-0 items-center justify-center rounded-button text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
  >
    <MoreHorizontal aria-hidden className="size-6" />
  </button>
);

/** 実寸 256px のサイドバーレールに載せて確認する（→ docs/screen-specs.md 4.2）。 */
const Rail = ({ children }: { children: React.ReactNode }): React.JSX.Element => (
  <div className="w-64 rounded-card border border-border bg-background p-2">{children}</div>
);

const SIDEBAR_MAZE_COUNTS: Record<string, number> = {
  [TUTORIAL_FOLDER_ID]: 6,
  [USER_FOLDER.id]: 5,
  [RACE_FOLDER.id]: 2,
  [UNCATEGORIZED_FOLDER_ID]: 7,
};

/** 選択状態を state で持ち、セクション振り分け・区切り線込みでサイドバーを再現するデモ。 */
const SidebarDemo = (): React.JSX.Element => {
  const [selectedId, setSelectedId] = useState<string>(TUTORIAL_FOLDER_ID);
  // 入力順をわざと崩して渡し、buildFolderSections が並びを決めていることを見せる。
  const sections = buildFolderSections([
    RACE_FOLDER,
    UNCATEGORIZED_FOLDER,
    USER_FOLDER,
    TUTORIAL_FOLDER,
  ]);
  return (
    <div className="flex flex-col gap-2">
      {sections.map((section, index) => (
        <div key={section.kind} className="flex flex-col gap-1">
          {index > 0 ? <hr className="border-border" /> : null}
          <ul aria-label={FOLDER_VISUALS[section.kind].labelJa} className="flex flex-col gap-1">
            {section.folders.map((folder) => (
              <li key={folder.id}>
                <FolderItem
                  folder={folder}
                  mazeCount={SIDEBAR_MAZE_COUNTS[folder.id] ?? 0}
                  selected={folder.id === selectedId}
                  onSelect={setSelectedId}
                  menu={<MenuButton />}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

const meta = {
  title: "entities/folder/FolderItem",
  component: FolderItem,
  args: { folder: USER_FOLDER, mazeCount: 5, selected: false, onSelect: () => {} },
  argTypes: {
    folder: { control: false },
    menu: { control: false },
    className: { control: false },
    mazeCount: { control: { type: "number", min: 0, max: 999 } },
  },
  decorators: [
    (Story) => (
      <Rail>
        <Story />
      </Rail>
    ),
  ],
} satisfies Meta<typeof FolderItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** コントロールで件数・選択状態を切り替えて確認する。 */
export const Playground: Story = {};

/** 選択中。色だけでなく「隆起カード + 太字」で示す（明暗どちらでも読めることを確認）。 */
export const Selected: Story = { args: { selected: true } };

/** 3 種別のアイコンの差（色に頼らず形で見分けられるか）。 */
export const AllKinds: Story = {
  render: (args) => (
    <div className="flex flex-col gap-1">
      <FolderItem {...args} folder={TUTORIAL_FOLDER} mazeCount={6} />
      <FolderItem {...args} folder={USER_FOLDER} mazeCount={5} />
      <FolderItem {...args} folder={RACE_FOLDER} mazeCount={2} />
      <FolderItem {...args} folder={UNCATEGORIZED_FOLDER} mazeCount={7} />
    </div>
  ),
};

/**
 * 全行に同じ menu を渡した状態。**未分類の行にだけメニューが出ない**ことを確認する
 * （グレーアウトではなく DOM から消える）。
 */
export const WithMenu: Story = {
  render: (args) => (
    <div className="flex flex-col gap-1">
      <FolderItem {...args} folder={TUTORIAL_FOLDER} mazeCount={6} menu={<MenuButton />} />
      <FolderItem {...args} folder={USER_FOLDER} mazeCount={5} menu={<MenuButton />} />
      <FolderItem {...args} folder={UNCATEGORIZED_FOLDER} mazeCount={7} menu={<MenuButton />} />
    </div>
  ),
};

/** 長い名前は 1 行で truncate する（全文は詳細側で見せる）。 */
export const LongName: Story = {
  args: {
    folder: { ...USER_FOLDER, name: "とてもながいフォルダのなまえをつけたばあい" },
    mazeCount: 8,
  },
};

/** 3 桁の件数でも名前と桁が競合しないこと（数字は等幅で揃える）。 */
export const LargeCount: Story = { args: { mazeCount: 128 } };

/** 件数 0（空フォルダ）。空であることが読み取れるか。 */
export const EmptyFolder: Story = { args: { mazeCount: 0 } };

/**
 * サイドバー全体。`buildFolderSections` の出力をそのまま描き、
 * 区切り線・並び順・選択の移り変わりを実寸で確認する。
 */
export const Sidebar: Story = { render: () => <SidebarDemo /> };
