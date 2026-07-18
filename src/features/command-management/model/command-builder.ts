/**
 * QR命令の構築・編集ロジック（FSD: features/command-management/model）
 *
 * カメラやReactを参照せず、状態と入力から次の状態を返す純粋なモデルである。
 * QRデコーダが返す生ペイロードの解釈、loop構築、挿入位置の検証、削除を担う。
 */
import {
  COMMAND_KIND,
  CommandKindSchema,
  isLoopCommand,
  LOOP_COMMAND_KIND,
} from "@/entities/command";
import type { Command, CommandKind, LoopCommand } from "@/entities/command";
import { COMMAND_SCAN_COOLDOWN_MS, LOOP_COUNT_MAX, LOOP_COUNT_MIN } from "@/shared/config";
import { shallowArrayEqual } from "@/shared/lib";

import {
  COMMAND_BUILDER_ERROR_CODE,
  COMMAND_BUILDER_IGNORED_REASON,
  COMMAND_BUILDER_OUTCOME_TYPE,
  InsertionPointSchema,
  LoopCountSchema,
  type CommandBuilderError,
  type CommandBuilderOutcome,
  type CommandBuilderResult,
  type CommandBuilderState,
  type CommandPath,
  type InsertionPoint,
} from "./types";

/** 空の命令構築状態を作る。 */
export const createInitialCommandBuilderState = (): CommandBuilderState => ({
  commands: [],
  openLoopPaths: [],
  pendingLoopStart: null,
  nextQrAcceptedAt: 0,
});

const createError = (
  code: CommandBuilderError["code"],
  message: string,
  details: Omit<CommandBuilderError, "code" | "message"> = {},
): CommandBuilderError => ({ code, message, ...details });

const createResult = (
  state: CommandBuilderState,
  outcome: CommandBuilderOutcome,
): CommandBuilderResult => ({ state, outcome });

const copyPath = (path: CommandPath): number[] => [...path];

const copyInsertionPoint = (point: InsertionPoint): InsertionPoint => ({
  containerPath: copyPath(point.containerPath),
  index: point.index,
});

const pathsEqual = (left: CommandPath, right: CommandPath): boolean =>
  shallowArrayEqual(left, right);

const isPathPrefix = (prefix: CommandPath, path: CommandPath): boolean =>
  prefix.length <= path.length && prefix.every((value, index) => value === path[index]);

const isNonNegativeInteger = (value: number): boolean => Number.isInteger(value) && value >= 0;

/** パスで示されたloopのchildren、またはrootの命令配列を読み取る。 */
const resolveContainer = (
  commands: readonly Command[],
  containerPath: CommandPath,
): readonly Command[] | null => {
  let current: readonly Command[] = commands;

  for (const segment of containerPath) {
    if (!isNonNegativeInteger(segment) || segment >= current.length) return null;
    const command = current[segment];
    if (!isLoopCommand(command)) return null;
    current = command.children;
  }

  return current;
};

/** パスで示された命令を読み取る。root自身は命令ではないためnullを返す。 */
const resolveCommand = (commands: readonly Command[], path: CommandPath): Command | null => {
  if (path.length === 0) return null;

  let current: readonly Command[] = commands;
  for (let index = 0; index < path.length; index += 1) {
    const segment = path[index];
    if (!isNonNegativeInteger(segment) || segment >= current.length) return null;

    const command = current[segment];
    if (index === path.length - 1) return command;
    if (!isLoopCommand(command)) return null;
    current = command.children;
  }

  return null;
};

/** 指定された挿入位置が現在の状態で有効か検証する。 */
const validateInsertionPoint = (
  state: CommandBuilderState,
  insertionPoint: InsertionPoint,
): CommandBuilderError | null => {
  const container = resolveContainer(state.commands, insertionPoint.containerPath);
  if (container === null) {
    return createError(
      COMMAND_BUILDER_ERROR_CODE.INVALID_INSERTION_POINT,
      "挿入先のパスが存在しないか、loopのchildrenを指していません。",
      { path: insertionPoint.containerPath },
    );
  }

  if (insertionPoint.index > container.length) {
    return createError(
      COMMAND_BUILDER_ERROR_CODE.INVALID_INSERTION_POINT,
      "挿入位置のindexが命令リストの範囲外です。",
      { path: insertionPoint.containerPath },
    );
  }

  const activeLoopPath = state.openLoopPaths[state.openLoopPaths.length - 1];
  if (activeLoopPath !== undefined && !pathsEqual(activeLoopPath, insertionPoint.containerPath)) {
    return createError(
      COMMAND_BUILDER_ERROR_CODE.INVALID_INSERTION_POINT,
      "loop構築中は一番内側のloopのchildrenにだけ追加できます。",
      { path: insertionPoint.containerPath },
    );
  }

  return null;
};

