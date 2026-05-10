/**
 * 还原后的 SillyTavern "方便修改" (Convenient Edit) 扩展代码
 *
 * 这段代码原始是使用 Vue 3, Pinia 和 Webpack 打包的。
 * 为了提高可读性，这里进行了反混淆、变量重命名和逻辑拆分。
 */

import { createPinia, defineStore, storeToRefs } from 'https://testingcf.jsdelivr.net/npm/pinia/+esm';
// 注意：原代码导入了 klona，但在实际逻辑中似乎被用来深拷贝对象，如果环境不支持，可以使用 JSON.parse(JSON.stringify()) 代替，或者保留。

// ==========================================
// 模块 1: CSS 注入工具 (Vue Style Loader 逻辑的简化还原)
// ==========================================
// 原代码包含了一大段用于动态插入 CSS 的代码 (webpack 的 style-loader 功能)。
// 这里简化为一个简单的样式注入函数，只保留核心逻辑。
function injectStyles(cssText, scriptId) {
    if (typeof document === 'undefined') return;
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    if (scriptId) {
        styleElement.setAttribute('data-vue-ssr-id', scriptId); // 模拟 vue-style-loader
    }
    if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText = cssText;
    } else {
        styleElement.appendChild(document.createTextNode(cssText));
    }
    document.head.appendChild(styleElement);
}

// 注入组件样式
const componentCss = `
.hint[data-v-6537be84] { opacity: 0.7; font-size: 12px; }
.flex-container[data-v-6537be84] { display: flex; align-items: center; gap: 8px; }
`;
// 模拟执行原代码中的模块 739，注入样式
injectStyles(componentCss, '1b869912');

// ==========================================
// 模块 2: Pinia Stores 定义
// ==========================================

// 模拟外部环境可能提供的全局变量或函数，SillyTavern 环境特有
// 如果是在独立测试，需要 mock 这些函数
const _z = typeof z !== 'undefined' ? z : { object: () => ({ default: () => ({}), optional: () => ({}) }), number: () => ({ default: () => ({}) }), boolean: () => ({ default: () => ({}) }) };
const mockGetVariables = () => ({});
const mockInsertOrAssignVariables = () => {};
const mockGetScriptId = () => 'convenient-edit-script';

const getVars = typeof getVariables !== 'undefined' ? getVariables : mockGetVariables;
const setVars = typeof insertOrAssignVariables !== 'undefined' ? insertOrAssignVariables : mockInsertOrAssignVariables;
const getScriptIdVal = typeof getScriptId !== 'undefined' ? getScriptId : mockGetScriptId;

// 定义设置校验 Schema (原代码使用了 Zod 或类似的库)
const positionSchema = _z.object({
    x: _z.number().default(0),
    y: _z.number().default(0)
});

const settingsSchema = _z.object({
    showButton: _z.boolean().default(true),
    buttonPosition: positionSchema.optional()
});

// 1. 设置 Store
const useSettingsStore = defineStore('convenient-edit-settings', () => {
    // 尝试从持久化存储获取配置，如果没有则使用默认值
    let initialSettings = {};
    try {
        const rawVars = getVars({ type: 'script', script_id: getScriptIdVal() });
        initialSettings = rawVars || {};
        // 简单模拟解析，实际可能需要深度合并默认值
        if (initialSettings.showButton === undefined) initialSettings.showButton = true;
    } catch (e) {
        initialSettings = { showButton: true };
    }

    const settings = Vue.ref(initialSettings);

    // 如果是第一次加载，没有 showButton 设置，则初始化并保存
    if (getVars({ type: 'script', script_id: getScriptIdVal() })?.showButton === undefined) {
        setVars({ showButton: settings.value.showButton }, { type: 'script', script_id: getScriptIdVal() });
    }

    // 监听设置变化并保存
    Vue.watch(() => settings.value.showButton, (newVal) => {
        setVars({ showButton: newVal }, { type: 'script', script_id: getScriptIdVal() });
    });

    return { settings };
});

