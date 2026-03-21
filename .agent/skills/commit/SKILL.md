# Commit Convention

Conventional Commits に準拠したコミットメッセージのルールを定義します。

---

## 基本フォーマット

```
<type>(<scope>): <subject>

[body]

[footer]
```

- **1行目（ヘッダー）** は必須。72文字以内。
- **body** は任意。変更の *なぜ* を説明する。
- **footer** は任意。Issue 参照や Breaking Change を記載する。

---

## Type 一覧

| type | 用途 |
|------|------|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `style` | コードの動作に影響しない変更（フォーマット、空白など） |
| `refactor` | バグ修正・機能追加を伴わないリファクタリング |
| `perf` | パフォーマンス改善 |
| `test` | テストの追加・修正 |
| `chore` | ビルドプロセス・補助ツールの変更（src 非影響） |
| `ci` | CI 設定・スクリプトの変更 |
| `build` | ビルドシステム・外部依存関係の変更 |
| `revert` | 過去コミットの取り消し |

---

## Scope（任意）

変更対象のモジュール・レイヤーを小文字スネークケースで記載します。

**例:**
```
feat(auth): Google OAuth ログインを追加
fix(api): 429 レート制限エラーのハンドリングを修正
refactor(db): クエリビルダーを切り出す
```

scope はプロジェクトに合わせて定義し、`docs/prompts/` 配下の仕様書と対応させる。

---

## Subject のルール

- **日本語で記述する**
- 体言止め、または「〜を追加」「〜を修正」などの語尾に統一する
- 末尾に句点不要
- 72文字（全角換算36文字）以内

---

## Body

```
feat(user): add profile image upload

画像は WebP に変換してから S3 に保存する。
ファイルサイズ上限は 5MB。
```

---

## Footer

### Issue 参照
```
Closes #123
Refs #456
```

### Breaking Change
```
BREAKING CHANGE: `createUser` の引数が変わりました。
Before: createUser(name, email)
After:  createUser({ name, email, role })
```

---

## AI への指示テンプレート

```
以下の変更内容をもとに、commit.md のルールに従ってコミットメッセージを生成してください。

## 変更内容
- [変更点を箇条書き]

## 制約
- type は feat / fix / docs / ... から選ぶ
- subject は日本語・体言止めまたは「〜を追加/修正/削除」形式・全角36文字以内
- 関連 Issue があれば footer に記載する: Closes #[番号]
- Breaking Change がある場合は footer に BREAKING CHANGE: を記載する
```

---

## 良い例 / 悪い例

```bash
# ✅ Good
feat(cart): カートの商品数量更新エンドポイントを追加
fix(auth): ログイン時のセッション固定化を防ぐ
docs: API 認証ガイドを更新

# ❌ Bad
バグを直した                        # type なし
feat: Updated the cart              # 英語・過去形
WIP                                 # 情報不足
feat(auth): Google OAuthログインを追加しました  # 「ました」調は不統一の原因になるため避ける
```