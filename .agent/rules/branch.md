---
trigger: always_on
---

# Branch Convention

AI がブランチを命名する際のルールを定義します。

---

## 基本フォーマット

```
<type>/<issue-number>-<short-description>
```

- `type` は commit / issue の type と統一する
- `issue-number` は GitHub Issue 番号（紐づくイシューがある場合は必須）
- `short-description` はケバブケース（小文字・ハイフン区切り）
- **全体で 50文字以内** を目安にする

**例:**
```
feat/123-user-profile-image-upload
fix/456-login-redirect-failure
chore/789-eslint-v9-migration
refactor/101-extract-query-builder
docs/112-api-auth-guide
spike/201-evaluate-drizzle-orm
```

---

## Type 一覧

| type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `refactor` | リファクタリング |
| `docs` | ドキュメント |
| `chore` | 環境整備・依存更新 |
| `test` | テスト追加・修正 |
| `spike` | 技術調査・PoC |
| `hotfix` | 本番緊急修正（main から直接分岐） |
| `release` | リリース準備 |

---

## ブランチ戦略

```
main
 └── develop              ← 開発統合ブランチ
      ├── feat/xxx        ← 機能開発
      ├── fix/xxx         ← バグ修正
      └── refactor/xxx    ← リファクタリング

main
 └── hotfix/xxx           ← 本番緊急修正（main から分岐）
```

| ブランチ | 説明 | マージ先 |
|---------|------|---------|
| `main` | 本番リリース済みコード | - |
| `develop` | 開発統合（次リリース候補） | `main` |
| `feat/*` | 機能開発 | `develop` |
| `fix/*` | バグ修正 | `develop` |
| `hotfix/*` | 緊急修正 | `main` + `develop` |
| `release/*` | リリース準備 | `main` + `develop` |

---

## 命名ルール

- **英語・小文字のみ**（ブランチ名は Git / GitHub / CI の技術的制約により日本語・大文字禁止）
- **ハイフン区切り**（アンダースコア・スペース禁止）
- issue 番号は省略不可（イシューが存在する場合）
- `wip-`, `tmp-`, `test-` などの曖昧なプレフィックス禁止

> **Note:** コミットメッセージやイシュータイトルは日本語で記述しますが、ブランチ名だけは URL・シェル・CI との互換性を保つため英語のケバブケースを維持します。

---

## 良い例 / 悪い例

```bash
# ✅ Good
feat/88-add-google-oauth
fix/102-cart-quantity-overflow
chore/55-upgrade-prisma-6

# ❌ Bad
feature/add-login          # type が統一されていない（feature → feat）
Fix_LoginBug               # 大文字・アンダースコア
my-branch                  # type なし・issue 番号なし
feat/88_add_Google_OAuth   # アンダースコア・大文字混在
```

---

## AI への指示テンプレート

```
以下の情報をもとに、branch.md のルールに従ってブランチ名を生成してください。

## 作業内容
[実装・修正・調査の内容を自由記述]

## 関連 Issue 番号
#[番号]（なければ「なし」）

## 制約
- type は feat / fix / chore / ... から選ぶ
- ケバブケース・小文字・英語
- 50文字以内
- issue 番号がある場合は必ず含める
```