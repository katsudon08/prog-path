---
name: issue
description: 作業項目を GitHub Issue として作成・整理し、GitHub Project #5 と連携させるスキル。「Issue を作って」「これをタスク化して」「バックログに積んで」ときに使う。plan スキルで固めた要件を Issue 化する用途も含む。
---

# issue — GitHub Issue の作成・管理

作業項目を、背景と受け入れ条件が明確な Issue にして Project #5 に載せる。

## リポジトリ / Project

- リポジトリ: `katsudon08/prog-path`
- Project: #5（`https://github.com/users/katsudon08/projects/5`、owner `katsudon08`）
- フィールド: Status / Priority(High/Medium/Low) / Estimate(フィボナッチ 1/2/3/5/8/13)

## 手順

1. **入力の収集（必須）**: Issue の内容を必ず具体化する。**推測で埋めない**。次の 2 方式のどちらでも対応する。
   - **引数で受け取る**: skill 起動時の引数で必要項目（タイトル / As Is / To Be / アクション / 課題、任意で Priority・Estimate・ラベル）が渡されていれば、それを使う。
   - **質問して受け取る**: 引数がない、または不足項目がある場合は、不足している必要項目を **すべて** ユーザーに質問して回答を得る（`AskUserQuestion` を活用）。回答が揃うまで Issue を作成しない。

   必要項目（4 項目は必須）:
   | 項目 | 必須 | 内容 |
   | --- | --- | --- |
   | タイトル | ✅ | 簡潔な要約 |
   | As Is | ✅ | 今の状態 |
   | To Be | ✅ | 理想の状態（＝完了条件、検証可能な形で） |
   | アクション | ✅ | 改善のための具体的アクション |
   | 課題 | ✅ | 現状分かっている課題（なければ「特になし」） |
   | Priority / Estimate / ラベル | 任意 | 指定があれば設定 |


2. **内容整理**: 収集した入力を、本文は必ず以下のテンプレートに沿って整形する。

   ```markdown
   ### As Is
   （今の状態を記載）

   ### To Be
   （理想の状態を記載。タスク完了の条件にもなる。）

   ### アクション
   （改善のための具体的なアクションを記載）

   ### 課題
   （現状分かっている課題を記載）
   ```

   - **As Is**: 現状を具体的に。
   - **To Be**: 理想の状態。ここが **タスク完了の条件** になるので、検証可能な形（チェックボックス `- [ ]` 等）で書く。
   - **アクション**: To Be に到達するための具体的な手順・作業。
   - **課題**: 現時点で分かっているリスク・未解決点・懸念。なければ「特になし」と明記。

3. **作成**: 本文をヒアドキュメントで渡して作成する。

   ```bash
   gh issue create --repo katsudon08/prog-path --title "<title>" --body "<body>"
   ```

4. **Project へ追加**: 既存 Issue を Project に載せる場合。

   ```bash
   gh project item-add 5 --owner katsudon08 --url <issue-url>
   ```

5. **フィールド設定**（任意）: Priority / Estimate / Status をユーザーと相談して設定する。

6. **報告**: 作成した Issue 番号と URL を返す。

## 禁止事項

- Issue のタイトル・本文に **Claude による署名・帰属を付けない**。`🤖 Generated with Claude Code`、`Co-Authored-By: Claude ...` などを一切含めないこと。

## 補足

- Project の Draft を実 Issue 化する場合は、GraphQL `convertProjectV2DraftIssueItemToIssue`（`itemId` と `repositoryId`）を使うと、Project 上の位置とフィールド値を保持したまま変換できる。
- ラベルが整備されていれば `--label` で付与する。
