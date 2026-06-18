---
name: commit
description: 変更を Conventional Commits + 日本語の規約に沿ってコミットするスキル。「コミットして」「変更を記録して」ときに使う。ブランチ確認・差分レビュー・規約準拠メッセージ生成を含む。
---

# commit — 規約準拠コミット

ProgPath のコミット規約（Conventional Commits + 日本語）に沿って安全にコミットする。

## コミット規約

```
<type>(<scope>): <日本語サマリ>

<本文（任意）: 何を・なぜ。関連 Issue: #N / closes #N>
```

- **type**: `feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `chore` / `build` / `ci`
- **scope**: FSD レイヤー/スライス名（例 `entities/robot`、`features/maze-edit`、`shared/ui`）。横断的なら省略可。
- **サマリ**: 命令形ではなく「何をしたか」を日本語で簡潔に。

## 手順

1. **ブランチ確認**: `git branch --show-current`。
   - `main` の場合は直接コミットせず、作業用ブランチ（例 `feat/...`）への切り替えを提案する。
2. **差分レビュー**: `git status` と `git diff` を確認。
   - 一時ファイル・デバッグ用 `console.log`・不要アセットの混入をチェック。
   - 規約（FSD 依存方向、命名、`any` 不使用など）に反していないか確認。
3. **粒度の判断**: 多数ファイルにまたがる場合は機能単位で分割コミットを提案する。
4. **メッセージ生成**: 上記規約でメッセージを作る。関連 Issue があれば本文に `#N`（クローズする場合は `closes #N`）。
5. **ユーザー確認**: 変更ファイル一覧と生成メッセージを提示し、コミット可否を確認する。
6. **実行**: 承認後にコミットする。

   ```bash
   git add <files>
   git commit -m "<type>(<scope>): <サマリ>" -m "<本文>"
   ```

## 禁止事項

- コミットメッセージ（サマリ・本文・フッター）に **Claude による署名・帰属を付けない**。`Co-Authored-By: Claude ...`、`Generated with Claude Code`、`🤖` などを一切含めないこと。人間による変更として記録する。

## 次のステップ

- リモートへ反映する場合は `push` スキル、PR を作る場合は `pr` スキルへ続く。