// 2. 主题 Store (用于适配 SillyTavern 的各种主题颜色)
const useThemeStore = defineStore('convenient_edit_theme', () => {
    const themeColors = Vue.ref({
        barBg: 'rgba(30, 30, 40, 0.9)',
        controlBg: 'rgba(45, 55, 72, 0.8)',
        controlHoverBg: 'rgba(35, 45, 62, 0.8)',
        textColor: '#e2e8f0',
        borderColor: '#718096',
        quoteColor: '#9ca3af'
    });

    let observer = null;

    // 辅助函数：解析颜色并确保 alpha 值为 1 (不透明)
    const normalizeColor = (colorStr, fallback) => {
        if (!colorStr || colorStr === 'transparent') return 'rgba(0, 0, 0, 1)';
        try {
            if (colorStr.startsWith('rgba')) {
                const parts = colorStr.substring(colorStr.indexOf('(') + 1, colorStr.lastIndexOf(')')).split(',');
                if (parts.length >= 3) {
                    return `rgba(${parts[0].trim()}, ${parts[1].trim()}, ${parts[2].trim()}, 1)`;
                }
            }
        } catch (e) { }
        return colorStr;
    };

    // 辅助函数：计算悬停颜色 (稍微提亮或变暗)
    const calculateHoverColor = (baseColor, ratio) => {
        try {
            if (baseColor.startsWith('rgba')) {
                const parts = baseColor.substring(baseColor.indexOf('(') + 1, baseColor.lastIndexOf(')')).split(',');
                if (parts.length >= 3) {
                    let r = parseInt(parts[0].trim(), 10);
                    let g = parseInt(parts[1].trim(), 10);
                    let b = parseInt(parts[2].trim(), 10);
                    const a = parts.length > 3 ? parseFloat(parts[3].trim()) : 1;

                    // 原代码逻辑：变暗
                    r = Math.max(0, r - r * ratio);
                    g = Math.max(0, g - g * ratio);
                    b = Math.max(0, b - b * ratio);
                    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
                }
            }
        } catch (e) { }
        return baseColor;
    };

    // 核心更新主题逻辑
    const updateTheme = () => {
        try {
            const parentDoc = window.parent.document;
            let barBg = 'rgba(30, 30, 40, 0.9)';
            let controlBg = 'rgba(45, 55, 72, 0.8)';
            let hoverBg = 'rgba(35, 45, 62, 0.8)';
            let txtColor = '#e2e8f0';
            let borderCol = '#718096';
            let quoteCol = '#9ca3af';

            // 寻找聊天容器的背景色作为基础色
            const chatContainer = (() => {
                const jqDoc = $(window.parent.document);
                const selectors = ['.simplebar-content-wrapper', '#chat'];
                for (const sel of selectors) {
                    const el = jqDoc.find(sel);
                    if (el.length > 0) return el.first();
                }
                return null;
            })();

            let baseBgColor = '';
            if (chatContainer) {
                baseBgColor = window.parent.getComputedStyle(chatContainer[0]).backgroundColor;
                if (baseBgColor === 'rgba(0, 0, 0, 0)' || baseBgColor === 'transparent') {
                    baseBgColor = window.parent.getComputedStyle(parentDoc.body).backgroundColor;
                }
                const topBar = parentDoc.querySelector('#top-bar');
                if (topBar) {
                    const topBarBg = window.parent.getComputedStyle(topBar).backgroundColor;
                    barBg = normalizeColor((topBarBg !== 'rgba(0, 0, 0, 0)' && topBarBg !== 'transparent') ? topBarBg : baseBgColor);
                } else {
                    barBg = normalizeColor(baseBgColor);
                }
            }

            // 获取非用户消息的样式作为控件基础
            const botMessage = parentDoc.querySelector('.mes:not(.user-mes)');
            if (botMessage) {
                const msgBg = window.parent.getComputedStyle(botMessage).backgroundColor;
                controlBg = normalizeColor(msgBg);
                hoverBg = calculateHoverColor(controlBg, 0.15); // 生成悬停色
            }

            const mesText = parentDoc.querySelector('.mes_text');
            if (mesText) {
                txtColor = window.parent.getComputedStyle(mesText).color;
            }

            const blockquote = parentDoc.querySelector('.mes_text blockquote') || parentDoc.querySelector('blockquote');
            if (blockquote) {
                quoteCol = window.parent.getComputedStyle(blockquote).color;
            } else {
                const cssVarQuote = window.parent.getComputedStyle(parentDoc.documentElement).getPropertyValue('--SmartThemeQuoteColor').trim();
                if (cssVarQuote) quoteCol = cssVarQuote;
            }

            const textarea = parentDoc.querySelector('#send_textarea');
            if (textarea) {
                borderCol = window.parent.getComputedStyle(textarea).borderColor;
            }

            themeColors.value = {
                barBg: barBg,
                controlBg: controlBg,
                controlHoverBg: hoverBg,
                textColor: txtColor,
                borderColor: borderCol,
                quoteColor: quoteCol
            };
        } catch (e) {
            console.warn('[方便修改] 获取父窗口样式失败:', e);
        }
    };

    return {
        themeColors,
        initializeThemeObserver: () => {
            updateTheme();
            try {
                // 使用 lodash 的 debounce 防止频繁触发
                const debouncedUpdate = typeof _ !== 'undefined' ? _.debounce(updateTheme, 250) : updateTheme;
                observer = new MutationObserver(debouncedUpdate);
                
                // 监听各种可能导致主题变化的节点
                observer.observe(window.parent.document.head, { childList: true, subtree: true, attributes: true, characterData: true });
                observer.observe(window.parent.document.body, { attributes: true, attributeFilter: ['class', 'style'] });
                observer.observe(window.parent.document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
                
                const chatArea = window.parent.document.querySelector('#chat');
                if (chatArea) {
                    observer.observe(chatArea, { attributes: true, attributeFilter: ['style', 'class'], childList: true });
                }
            } catch (e) {
                console.error('[方便修改] 无法监听主题变化:', e);
            }
        },
        disconnectThemeObserver: () => {
            if (observer) observer.disconnect();
        },
        updateThemeColors: updateTheme
    };
});


// ==========================================
// 模块 3: 核心逻辑 - 悬浮按钮和交互功能
// ==========================================

const CONSTANTS = {
    BUTTON_SIZE: 38,
    Z_INDEX: 1020,
    DEFAULT_POSITION: { right: '20px', bottom: '120px' },
    ANIMATION_DURATION: 200,
    RE_ENTRY_GUARD_DELAY: 100,
    OBSERVER_TIMEOUT: 1000,
    EDITOR_APPEAR_TIMEOUT: 5000,
    SCROLL_INTO_VIEW_OFFSET: 120,
    EDITOR_SCROLL_ALIGNMENT_RATIO: 0.3,
    SELECTORS: {
        MESSAGE: '.mes',
        EDIT_BUTTONS: ['.mes_edit', '.fa-edit', '.fa-pencil'],
        DONE_BUTTON: '.mes_edit_done',
        EDITOR: 'textarea:visible, [contenteditable="true"]:visible',
        ST_EDITOR_TEXTAREA: '#curEditTextarea', // SillyTavern 特有的当前编辑框 ID
        SCROLL_CONTAINERS: ['.simplebar-content-wrapper', '#chat']
    },
    ATTRIBUTES: {
        SCRIPT_ID: 'script_id',
        TEMP_TARGET: 'data-convenient-edit-target'
    },
    CLASSES: {
        BUTTON: 'convenient-edit-floating-button'
    }
};

let $floatingButton = null;
let isDragging = false;
let isExecutingEdit = false;
let previousScrollTop = null;
let scrollContainerElement = null;
let measureDiv = null;
let intersectionObserver = null;
let mostVisibleMessage = null;

// 获取当前主题颜色（安全获取）
function getCurrentTheme() {
    try {
        return useThemeStore().themeColors;
    } catch (e) {
        // Fallback colors
        return {
            controlBg: 'rgba(45, 55, 72, 0.8)',
            barBg: 'rgba(30, 30, 40, 0.9)',
            controlHoverBg: 'rgba(35, 45, 62, 0.8)',
            borderColor: '#718096',
            textColor: '#e2e8f0',
            quoteColor: '#9ca3af'
        };
    }
}

// 1. 创建并显示悬浮按钮
function createFloatingButton() {
    if ($floatingButton) return;

    const themeStore = useThemeStore();
    themeStore.initializeThemeObserver();
    
    const theme = getCurrentTheme();
    const settings = getVars({ type: 'script', script_id: getScriptIdVal() }) || {};
    const pos = settings.buttonPosition;
    const hasCustomPosition = pos && (pos.x > 0 || pos.y > 0);
    const innerSize = CONSTANTS.BUTTON_SIZE - 4;

    // 创建按钮 jQuery 对象
    $floatingButton = $('<div>')
        .attr(CONSTANTS.ATTRIBUTES.SCRIPT_ID, getScriptIdVal())
        .addClass(CONSTANTS.CLASSES.BUTTON)
        .css({
            position: 'fixed',
            zIndex: CONSTANTS.Z_INDEX,
            width: `${CONSTANTS.BUTTON_SIZE}px`,
            height: `${CONSTANTS.BUTTON_SIZE}px`,
            cursor: 'pointer',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...(hasCustomPosition ? { left: `${pos.x}px`, top: `${pos.y}px` } : CONSTANTS.DEFAULT_POSITION)
        })
        .html(`
            <div class="ball-inner" style="
                position: relative;
                width: ${innerSize}px;
                height: ${innerSize}px;
                background: linear-gradient(145deg, ${theme.controlBg}, ${theme.barBg});
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid ${theme.borderColor};
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 2;
            ">
                <i class="fa-solid fa-pencil" style="
                    font-size: 14px;
                    color: ${theme.textColor};
                    transition: all 0.3s ease;
                    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
                "></i>
            </div>
            <div class="ball-ring" style="
                position: absolute;
                width: ${CONSTANTS.BUTTON_SIZE}px;
                height: ${CONSTANTS.BUTTON_SIZE}px;
                border-radius: 50%;
                border: 2px solid ${theme.borderColor};
                opacity: 0.4;
                transition: all 0.3s ease;
                z-index: 1;
            "></div>
            <div class="ball-pulse" style="
                position: absolute;
                width: ${innerSize}px;
                height: ${innerSize}px;
                border-radius: 50%;
                background: ${theme.quoteColor};
                opacity: 0;
                z-index: 0;
                pointer-events: none;
            "></div>
        `);

    // 绑定事件
    $floatingButton
        .on('mousedown', (e) => { e.stopPropagation(); isDragging = false; })
        .on('mouseup', () => { if (!isDragging) triggerEditAction(); })
        .on('mouseenter', function () {
            const $inner = $(this).find('.ball-inner');
            const $ring = $(this).find('.ball-ring');
            const $icon = $(this).find('.ball-inner i');
            const curTheme = getCurrentTheme();
            $inner.css({
                transform: 'scale(1.08)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35), 0 3px 6px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                background: `linear-gradient(145deg, ${curTheme.controlHoverBg}, ${curTheme.controlBg})`
            });
            $ring.css({ opacity: 0.7, transform: 'scale(1.1)', borderColor: curTheme.quoteColor });
            $icon.css({ transform: 'scale(1.1)', color: curTheme.quoteColor });
        })
        .on('mouseleave', function () {
            const $inner = $(this).find('.ball-inner');
            const $ring = $(this).find('.ball-ring');
            const $icon = $(this).find('.ball-inner i');
            const curTheme = getCurrentTheme();
            $inner.css({
                transform: 'scale(1)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                background: `linear-gradient(145deg, ${curTheme.controlBg}, ${curTheme.barBg})`
            });
            $ring.css({ opacity: 0.4, transform: 'scale(1)', borderColor: curTheme.borderColor });
            $icon.css({ transform: 'scale(1)', color: curTheme.textColor });
        });

    $(window.parent.document.body).append($floatingButton);

    // 监听主题变化更新按钮样式
    Vue.watch(() => themeStore.themeColors, () => {
        if (!$floatingButton) return;
        const curTheme = getCurrentTheme();
        $floatingButton.find('.ball-inner').css({ background: `linear-gradient(145deg, ${curTheme.controlBg}, ${curTheme.barBg})`, borderColor: curTheme.borderColor });
        $floatingButton.find('.ball-ring').css({ borderColor: curTheme.borderColor });
        $floatingButton.find('.ball-inner i').css({ color: curTheme.textColor });
        $floatingButton.find('.ball-pulse').css({ background: curTheme.quoteColor });
    }, { deep: true });

    // 使按钮可拖拽 (依赖 jQuery UI draggable)
    try {
        let btnWidth, btnHeight, winWidth, winHeight;
        $floatingButton.draggable({
            scroll: false,
            start: () => {
                isDragging = true;
                if ($floatingButton) {
                    btnWidth = $floatingButton.outerWidth() ?? 0;
                    btnHeight = $floatingButton.outerHeight() ?? 0;
                    winWidth = window.parent.innerWidth;
                    winHeight = window.parent.innerHeight;
                }
            },
            drag: (event, ui) => {
                // 限制在窗口范围内
                if (ui.position.left < 0) ui.position.left = 0;
                if (ui.position.top < 0) ui.position.top = 0;
                if (ui.position.left + btnWidth > winWidth) ui.position.left = winWidth - btnWidth;
                if (ui.position.top + btnHeight > winHeight) ui.position.top = winHeight - btnHeight;
            },
            stop: (event, ui) => {
                // 拖拽结束保存位置
                const newPos = { x: Math.round(ui.position.left), y: Math.round(ui.position.top) };
                setVars({ buttonPosition: newPos }, { type: 'script', script_id: getScriptIdVal() });
            }
        });
    } catch (e) {
        console.error('[Convenient Edit] Draggable feature failed to initialize.', e);
    }
}

// 2. 移除按钮
function removeFloatingButton() {
    if ($floatingButton) {
        try {
            if ($floatingButton.draggable) $floatingButton.draggable('destroy');
            useThemeStore().disconnectThemeObserver();
        } catch (e) { }
        $floatingButton.off('mouseenter mouseleave');
        $floatingButton.remove();
        $floatingButton = null;
    }
}

// ==========================================
// 模块 4: 文本定位和滚动核心算法
// ==========================================

// 获取聊天滚动容器
function getScrollContainer() {
    if (scrollContainerElement && scrollContainerElement.closest('body').length) return scrollContainerElement;
    const $parentDoc = $(window.parent.document);
    for (const sel of CONSTANTS.SELECTORS.SCROLL_CONTAINERS) {
        const $el = $parentDoc.find(sel);
        if ($el.length > 0) {
            scrollContainerElement = $el.first();
            return scrollContainerElement;
        }
    }
    // Fallback：寻找可以滚动的 div，且包含消息
    const $fallback = $parentDoc.find('div').filter((index, el) => {
        const overflowY = $(el).css('overflow-y');
        return (overflowY === 'auto' || overflowY === 'scroll') &&
               el.scrollHeight > el.clientHeight &&
               $(el).find(CONSTANTS.SELECTORS.MESSAGE).length > 0;
    }).first();
    
    if ($fallback.length > 0) {
        scrollContainerElement = $fallback;
        return scrollContainerElement;
    }
    return null;
}

// 在 DOM 树中根据字符偏移量寻找 Node 和 Offset
function findNodeAndOffset(rootNode, targetOffset) {
    let currentOffset = 0;
    const treeWalker = window.parent.document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null);
    let currentNode = treeWalker.nextNode();
    
    while (currentNode) {
        const nodeLength = currentNode.textContent?.length ?? 0;
        if (currentOffset + nodeLength >= targetOffset) {
            return [currentNode, Math.max(0, targetOffset - currentOffset)];
        }
        currentOffset += nodeLength;
        currentNode = treeWalker.nextNode();
    }
    return [null, 0];
}