/** パスで示す配列へ命令を挿入し、変更経路だけを複製する。 */
const insertAt = (
  commands: readonly Command[],
  containerPath: CommandPath,
  index: number,
  command: Command,
): Command[] | null => {
  if (containerPath.length === 0) {
    return [...commands.slice(0, index), command, ...commands.slice(index)];
  }

  const [head, ...tail] = containerPath;
  if (!isNonNegativeInteger(head) || head >= commands.length) return null;

  const target = commands[head];
  if (!isLoopCommand(target)) return null;

  const children = insertAt(target.children, tail, index, command);
  if (children === null) return null;

  const updated = commands.slice();
  updated[head] = { ...target, children };
  return updated;
};

interface RemovedCommand {
  readonly commands: Command[];
  readonly command: Command;
  readonly parentPath: CommandPath;
  readonly index: number;
}

/** パスで示す命令を削除し、削除位置を返す。 */
const removeAt = (
  commands: readonly Command[],
  path: CommandPath,
  parentPath: CommandPath = [],
): RemovedCommand | null => {
  if (path.length === 0) return null;

  const [head, ...tail] = path;
  if (!isNonNegativeInteger(head) || head >= commands.length) return null;

  const target = commands[head];
  if (tail.length === 0) {
    return {
      commands: [...commands.slice(0, head), ...commands.slice(head + 1)],
      command: target,
      parentPath: copyPath(parentPath),
      index: head,
    };
  }

  if (!isLoopCommand(target)) return null;

  const nested = removeAt(target.children, tail, [...parentPath, head]);
  if (nested === null) return null;

  const updated = commands.slice();
  updated[head] = { ...target, children: nested.commands };
  return { ...nested, commands: updated };
};

/** 命令削除後に、残っている構築中loopのパスを調整する。 */
const updateOpenLoopPathsAfterDeletion = (
  openLoopPaths: readonly CommandPath[],
  deletedPath: CommandPath,
): CommandPath[] => {
  const parentPath = deletedPath.slice(0, -1);
  const deletedIndex = deletedPath[deletedPath.length - 1];
  if (deletedIndex === undefined) return openLoopPaths.map(copyPath);

  return openLoopPaths.flatMap((path) => {
    if (isPathPrefix(deletedPath, path)) return [];

    if (
      path.length > parentPath.length &&
      pathsEqual(path.slice(0, parentPath.length), parentPath) &&
      path[parentPath.length] > deletedIndex
    ) {
      const updated = copyPath(path);
      updated[parentPath.length] -= 1;
      return [updated];
    }

    return [copyPath(path)];
  });
};

/** 操作後にUIが使える挿入位置を、現在の構築コンテキストから作る。 */
const createNextInsertionPoint = (
  commands: readonly Command[],
  openLoopPaths: readonly CommandPath[],
  preferredContainerPath: CommandPath,
  preferredIndex: number,
): InsertionPoint => {
  const activePath = openLoopPaths[openLoopPaths.length - 1];
  const containerPath = activePath === undefined ? preferredContainerPath : activePath;
  const container = resolveContainer(commands, containerPath);
  const length = container?.length ?? 0;
  const index = pathsEqual(containerPath, preferredContainerPath)
    ? Math.min(preferredIndex, length)
    : length;

  return { containerPath: copyPath(containerPath), index };
};

const addQrCooldown = (state: CommandBuilderState, now: number): CommandBuilderState => ({
  ...state,
  nextQrAcceptedAt: now + COMMAND_SCAN_COOLDOWN_MS,
});

const errorResult = (
  state: CommandBuilderState,
  error: CommandBuilderError,
  now?: number,
): CommandBuilderResult =>
  createResult(now === undefined ? state : addQrCooldown(state, now), {
    type: COMMAND_BUILDER_OUTCOME_TYPE.ERROR,
    error,
  });

/**
 * QRペイロードを命令構築へ適用する。
 *
 * @param state 現在の命令構築状態
 * @param payload shared/qrが返した生のQR文字列
 * @param insertionPoint UIが選択した追加位置
 * @param now 重複抑止判定に使う現在時刻（ミリ秒）
 * @returns 次状態と、UIが表示・選択更新に使うResult
 */
