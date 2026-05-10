# convenient-edit recovered source

这是从用户提供的打包后 `index.js` 中复原出的源码级结构。

## 复原程度

- `src/方便修改/设置界面.vue`：来自 bundle 内嵌的 `sourcesContent`，基本可视为原始 SFC。
- `settings.ts`、`theme.ts`、`constants.ts`、`main.ts`：根据 minified bundle 的运行逻辑反混淆、重命名并拆分模块。语义等价，但变量名、文件拆分、类型声明和格式不保证与原仓库逐字一致。
- `index.bundle.pretty.js`：原始 bundle 的 Prettier 格式化版本，便于逐行核对。

## 功能概述

该扩展名为“更好的小铅笔”，用于 SillyTavern 风格页面：

- 在页面上创建可拖拽的悬浮编辑按钮。
- 点击按钮或按 `F8` 编辑当前可见消息。
- 如果用户已选中文本，会在编辑器中尽量定位并选中对应内容。
- 再次点击按钮或点击空白处，会触发保存按钮。
- 监听主题变化并同步悬浮按钮的颜色。
