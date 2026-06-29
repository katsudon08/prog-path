# docs/ai — AI 作業場

このディレクトリは、**AI との議論・調査・実装計画の一時保管場所**です。

原則として、このディレクトリ内の作業メモは **Git 管理しません**（`.gitignore` 対象）。
「考えている途中」「個人的な調査」「実装前の計画」を気軽に置くスクラッチであり、
チームの「正」を置く場所ではありません。

> この `README.md` だけは例外で Git 追跡します（運用ルールを全員・将来の自分が参照できるようにするため）。
> `.gitignore` 側で `/docs/ai/*` を無視しつつ `!/docs/ai/README.md` で本ファイルのみ再追跡しています。

## 共有すべき内容の昇格先

チームに共有すべき・永続化すべき内容は、ここに残さず以下のいずれかへ **昇格** させます。

| 内容 | 昇格先 |
| --- | --- |
| アーキテクチャ上の判断 | `docs/adr/` |
| 実装単位の説明 | PR 本文 |
| タスク単位の補足 | Issue コメント |
| AI に継続的に守らせるルール | `CLAUDE.md` / `AGENTS.md` |

作業メモは「昇格元のドラフト」であり、昇格後は役目を終える。残し続ける義務はない。

## ファイル命名規則

**Issue 番号を基準**にする。ブランチ名（`test/172-...`）は `/` を含み、また plan 段階ではブランチ/Issue が存在しないこともあるため、そのままは流用しない。

- **Issue に紐づくメモ**: `<issue>-<kebab-summary>.md`
  - 例: `172-test-foundation.md` / `180-camera-abstraction.md` / `177-qr-capacity-spike.md`
  - `type`（feat/fix 等）は付けない。Issue 番号で一意に追える。
- **Issue が無い調査・計画メモ**: `<kebab-topic>.md`（番号省略）。時系列を重視するなら `YYYY-MM-DD-<topic>.md`。
  - 例: `fsd-boundary-research.md` / `2026-06-29-vite-plus-notes.md`

いずれも本文は kebab-case。1 つの Issue に複数メモが必要なら `<issue>-<topic>-2.md` のように suffix で分ける。