export const handleQrPayload = (
  state: CommandBuilderState,
  payload: string,
  insertionPoint: InsertionPoint,
  now: number,
): CommandBuilderResult => {
  if (!Number.isFinite(now)) {
    return errorResult(
      state,
      createError(
        COMMAND_BUILDER_ERROR_CODE.INVALID_TIMESTAMP,
        "QR入力の時刻は有限数である必要があります。",
      ),
    );
  }

  if (now < state.nextQrAcceptedAt) {
    return createResult(state, {
      type: COMMAND_BUILDER_OUTCOME_TYPE.IGNORED,
      reason: COMMAND_BUILDER_IGNORED_REASON.COOLDOWN,
    });
  }

  if (state.pendingLoopStart !== null) {
    return createResult(state, {
      type: COMMAND_BUILDER_OUTCOME_TYPE.IGNORED,
      reason: COMMAND_BUILDER_IGNORED_REASON.LOOP_COUNT_PENDING,
    });
  }

  const parsed = CommandKindSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResult(
      state,
      createError(
        COMMAND_BUILDER_ERROR_CODE.INVALID_QR_PAYLOAD,
        "対応していないQRペイロードです。",
        {
          payload,
        },
      ),
    );
  }

  const commandKind: CommandKind = parsed.data;

  if (commandKind === COMMAND_KIND.LOOP_END) {
    const activeLoopPath = state.openLoopPaths[state.openLoopPaths.length - 1];
    if (activeLoopPath === undefined) {
      return errorResult(
        state,
        createError(
          COMMAND_BUILDER_ERROR_CODE.LOOP_END_WITHOUT_LOOP,
          "完了できる構築中loopがありません。",
        ),
        now,
      );
    }

    const nextOpenLoopPaths = state.openLoopPaths.slice(0, -1).map(copyPath);
    const parentPath = activeLoopPath.slice(0, -1);
    const childIndex = activeLoopPath[activeLoopPath.length - 1];
    const nextInsertionPoint = createNextInsertionPoint(
      state.commands,
      nextOpenLoopPaths,
      parentPath,
      (childIndex ?? 0) + 1,
    );

    return createResult(
      {
        ...addQrCooldown(state, now),
        openLoopPaths: nextOpenLoopPaths,
      },
      {
        type: COMMAND_BUILDER_OUTCOME_TYPE.LOOP_CLOSED,
        closedLoopPath: copyPath(activeLoopPath),
        nextInsertionPoint,
      },
    );
  }

  const parsedInsertionPoint = InsertionPointSchema.safeParse(insertionPoint);
  if (!parsedInsertionPoint.success) {
    return errorResult(
      state,
      createError(COMMAND_BUILDER_ERROR_CODE.INVALID_INSERTION_POINT, "挿入位置の形が不正です。", {
        path: insertionPoint.containerPath,
      }),
      now,
    );
  }

  const validInsertionPoint = parsedInsertionPoint.data;
  const insertionError = validateInsertionPoint(state, validInsertionPoint);
  if (insertionError !== null) return errorResult(state, insertionError, now);

  if (commandKind === COMMAND_KIND.LOOP_START) {
    return createResult(
      {
        ...addQrCooldown(state, now),
        pendingLoopStart: { insertionPoint: copyInsertionPoint(validInsertionPoint) },
      },
      {
        type: COMMAND_BUILDER_OUTCOME_TYPE.LOOP_COUNT_PENDING,
        insertionPoint: copyInsertionPoint(validInsertionPoint),
      },
    );
  }

  const command: Command = { kind: commandKind };
  const commands = insertAt(
    state.commands,
    validInsertionPoint.containerPath,
    validInsertionPoint.index,
    command,
  );
  if (commands === null) {
    return errorResult(
      state,
      createError(
        COMMAND_BUILDER_ERROR_CODE.INVALID_INSERTION_POINT,
        "命令を挿入できない位置です。",
        { path: validInsertionPoint.containerPath },
      ),
      now,
    );
  }

  return createResult(
    {
      ...addQrCooldown(state, now),
      commands,
    },
    {
      type: COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_ADDED,
      commandKind,
      nextInsertionPoint: {
        containerPath: copyPath(validInsertionPoint.containerPath),
        index: validInsertionPoint.index + 1,
      },
    },
  );
};

/**
 * 保留中のloopStartへ回数を確定する。
 *
 * 無効な回数の場合はpending状態を維持し、UIが再入力できるようにする。
 */
