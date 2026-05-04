const SORT_MODES = ['order', 'priority', 'name', 'depth', 'uid', 'recommended'] as const;

type SortMode = (typeof SORT_MODES)[number];
type EntryComparator = (a: WorldbookEntry, b: WorldbookEntry) => number;

const Settings = z
  .object({
    sort_mode: z.enum(SORT_MODES).default('order'),
  })
  .prefault({});

const SORT_MODE_LABELS: Record<SortMode, string> = {
  order: '按顺序',
  priority: '按优先级',
  name: '按名称',
  depth: '按深度',
  uid: '按 UID',
  recommended: '推荐排序',
};

const RECOMMENDED_POSITION_RANK: Partial<Record<WorldbookEntry['position']['type'], number>> = {
  before_character_definition: 0,
  after_character_definition: 1,
  before_example_messages: 2,
  after_example_messages: 3,
  before_author_note: 4,
  after_author_note: 5,
};

const parseSortMode = (value: unknown): SortMode => {
  return typeof value === 'string' && SORT_MODES.includes(value as SortMode) ? (value as SortMode) : 'order';
};

const getSortMode = (): SortMode => {
  const result = Settings.safeParse(getVariables({ type: 'script' }));
  if (result.success) {
    return result.data.sort_mode;
  }
  insertOrAssignVariables({ sort_mode: 'order' }, { type: 'script' });
  return 'order';
};

const saveSortMode = (sortMode: SortMode) => {
  insertOrAssignVariables({ sort_mode: sortMode }, { type: 'script' });
};

const getOrder = (entry: WorldbookEntry) => entry.position?.order ?? 0;
const getUid = (entry: WorldbookEntry) => entry.uid ?? 0;
const getName = (entry: WorldbookEntry) => entry.name ?? '';
const getPositionType = (entry: WorldbookEntry) => entry.position?.type ?? '';
const getDepth = (entry: WorldbookEntry) => (entry.position?.type === 'at_depth' ? (entry.position.depth ?? 0) : 0);

const compareNumberAsc = (left: number, right: number) => left - right;
const compareStringAsc = (left: string, right: string) => left.localeCompare(right, undefined, { numeric: true });

const compareByOrder: EntryComparator = (a, b) =>
  compareNumberAsc(getOrder(a), getOrder(b)) || compareNumberAsc(getUid(a), getUid(b));

const compareByPriority: EntryComparator = (a, b) => {
  const getPriorityRank = (entry: WorldbookEntry) => {
    if (!entry.enabled) return 2;
    return entry.strategy?.type === 'constant' ? 0 : 1;
  };

  return (
    compareNumberAsc(getPriorityRank(a), getPriorityRank(b)) ||
    compareNumberAsc(getOrder(b), getOrder(a)) ||
    compareNumberAsc(getUid(a), getUid(b))
  );
};

const compareByName: EntryComparator = (a, b) =>
  compareStringAsc(getName(a), getName(b)) || compareNumberAsc(getUid(a), getUid(b));

const compareByDepth: EntryComparator = (a, b) =>
  compareNumberAsc(getDepth(a), getDepth(b)) || compareNumberAsc(getUid(a), getUid(b));

const compareByUid: EntryComparator = (a, b) => compareNumberAsc(getUid(a), getUid(b));

const getMaxDepth = (entries: WorldbookEntry[]) => {
  return entries.reduce((maxDepth, entry) => {
    if (entry.position?.type !== 'at_depth') return maxDepth;
    return Math.max(maxDepth, getDepth(entry));
  }, 0);
};

const createRecommendedComparator = (entries: WorldbookEntry[]): EntryComparator => {
  const maxDepth = getMaxDepth(entries);

  const getRecommendedRank = (entry: WorldbookEntry) => {
    if (entry.position?.type === 'at_depth') {
      return 6 + maxDepth - getDepth(entry);
    }
    const positionType = entry.position?.type;
    return positionType === undefined ? undefined : RECOMMENDED_POSITION_RANK[positionType];
  };

  return (a, b) => {
    const rankA = getRecommendedRank(a);
    const rankB = getRecommendedRank(b);

    if (rankA !== undefined && rankB !== undefined) {
      return compareNumberAsc(rankA, rankB) || compareByOrder(a, b);
    }
    if (rankA !== undefined) {
      return -1;
    }
    if (rankB !== undefined) {
      return 1;
    }

    return compareStringAsc(getPositionType(a), getPositionType(b)) || compareByOrder(a, b);
  };
};

