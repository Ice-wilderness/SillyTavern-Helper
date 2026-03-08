# 酒馆后台保活 Git 更新模板

## 目标
仅更新本脚本，不影响仓库中其他脚本。

## 标准步骤

```bash
# 1) 修改本脚本源码
# src/酒馆后台保活/*

# 2) 构建
pnpm build

# 3) 只暂存本脚本相关文件
SCRIPT_NAME="酒馆后台保活"
git add "src/${SCRIPT_NAME}" "dist/${SCRIPT_NAME}"

# 4) 检查暂存内容（必须只看到本脚本路径）
git status
git diff --staged

# 5) 提交
git commit -m "$(cat <<'EOF'
更新脚本：酒馆后台保活

说明本次更新目的（为什么改）。
- 变更点 1
- 变更点 2
- 验证：pnpm build
EOF
)"

# 6) 推送
# git push
```

## 目录命名建议
- 建议保持目录名稳定，不用改文件夹名表示小版本。
- 仅在“脚本正式改名”或“并行维护不同大版本”时再新建/改名目录。
- 如果需要重命名目录，请使用 `git mv`。

## 提交前检查清单
- [ ] `git status` 里只有 `src/酒馆后台保活` 与 `dist/酒馆后台保活`
- [ ] `git diff --staged` 无其他脚本改动
- [ ] 构建通过（`pnpm build`）