export const confirmLoopCount = (
  state: CommandBuilderState,
  count: number,
): CommandBuilderResult => {
  const pending = state.pendingLoopStart;
  if (pending === null) {
    return errorResult(
      state,
      createError(
        COMMAND_BUILDER_ERROR_CODE.LOOP_COUNT_NOT_PENDING,
        "回数入力待ちのloopStartがありません。",
      ),
    );
  }

  const parsedCount = LoopCountSchema.safeParse(count);
  if (!parsedCount.success) {
    return errorResult(
      state,
      createError(
        COMMAND_BUILDER_ERROR_CODE.LOOP_COUNT_OUT_OF_RANGE,
        `loop回数は${LOOP_COUNT_MIN}〜${LOOP_COUNT_MAX}の整数で指定してください。`,
        { min: LOOP_COUNT_MIN, max: LOOP_COUNT_MAX },
      ),
    );
  }

  const insertionError = validateInsertionPoint(state, pending.insertionPoint);
  if (insertionError !== null) return errorResult(state, insertionError);

  const loop: LoopCommand = {
    kind: LOOP_COMMAND_KIND,
    count: parsedCount.data,
    children: [],
  };
  const commands = insertAt(
    state.commands,
    pending.insertionPoint.containerPath,
    pending.insertionPoint.index,
    loop,
  );
  if (commands === null) {
    return errorResult(
      state,
      createError(
        COMMAND_BUILDER_ERROR_CODE.INVALID_INSERTION_POINT,
        "loopを挿入できない位置です。",
        { path: pending.insertionPoint.containerPath },
      ),
    );
  }

  const loopPath = [...pending.insertionPoint.containerPath, pending.insertionPoint.index];
  const nextInsertionPoint: InsertionPoint = {
    containerPath: copyPath(loopPath),
    index: 0,
  };

  return createResult(
    {
      ...state,
      commands,
      openLoopPaths: [...state.openLoopPaths.map(copyPath), loopPath],
      pendingLoopStart: null,
    },
    { type: COMMAND_BUILDER_OUTCOME_TYPE.LOOP_ADDED, loopPath, nextInsertionPoint },
  );
};

/** 保留中のloopStartを破棄し、通常のQR入力へ戻る。 */
export const cancelLoopStart = (state: CommandBuilderState): CommandBuilderResult => {
  const pending = state.pendingLoopStart;
  if (pending === null) {
    return errorResult(
      state,
      createError(
        COMMAND_BUILDER_ERROR_CODE.LOOP_COUNT_NOT_PENDING,
        "回数入力待ちのloopStartがありません。",
      ),
    );
  }

  return createResult(
    { ...state, pendingLoopStart: null },
    {
      type: COMMAND_BUILDER_OUTCOME_TYPE.CANCELLED,
      nextInsertionPoint: copyInsertionPoint(pending.insertionPoint),
    },
  );
};

/**
 * 指定パスの命令を削除する。
 *
 * loopを削除した場合は、内部の命令と、そのloop以下の構築中スタックも破棄する。
 */
export const deleteCommandAt = (
  state: CommandBuilderState,
  path: CommandPath,
): CommandBuilderResult => {
  if (state.pendingLoopStart !== null) {
    return errorResult(
      state,
      createError(
        COMMAND_BUILDER_ERROR_CODE.LOOP_COUNT_PENDING,
        "回数入力中は削除できません。先に入力をキャンセルしてください。",
      ),
    );
  }

  if (path.length === 0 || !path.every(isNonNegativeInteger)) {
    return errorResult(
      state,
      createError(COMMAND_BUILDER_ERROR_CODE.INVALID_COMMAND_PATH, "削除対象のパスが不正です。", {
        path,
      }),
    );
  }

  const removed = removeAt(state.commands, path);
  if (removed === null || resolveCommand(state.commands, path) === null) {
    return errorResult(
      state,
      createError(
        COMMAND_BUILDER_ERROR_CODE.INVALID_COMMAND_PATH,
        "削除対象の命令が存在しません。",
        {
          path,
        },
      ),
    );
  }

  const openLoopPaths = updateOpenLoopPathsAfterDeletion(state.openLoopPaths, path);
  const nextInsertionPoint = createNextInsertionPoint(
    removed.commands,
    openLoopPaths,
    removed.parentPath,
    removed.index,
  );

  return createResult(
    {
      ...state,
      commands: removed.commands,
      openLoopPaths,
    },
    {
      type: COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_DELETED,
      deletedPath: copyPath(path),
      nextInsertionPoint,
    },
  );
};