const getComparator = (entries: WorldbookEntry[], sortMode: SortMode): EntryComparator => {
  switch (sortMode) {
    case 'priority':
      return compareByPriority;
    case 'name':
      return compareByName;
    case 'depth':
      return compareByDepth;
    case 'uid':
      return compareByUid;
    case 'recommended':
      return createRecommendedComparator(entries);
    case 'order':
      return compareByOrder;
  }
};

const sortWorldbookEntries = (entries: WorldbookEntry[], sortMode: SortMode) => {
  const sorted = [...entries].sort(getComparator(entries, sortMode));

  sorted.forEach((entry, index) => {
    if (!entry.extra) {
      entry.extra = {};
    }
    entry.extra.display_index = index;
  });

  return sorted;
};

$(() => {
  /**
   * 向世界书界面添加“一键排序”按钮和排序方式菜单
   */
  const addSortControls = () => {
    // 如果控件已存在则不重复添加
    if ($('#one_click_sort').length > 0 || $('#one_click_sort_mode').length > 0) return;

    // 查找世界书窗口的删除按钮
    const $deleteButton = $('#world_popup_delete');
    if ($deleteButton.length === 0) return;

    // 创建按钮 (使用图标代替文字)
    const $button = $(
      '<button id="one_click_sort" class="menu_button fa-solid fa-arrow-down-short-wide" title="按所选方式一键重新排列自定义排序顺序"></button>',
    );

    // 设置按钮样式，使其与酒馆风格一致
    $button.css({
      'margin-left': '10px',
      width: '40px', // 保持与其他图标按钮宽度一致
    });

    const $sortMode = $('<select id="one_click_sort_mode" class="text_pole" title="选择一键排序方式"></select>');
    SORT_MODES.forEach(sortMode => {
      $('<option>').val(sortMode).text(SORT_MODE_LABELS[sortMode]).appendTo($sortMode);
    });
    $sortMode.val(getSortMode());
    $sortMode.css({
      'margin-left': '6px',
      width: '110px',
    });
    $sortMode.on('change', () => {
      const sortMode = parseSortMode($sortMode.val());
      $sortMode.val(sortMode);
      saveSortMode(sortMode);
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

      const sortMode = parseSortMode($sortMode.val());
      saveSortMode(sortMode);

      try {
        // 使用 TavernHelper 接口更新世界书
        await updateWorldbookWith(worldbookName, entries => sortWorldbookEntries(entries, sortMode));

        // 切换排序模式为“自定义排序” (值为 13)
        const $orderBy = $('#world_info_sort_order');
        if ($orderBy.length > 0) {
          $orderBy.val('13').trigger('change');
        }

        // 刷新编辑器显示
        // 使用 builtin.reloadEditor 确保 UI 同步更新
        if (typeof builtin !== 'undefined' && builtin.reloadEditor) {
          builtin.reloadEditor(worldbookName);
        }

        toastr.success(`世界书《${worldbookName}》已按“${SORT_MODE_LABELS[sortMode]}”完成一键排序并切换至自定义模式`);
      } catch (error) {
        console.error('[一键排序] 错误:', error);
        toastr.error('排序过程中出现错误，请查看控制台。');
      }
    });

    // 将控件添加到删除按钮的右边
    $deleteButton.after($button, $sortMode);
  };

  // 每隔 1 秒检查一次是否需要添加控件（处理界面切换或重新渲染的情况）
  const timer = setInterval(addSortControls, 1000);

  // 页面卸载时清理（虽然脚本通常随页面销毁）
  $(window).on('pagehide', () => {
    clearInterval(timer);
  });
});