// 高级功能：在编辑器(Textarea)中定位选中的文本并滚动到视野中央
function locateAndScrollInEditor(editorElement, selectedText) {
    const isTextarea = editorElement.tagName === 'TEXTAREA';
    const editorContent = isTextarea ? editorElement.value : (editorElement.textContent ?? '');
    const searchText = selectedText.trim();
    if (!searchText) return false;

    // 使用正则表达式模糊匹配，忽略 markdown 符号和多余空格
    const matchInfo = (function findMatch(content, search) {
        const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // 尝试精确去空格匹配
        const exactPattern = escapeRegExp(search).replace(/\s+/g, '\\s+');
        const match1 = content.match(new RegExp(exactPattern, 'i'));
        if (match1) return match1;
        
        // 尝试忽略 Markdown 符号匹配 (*_~`)
        const mdChars = '[*_~`]*';
        const searchChars = [...search];
        const fuzzyPattern = mdChars + searchChars.map(char => /\s/.test(char) ? mdChars + '\\s+' + mdChars : escapeRegExp(char) + mdChars).join('');
        const match2 = content.match(new RegExp(fuzzyPattern, 'i'));
        if (match2) return match2;
        
        // 最后尝试去除搜索词中的 markdown 符号
        const cleanSearch = search.replace(/[*_~`]/g, '');
        if (cleanSearch && cleanSearch !== search) {
            const cleanPattern = escapeRegExp(cleanSearch).replace(/\s+/g, '\\s+');
            const match3 = content.match(new RegExp(cleanPattern, 'i'));
            if (match3) return match3;
        }
        return null;
    })(editorContent, searchText);

    if (!matchInfo || matchInfo.index === undefined) return false;

    const startIndex = matchInfo.index;
    const matchLength = matchInfo[0].length;
    const endIndex = startIndex + matchLength;

    if (isTextarea) {
        // --- 针对 Textarea 的定位逻辑 ---
        const $textarea = editorElement;
        $textarea.focus();
        $textarea.setSelectionRange(startIndex, endIndex);

        // 使用隐藏的镜像 div 来计算光标所在行的高度
        try {
            const computedStyle = getComputedStyle($textarea);
            if (!measureDiv) {
                measureDiv = window.parent.document.createElement('div');
                measureDiv.style.cssText = `
                    position: absolute; visibility: hidden; pointer-events: none;
                    box-sizing: border-box; left: -9999px; top: -9999px;
                `;
                window.parent.document.body.appendChild(measureDiv);
            }
            const mDiv = measureDiv;
            mDiv.style.width = `${$textarea.clientWidth}px`;
            mDiv.style.padding = `${computedStyle.paddingTop} ${computedStyle.paddingRight} ${computedStyle.paddingBottom} ${computedStyle.paddingLeft}`;
            mDiv.style.font = computedStyle.font;
            mDiv.style.fontSize = computedStyle.fontSize;
            mDiv.style.fontFamily = computedStyle.fontFamily;
            mDiv.style.fontWeight = computedStyle.fontWeight;
            mDiv.style.lineHeight = computedStyle.lineHeight;
            mDiv.style.whiteSpace = computedStyle.whiteSpace || 'pre-wrap';
            mDiv.style.wordWrap = computedStyle.wordWrap || 'break-word';
            mDiv.style.wordBreak = computedStyle.wordBreak || 'break-word';
            mDiv.style.overflowWrap = computedStyle.overflowWrap || 'break-word';

            // 复制光标前的文本来测量高度
            const textBeforeCursor = $textarea.value.substring(0, $textarea.selectionStart);
            mDiv.textContent = textBeforeCursor;

            const cursorY = mDiv.offsetHeight;
            const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
            
            // 计算滚动位置，使光标位于视口偏上的位置
            let targetScrollTop = cursorY + lineHeight / 2 - $textarea.clientHeight * CONSTANTS.EDITOR_SCROLL_ALIGNMENT_RATIO;
            targetScrollTop = Math.max(0, targetScrollTop);
            const maxScrollTop = $textarea.scrollHeight - $textarea.clientHeight;
            targetScrollTop = Math.min(maxScrollTop, targetScrollTop);

            $($textarea).stop(true).animate({ scrollTop: targetScrollTop }, CONSTANTS.ANIMATION_DURATION);
        } catch (e) {
            console.error('[Convenient Edit] Error in scrollTextareaToMatch:', e);
        }
    } else {
        // --- 针对 ContentEditable 的定位逻辑 ---
        const range = window.parent.document.createRange();
        const [startNode, startOffset] = findNodeAndOffset(editorElement, startIndex);
        const [endNode, endOffset] = findNodeAndOffset(editorElement, endIndex);

        if (!startNode || !endNode) return false;

        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);

        const selection = window.parent.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
        editorElement.focus();

        // 滚动 ContentEditable 以显示选中区域
        try {
            const rangeRect = range.getBoundingClientRect();
            const editorRect = editorElement.getBoundingClientRect();
            const targetYRelativeToEditorTop = rangeRect.top + rangeRect.height / 2;
            const editorTop = editorRect.top;
            
            let targetScrollTop = targetYRelativeToEditorTop - editorTop - editorElement.clientHeight * CONSTANTS.EDITOR_SCROLL_ALIGNMENT_RATIO;
            targetScrollTop = Math.max(0, targetScrollTop);
            const maxScrollTop = editorElement.scrollHeight - editorElement.clientHeight;
            targetScrollTop = Math.min(maxScrollTop, targetScrollTop);

            $(editorElement).stop(true).animate({ scrollTop: targetScrollTop }, CONSTANTS.ANIMATION_DURATION);
        } catch (e) {
            console.error('[Convenient Edit] Error in scrollContentEditableToMatch:', e);
        }
    }
    return true;
}


// 3. 核心功能：触发编辑或保存
function triggerEditAction() {
    if (isExecutingEdit) return;
    isExecutingEdit = true;

    try {
        // 1. 获取目标元素和选中的文本
        const { target: $targetMessage, selectedText } = (() => {
            // 情况 A: 已经在编辑模式 (当前存在 ST 特有编辑框)
            const $curEditor = $(window.parent.document).find(CONSTANTS.SELECTORS.ST_EDITOR_TEXTAREA);
            if ($curEditor.length > 0) {
                return { target: $curEditor.closest(CONSTANTS.SELECTORS.MESSAGE), selectedText: '' };
            }

            // 情况 B: 用户有选中文本
            const selection = window.parent.getSelection();
            if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
                const commonAncestor = selection.getRangeAt(0).commonAncestorContainer;
                const node = commonAncestor.nodeType === Node.TEXT_NODE ? commonAncestor.parentElement : commonAncestor;
                if (node) {
                    const $closestMsg = $(node).closest(CONSTANTS.SELECTORS.MESSAGE);
                    if ($closestMsg.length > 0) {
                        return { target: $closestMsg, selectedText: selection.toString() };
                    }
                }
            }
            
            // 情况 C: 没有任何选中，尝试使用屏幕中间可见度最高的消息
            return { target: mostVisibleMessage ? $(mostVisibleMessage) : null, selectedText: '' };
        })();

        if (!$targetMessage || $targetMessage.length === 0) return;

        // 2. 判断当前状态：是“正在编辑”还是“未编辑”
        const isCurrentlyEditing = $targetMessage.find(CONSTANTS.SELECTORS.EDITOR).length > 0;

        if (isCurrentlyEditing) {
            // [操作：保存退出编辑]
            saveEditAndExit($targetMessage);
        } else {
            // [操作：进入编辑模式]
            const $scrollContainer = getScrollContainer();
            if ($scrollContainer) {
                previousScrollTop = $scrollContainer[0].scrollTop; // 记录进入编辑前的位置
            }

            $targetMessage.attr(CONSTANTS.ATTRIBUTES.TEMP_TARGET, 'true'); // 打上标记以便查找

            // 尝试点击消息上的编辑按钮进入编辑模式
            const clicked = (function clickEditBtn($msg, selectors) {
                for (const sel of selectors) {
                    const $btn = $msg.find(sel).filter(':visible').first();
                    if ($btn.length > 0) {
                        $btn.trigger('click');
                        return true;
                    }
                }
                return false;
            })($targetMessage, CONSTANTS.SELECTORS.EDIT_BUTTONS);

            if (!clicked) {
                $targetMessage.removeAttr(CONSTANTS.ATTRIBUTES.TEMP_TARGET);
                previousScrollTop = null;
            } else {
                // 编辑器打开是一个异步过程，需要等待并处理定位
                waitForEditorAndLocate($targetMessage, selectedText);
            }
        }
    } finally {
        setTimeout(() => { isExecutingEdit = false; }, CONSTANTS.RE_ENTRY_GUARD_DELAY);
    }
}

// 辅助：保存编辑
function saveEditAndExit($msgElement) {
    const $doneBtn = $msgElement.find(CONSTANTS.SELECTORS.DONE_BUTTON);
    if ($doneBtn.length) {
        setTimeout(() => {
            $doneBtn.trigger('click');
            if (previousScrollTop === null) return;
            
            const pScrollTop = previousScrollTop;
            previousScrollTop = null;
            const $scrollContainer = getScrollContainer();
            if (!$scrollContainer) return;

            // 监听 DOM 变化直到编辑器消失，然后恢复滚动位置
            let timeoutId;
            const observer = new MutationObserver((mutations, obs) => {
                const isStillEditing = $msgElement.find(CONSTANTS.SELECTORS.EDITOR).length > 0;
                if (!isStillEditing) {
                    $scrollContainer.stop(true).animate({ scrollTop: pScrollTop }, CONSTANTS.ANIMATION_DURATION);
                    obs.disconnect();
                    clearTimeout(timeoutId);
                }
            });

            timeoutId = setTimeout(() => {
                observer.disconnect();
                const isStillEditing = $msgElement.find(CONSTANTS.SELECTORS.EDITOR).length > 0;
                if (!isStillEditing) {
                    $scrollContainer.stop(true).animate({ scrollTop: pScrollTop }, CONSTANTS.ANIMATION_DURATION);
                }
            }, CONSTANTS.OBSERVER_TIMEOUT);

            observer.observe($msgElement[0], { childList: true, subtree: true });
        }, 10);
    } else {
        previousScrollTop = null;
    }
}

// 辅助：等待编辑器出现并进行文本定位
function waitForEditorAndLocate($msgElement, textToLocate) {
    const selector = `[${CONSTANTS.ATTRIBUTES.TEMP_TARGET}="true"]`;
    const $parentDoc = $(window.parent.document);

    // 提取查找编辑器的逻辑
    const findEditorElement = () => {
        const $targetMsg = $parentDoc.find(selector);
        if (!$targetMsg.length) return null;
        
        const $stEditor = $parentDoc.find(CONSTANTS.SELECTORS.ST_EDITOR_TEXTAREA);
        if ($stEditor.length > 0 && $stEditor.is(':visible')) return $stEditor[0];
        
        const $mesText = $targetMsg.find('.mes_text');
        if ($mesText.length > 0) {
            const $editor = $mesText.find('textarea:visible, [contenteditable="true"]:visible').first();
            if ($editor.length > 0) return $editor[0];
        }
        
        const $genericEditor = $targetMsg.find(CONSTANTS.SELECTORS.EDITOR).first();
        return $genericEditor.length > 0 ? $genericEditor[0] : null;
    };

    const cleanup = (obs, timerId) => {
        obs?.disconnect();
        clearTimeout(timerId);
        $parentDoc.find(selector).removeAttr(CONSTANTS.ATTRIBUTES.TEMP_TARGET);
    };

    // 执行定位逻辑
    const executeLocation = (editorEl) => {
        // 先稍微滚动外部容器，防止被遮挡
        const $container = getScrollContainer();
        if (editorEl && $container) {
            const containerNode = $container[0];
            const $editorJQ = $(editorEl);
            const editorTop = $editorJQ.offset()?.top || 0;
            const containerTop = $container.offset()?.top || 0;
            const offsetDiff = editorTop - containerTop;
            const newScrollTop = containerNode.scrollTop + offsetDiff - CONSTANTS.SCROLL_INTO_VIEW_OFFSET;
            $container.stop(true).scrollTop(newScrollTop);
        }

        // 使用 requestAnimationFrame 等待渲染完成再尝试选中文本
        requestAnimationFrame(() => {
            const text = textToLocate.trim();
            let located = false;
            if (text.length > 0) {
                located = locateAndScrollInEditor(editorEl, text);
            }
            if (!located) {
                // 如果没有定位到特定文本，只需聚焦并回到顶部
                editorEl.focus();
                editorEl.scrollTop = 0;
            }
        });
    };

    let timerId;
    // 使用 MutationObserver 监听编辑器节点的出现
    const observer = new MutationObserver((mutations) => {
        for (const mut of mutations) {
            if (mut.type === 'childList' && mut.addedNodes.length > 0) {
                const editor = findEditorElement();
                if (editor) {
                    cleanup(observer, timerId);
                    executeLocation(editor);
                    return;
                }
            }
        }
    });

    // 设置超时防卡死
    timerId = setTimeout(() => {
        const editor = findEditorElement();
        if (editor) executeLocation(editor);
        cleanup(observer, timerId);
    }, CONSTANTS.EDITOR_APPEAR_TIMEOUT);

    observer.observe($msgElement[0], { childList: true, subtree: true });

    // 如果立刻能找到，直接执行（防抖或极快渲染的情况）
    const immediateEditor = findEditorElement();
    if (immediateEditor) {
        cleanup(observer, timerId);
        executeLocation(immediateEditor);
    }
}


// 4. 事件处理器：全局按键 (F8)
function handleGlobalKeydown(e) {
    if (e.key === 'F8') {
        e.preventDefault();
        setTimeout(triggerEditAction, 0);
    }
}

// 5. 事件处理器：点击外部区域自动保存
function handleGlobalMousedown(e) {
    const $stEditor = $(window.parent.document).find(CONSTANTS.SELECTORS.ST_EDITOR_TEXTAREA);
    if (!$stEditor.length) return; // 当前没有 ST 专用编辑器，退出

    const targetNode = e.target;
    const $target = $(targetNode);
    const $editingMessage = $stEditor.closest(CONSTANTS.SELECTORS.MESSAGE);

    // 如果点击的是“完成”按钮，或者点击在当前正在编辑的消息框内，或者点击在我们的悬浮按钮上，则不处理
    if ($target.hasClass(CONSTANTS.SELECTORS.DONE_BUTTON.substring(1)) ||
        ($editingMessage.length > 0 && $editingMessage[0].contains(targetNode)) ||
        ($floatingButton && $floatingButton[0].contains(targetNode))) {
        return;
    }

    // 否则，认为是点击了外部空白处，触发保存
    saveEditAndExit($editingMessage);
}


// ==========================================
// 模块 5: 可见性追踪器 (Intersection Observer)
// ==========================================
// 用于在没有选中文本时，判断当前屏幕主要显示的是哪条消息

function initVisibilityTracker() {
    const $container = getScrollContainer();
    if (!$container) {
        setTimeout(initVisibilityTracker, 500); // 没找到则稍后重试
        return;
    }

    const visibilityMap = new Map();

    intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                visibilityMap.set(entry.target, entry.intersectionRatio);
            } else {
                visibilityMap.delete(entry.target);
            }
        });

        // 找出可见度最高的消息
        let maxRatio = 0;
        mostVisibleMessage = null;
        for (const [node, ratio] of visibilityMap.entries()) {
            if (ratio > maxRatio) {
                maxRatio = ratio;
                mostVisibleMessage = node;
            }
        }
    }, {
        root: $container[0],
        rootMargin: '0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
    });

    const refreshObserver = () => {
        const $messages = $(window.parent.document).find(CONSTANTS.SELECTORS.MESSAGE);
        if (intersectionObserver) intersectionObserver.disconnect();
        $messages.each((_, el) => intersectionObserver?.observe(el));
    };

    refreshObserver();

    // 监听 SillyTavern 特定事件来刷新观察者
    if (typeof eventOn !== 'undefined' && typeof tavern_events !== 'undefined') {
        eventOn(tavern_events.CHAT_CHANGED, () => setTimeout(refreshObserver, 200));
        eventOn(tavern_events.MESSAGE_RECEIVED, () => setTimeout(refreshObserver, 200));
        eventOn(tavern_events.MESSAGE_DELETED, () => setTimeout(refreshObserver, 200));
    }
}


// ==========================================
// 模块 6: Vue 组件定义 (设置面板)
// ==========================================
const SettingsComponent = Vue.defineComponent({
    __name: 'ConvenientEditSettings',
    setup(props) {
        const settingsStore = useSettingsStore();
        const { settings } = storeToRefs(settingsStore);

        return () => {
            return Vue.h('div', { class: 'convenient-edit-extension-settings', 'data-v-6537be84': '' }, [
                Vue.h('div', { class: 'inline-drawer' }, [
                    Vue.h('div', { class: 'inline-drawer-toggle inline-drawer-header' }, [
                        Vue.h('b', null, '✏️更好的小铅笔'),
                        Vue.h('div', { class: 'inline-drawer-icon fa-solid fa-circle-chevron-down down' })
                    ]),
                    Vue.h('div', { class: 'inline-drawer-content' }, [
                        Vue.h('div', { class: 'convenient-edit-extension_block flex-container', 'data-v-6537be84': '' }, [
                            Vue.withDirectives(
                                Vue.h('input', {
                                    type: 'checkbox',
                                    id: 'show-button-checkbox',
                                    'onUpdate:modelValue': (val) => settings.value.showButton = val
                                }),
                                [[Vue.vModelCheckbox, settings.value.showButton]]
                            ),
                            Vue.h('label', { for: 'show-button-checkbox' }, '显示悬浮编辑按钮')
                        ]),
                        Vue.h('hr', { class: 'sysHR' }),
                        Vue.h('div', { class: 'hint', 'data-v-6537be84': '' }, [
                            Vue.h('span', null, '提示：选取文本按下按钮或 F8 快捷键可定位修改，再次点击按钮或空白处可保存')
                        ])
                    ])
                ])
            ]);
        };
    }
});


// ==========================================
// 模块 7: 初始化与挂载入口
// ==========================================

jQuery(() => {
    // 1. 初始化功能和事件
    const store = useSettingsStore();
    if (store.settings.showButton) {
        createFloatingButton();
    }

    const $parentDoc = $(window.parent.document);
    $parentDoc.on('mousedown', handleGlobalMousedown);
    $parentDoc.on('keydown', handleGlobalKeydown);
    
    initVisibilityTracker();

    // 监听设置变化开关按钮
    Vue.watch(store.settings, (newVal, oldVal) => {
        if (newVal.showButton !== oldVal.showButton) {
            if (newVal.showButton) createFloatingButton();
            else removeFloatingButton();
        }
    }, { deep: true });

    // 页面卸载时的清理
    $(window).on('pagehide', () => {
        if (measureDiv && measureDiv.parentNode) {
            measureDiv.parentNode.removeChild(measureDiv);
        }
        measureDiv = null;
        if (intersectionObserver) {
            intersectionObserver.disconnect();
            intersectionObserver = null;
        }
        removeFloatingButton();
        $parentDoc.off('mousedown', handleGlobalMousedown);
        $parentDoc.off('keydown', handleGlobalKeydown);
    });

    // 2. 挂载 Vue 设置组件到 SillyTavern 扩展设置菜单
    const pinia = createPinia();
    const app = Vue.createApp(SettingsComponent).use(pinia);
    
    const mountPoint = $('<div>').attr('script_id', getScriptIdVal());
    $('#extensions_settings2').append(mountPoint);
    
    app.mount(mountPoint[0]);

    // 组件卸载时的清理
    $(window).on('pagehide', () => {
        app.unmount();
        $(`head > div[script_id="${getScriptIdVal()}"]`).remove();
        $(`div[script_id="${getScriptIdVal()}"]`).remove();
    });
});