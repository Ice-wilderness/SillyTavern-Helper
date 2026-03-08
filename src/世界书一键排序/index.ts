$(() => {
  /**
   * 向世界书界面添加“一键排序”按钮
   */
  const addSortButton = () => {
    // 如果按钮已存在则不重复添加
    if ($('#one_click_sort').length > 0) return;

    // 查找世界书窗口的删除按钮
    const $deleteButton = $('#world_popup_delete');
    if ($deleteButton.length === 0) return;

    // 创建按钮 (使用图标代替文字)
    const $button = $(
      '<button id="one_click_sort" class="menu_button fa-solid fa-arrow-down-short-wide" title="按“顺序”数值一键重新排列自定义排序的顺序"></button>',
    );

    // 设置按钮样式，使其与酒馆风格一致
    $button.css({
      'margin-left': '10px',
      width: '40px', // 保持与其他图标按钮宽度一致
    });

    // 按钮点击事件
    $button.on('click', async () => {
      // 获取当前正在编辑的世界书名称
      const worldbookName = String($('#select2-world_editor_select-container').text().trim() || '');

      // 排除掉酒馆默认的占位符文本
      if (!worldbookName || worldbookName === '' || worldbookName === '--- 选择以编辑 ---') {
        toastr.warning('请先在编辑器中选择一个有效的世界书');
        return;
      }

      try {
        // 使用 TavernHelper 接口更新世界书
        await updateWorldbookWith(worldbookName, entries => {
          // 1. 按照 position.order (即“顺序”数值) 进行排序
          // 注意：我们不改变 order 的数值，只改变它们在数组中的相对位置
          const sorted = [...entries].sort((a, b) => {
            const orderA = a.position?.order ?? 0;
            const orderB = b.position?.order ?? 0;
            return orderA - orderB;
          });

          // 2. 更新每个条目的 display_index (自定义排序索引)
          // 在 SillyTavern 中，自定义排序是基于 display_index 的
          sorted.forEach((entry, index) => {
            if (!entry.extra) {
              entry.extra = {};
            }
            entry.extra.display_index = index;
          });

          return sorted;
        });

        // 3. 切换排序模式为“自定义排序” (值为 13)
        const $orderBy = $('#world_info_sort_order');
        if ($orderBy.length > 0) {
          $orderBy.val('13').trigger('change');
        }

        // 4. 刷新编辑器显示
        // 使用 builtin.reloadEditor 确保 UI 同步更新
        if (typeof builtin !== 'undefined' && builtin.reloadEditor) {
          builtin.reloadEditor(worldbookName);
        }

        toastr.success(`世界书《${worldbookName}》已按“顺序”数值完成一键排序并切换至自定义模式`);
      } catch (error) {
        console.error('[一键排序] 错误:', error);
        toastr.error('排序过程中出现错误，请查看控制台。');
      }
    });

    // 将按钮添加到删除按钮的右边
    $deleteButton.after($button);
  };

  // 每隔 1 秒检查一次是否需要添加按钮（处理界面切换或重新渲染的情况）
  const timer = setInterval(addSortButton, 1000);

  // 页面卸载时清理（虽然脚本通常随页面销毁）
  $(window).on('pagehide', () => {
    clearInterval(timer);
  });
});
