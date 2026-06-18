---
name: push
description: ローカルのコミットをリモートへ反映するスキル。「push して」「リモートに上げて」ときに使う。ブランチ安全確認と rebase での競合事前防止を含む。
---

# push — リモートへの反映

コミット済みの変更を安全にリモートへ push する。

## 手順

1. **ブランチ確認**: `git branch --show-current`。
   - `main` を直接 push しようとしている場合は、作業ブランチでの作業だったか確認する。
2. **未コミット差分の確認**: `git status` で push 対象が意図通りか確認する。
3. **競合の事前防止**: リモートの更新を取り込む。

   ```bash
   git pull --rebase origin <branch>
   ```

   - 競合した場合は内容を分析し、解消方針をユーザーに提示する（自動で強制解決しない）。
4. **push**:

   ```bash
   git push origin <branch>
   ```

   - 新規ブランチなら `git push -u origin <branch>`。
5. **失敗時**: 権限エラー・非 fast-forward などはエラー内容を分析し、次の手（手動解決方法など）をユーザーに提示する。`--force` は安易に使わない（使うなら `--force-with-lease` を提案し承認を取る）。

## 次のステップ

- レビュー依頼する場合は `pr` スキルへ続く。
