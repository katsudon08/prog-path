---
name: pr
description: プルリクエストを作成するスキル。「PR を作って」「プルリク出して」ときに使う。ベースブランチは main。変更概要・関連 Issue・テスト観点を含む本文を生成する。
---

# pr — プルリクエスト作成

変更をレビュー可能な PR にまとめる。**ベースブランチは `main`**（開発のベース）。`release` はリリース済みコードの表示用なので開発 PR のベースにしない。

## 前提

- push 済みであること（未 push なら `push` スキルを先に実行）。
- 作業ブランチが `main` から分岐していること。

## 手順

1. **差分の把握**: `git log main..HEAD --oneline` と `git diff main...HEAD --stat` で変更全体を確認する。
2. **本文生成**: 以下を含める。
   - **概要**: この PR で何を・なぜ変えたか
   - **変更点**: 主要な変更を箇条書き
   - **関連 Issue**: `closes #N`（クローズしない関連は `#N`）
   - **テスト観点 / 動作確認**: どう検証したか・レビュアーが確認すべき点
3. **作成**:

   ```bash
   gh pr create --repo katsudon08/prog-path --base main --head <branch> \
     --title "<type>(<scope>): <日本語サマリ>" --body "<body>"
   ```

4. **Project 連携の確認**: 関連 Issue が Project #5 にある場合、PR マージで Status が動くか（または手動更新が要るか）を確認する。
5. **報告**: 作成した PR の URL を返す。

## 注意

- タイトルはコミット規約（Conventional Commits + 日本語）に合わせる。
- ベースを誤って `release` にしない。`main` を明示する。

## 禁止事項

- PR のタイトル・本文に **Claude による署名・帰属を付けない**。`🤖 Generated with Claude Code`、`Co-Authored-By: Claude ...` などを一切含めないこと。
