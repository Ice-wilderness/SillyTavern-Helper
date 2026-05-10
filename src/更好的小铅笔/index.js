/*
 * 更好的小铅笔 / Convenient Edit
 * Restored single-file version from the webpack bundle.
 * Runtime assumptions: SillyTavern extension context, global jQuery `$`, and host helpers
 * `getScriptId`, `getVariables`, `insertOrAssignVariables`, `eventOn`, `tavern_events`.
 */
(() => {
  'use strict';

  const CONFIG = {
    BUTTON_SIZE: 38,
    Z_INDEX: 1020,
    DEFAULT_POSITION: { right: '20px', bottom: '120px' },
    ANIMATION_DURATION: 200,
    RE_ENTRY_GUARD_DELAY: 100,
    OBSERVER_TIMEOUT: 1000,
    EDITOR_APPEAR_TIMEOUT: 5000,
    SCROLL_INTO_VIEW_OFFSET: 120,
    EDITOR_SCROLL_ALIGNMENT_RATIO: 0.3,
    LCS_MIN_SIMILARITY: 0.6,
    LCS_MIN_NEEDLE_LENGTH: 10,
    LCS_MAX_NEEDLE: 200,
    LCS_MAX_HAYSTACK: 20000,
    SELECTORS: {
      MESSAGE: '.mes',
      EDIT_BUTTONS: ['.mes_edit', '.fa-edit', '.fa-pencil'],
      DONE_BUTTON: '.mes_edit_done',
      EDITOR: 'textarea:visible, [contenteditable="true"]:visible',
      ST_EDITOR_TEXTAREA: '#curEditTextarea',
      SCROLL_CONTAINERS: ['.simplebar-content-wrapper', '#chat'],
    },
    ATTRIBUTES: {
      SCRIPT_ID: 'script_id',
      TEMP_TARGET: 'data-convenient-edit-target',
    },
    CLASSES: {
      BUTTON: 'convenient-edit-floating-button',
      SETTINGS: 'convenient-edit-extension-settings',
    },
  };

  const DEFAULT_THEME = {
    barBg: 'rgba(30, 30, 40, 0.9)',
    controlBg: 'rgba(45, 55, 72, 0.8)',
    controlHoverBg: 'rgba(35, 45, 62, 0.8)',
    textColor: '#e2e8f0',
    borderColor: '#718096',
    quoteColor: '#9ca3af',
  };

  const SCRIPT_ID = safeCall(() => getScriptId(), 'convenient-edit');
  const SCRIPT_VARIABLES_OPTIONS = { type: 'script', script_id: SCRIPT_ID };

  let settings = normalizeSettings(readScriptVariables());
  let themeColors = { ...DEFAULT_THEME };

  let floatingButton = null;
  let settingsRoot = null;
  let settingsStyle = null;
  let settingsRenderRetryTimer = null;
  let settingsHostObserver = null;
  let isHandlingEdit = false;
  let savedScrollTop = null;
  let scrollContainer = null;
  let measurementDiv = null;
  let intersectionObserver = null;
  let currentVisibleMessage = null;
  let themeObserver = null;

  function safeCall(fn, fallback = undefined) {
    try {
      return fn();
    } catch (_) {
      return fallback;
    }
  }

  function getParentDocument() {
    return safeCall(() => window.parent.document, document) || document;
  }

  function getJQuery() {
    return window.$ || window.parent?.$;
  }

  function getToastr() {
    return window.parent?.toastr || window.toastr;
  }

  function readScriptVariables() {
    return safeCall(() => getVariables(SCRIPT_VARIABLES_OPTIONS), {}) || {};
  }

  function writeScriptVariables(patch) {
    safeCall(() => insertOrAssignVariables(patch, SCRIPT_VARIABLES_OPTIONS));
  }

  function normalizeSettings(raw) {
    const normalized = {
      showButton: typeof raw?.showButton === 'boolean' ? raw.showButton : true,
      buttonPosition: undefined,
    };

    if (
      raw?.buttonPosition &&
      Number.isFinite(Number(raw.buttonPosition.x)) &&
      Number.isFinite(Number(raw.buttonPosition.y))
    ) {
      normalized.buttonPosition = {
        x: Number(raw.buttonPosition.x),
        y: Number(raw.buttonPosition.y),
      };
    }

    return normalized;
  }

  function persistDefaultSettingsIfNeeded() {
    const raw = readScriptVariables();
    if (raw.showButton === undefined) {
      writeScriptVariables({ showButton: settings.showButton });
    }
  }

  function setShowButton(value) {
    const nextValue = Boolean(value);
    if (settings.showButton === nextValue) return;

    settings.showButton = nextValue;
    writeScriptVariables({ showButton: nextValue });

    if (nextValue) {
      createFloatingButton();
    } else {
      destroyFloatingButton();
    }
  }

  function setButtonPosition(position) {
    settings.buttonPosition = {
      x: Math.round(position.x),
      y: Math.round(position.y),
    };
    writeScriptVariables({ buttonPosition: { ...settings.buttonPosition } });
  }

  function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function toOpaqueColor(color) {
    if (!color || color === 'transparent') return 'rgba(0, 0, 0, 1)';

    try {
      if (color.startsWith('rgba')) {
        const parts = color.slice(color.indexOf('(') + 1, color.lastIndexOf(')')).split(',');
        if (parts.length >= 3) {
          return `rgba(${parts[0].trim()}, ${parts[1].trim()}, ${parts[2].trim()}, 1)`;
        }
      }
    } catch (_) {
      // Keep the original value if parsing fails.
    }

    return color;
  }

  function darkenRgba(color, ratio) {
    try {
      if (color.startsWith('rgba')) {
        const parts = color.slice(color.indexOf('(') + 1, color.lastIndexOf(')')).split(',');
        if (parts.length >= 3) {
          const r = Math.max(0, parseInt(parts[0].trim(), 10) * (1 - ratio));
          const g = Math.max(0, parseInt(parts[1].trim(), 10) * (1 - ratio));
          const b = Math.max(0, parseInt(parts[2].trim(), 10) * (1 - ratio));
          const a = parts.length > 3 ? parseFloat(parts[3].trim()) : 1;
          return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
        }
      }
    } catch (_) {
      // Keep the original value if parsing fails.
    }

    return color;
  }

  function updateThemeColors() {
    const parentDocument = getParentDocument();

    try {
      let barBg = DEFAULT_THEME.barBg;
      let controlBg = DEFAULT_THEME.controlBg;
      let controlHoverBg = DEFAULT_THEME.controlHoverBg;
      let textColor = DEFAULT_THEME.textColor;
      let borderColor = DEFAULT_THEME.borderColor;
      let quoteColor = DEFAULT_THEME.quoteColor;

      const scrollElement = findFirstElement(parentDocument, CONFIG.SELECTORS.SCROLL_CONTAINERS);
      if (scrollElement) {
        let background = window.parent.getComputedStyle(scrollElement).backgroundColor;
        if (background === 'rgba(0, 0, 0, 0)' || background === 'transparent') {
          background = window.parent.getComputedStyle(parentDocument.body).backgroundColor;
        }

        const topBar = parentDocument.querySelector('#top-bar');
        if (topBar) {
          const topBarBackground = window.parent.getComputedStyle(topBar).backgroundColor;
          barBg = toOpaqueColor(
            topBarBackground !== 'rgba(0, 0, 0, 0)' && topBarBackground !== 'transparent'
              ? topBarBackground
              : background,
          );
        } else {
          barBg = toOpaqueColor(background);
        }
      }

      const assistantMessage = parentDocument.querySelector('.mes:not(.user-mes)');
      if (assistantMessage) {
        const background = window.parent.getComputedStyle(assistantMessage).backgroundColor;
        controlBg = toOpaqueColor(background);
        controlHoverBg = darkenRgba(controlBg, 0.15);
      }

      const messageText = parentDocument.querySelector('.mes_text');
      if (messageText) {
        textColor = window.parent.getComputedStyle(messageText).color;
      }

      const messageBlockquote = parentDocument.querySelector('.mes_text blockquote');
      if (messageBlockquote) {
        quoteColor = window.parent.getComputedStyle(messageBlockquote).color;
      } else {
        const blockquote = parentDocument.querySelector('blockquote');
        if (blockquote) {
          quoteColor = window.parent.getComputedStyle(blockquote).color;
        } else {
          const smartThemeQuoteColor = window.parent
            .getComputedStyle(parentDocument.documentElement)
            .getPropertyValue('--SmartThemeQuoteColor')
            .trim();
          if (smartThemeQuoteColor) quoteColor = smartThemeQuoteColor;
        }
      }

      const sendTextarea = parentDocument.querySelector('#send_textarea');
      if (sendTextarea) {
        borderColor = window.parent.getComputedStyle(sendTextarea).borderColor;
      }

      themeColors = { barBg, controlBg, controlHoverBg, textColor, borderColor, quoteColor };
      updateFloatingButtonTheme();
    } catch (error) {
      console.warn('[方便修改] 获取父窗口样式失败:', error);
    }
  }

  function initializeThemeObserver() {
    updateThemeColors();

    try {
      const parentDocument = getParentDocument();
      const debouncedUpdate = debounce(updateThemeColors, 250);

      themeObserver = new MutationObserver(debouncedUpdate);
      themeObserver.observe(parentDocument.head, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
      themeObserver.observe(parentDocument.body, {
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
      themeObserver.observe(parentDocument.documentElement, {
        attributes: true,
        attributeFilter: ['style', 'class'],
      });

      const chat = parentDocument.querySelector('#chat');
      if (chat) {
        themeObserver.observe(chat, {
          attributes: true,
          attributeFilter: ['style', 'class'],
          childList: true,
        });
      }
    } catch (error) {
      console.error('[方便修改] 无法监听主题变化:', error);
    }
  }

  function disconnectThemeObserver() {
    themeObserver?.disconnect();
    themeObserver = null;
  }

  function findFirstElement(root, selectors) {
    for (const selector of selectors) {
      const element = root.querySelector(selector);
      if (element) return element;
    }
    return null;
  }

  function createFloatingButton() {
    if (floatingButton) return;

    const parentDocument = getParentDocument();
    initializeThemeObserver();

    const savedPosition = settings.buttonPosition || readScriptVariables().buttonPosition;
    const hasSavedPosition = savedPosition && (Number(savedPosition.x) > 0 || Number(savedPosition.y) > 0);
    const innerSize = CONFIG.BUTTON_SIZE - 4;

    floatingButton = parentDocument.createElement('div');
    floatingButton.setAttribute(CONFIG.ATTRIBUTES.SCRIPT_ID, SCRIPT_ID);
    floatingButton.className = CONFIG.CLASSES.BUTTON;

    Object.assign(floatingButton.style, {
      position: 'fixed',
      zIndex: String(CONFIG.Z_INDEX),
      width: `${CONFIG.BUTTON_SIZE}px`,
      height: `${CONFIG.BUTTON_SIZE}px`,
      cursor: 'pointer',
      userSelect: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...(hasSavedPosition
        ? { left: `${Number(savedPosition.x)}px`, top: `${Number(savedPosition.y)}px` }
        : CONFIG.DEFAULT_POSITION),
    });

    floatingButton.innerHTML = `
      <div class="ball-inner" style="
        position: relative;
        width: ${innerSize}px;
        height: ${innerSize}px;
        background: linear-gradient(145deg, ${themeColors.controlBg}, ${themeColors.barBg});
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid ${themeColors.borderColor};
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 2;
      ">
        <i class="fa-solid fa-pencil" style="
          font-size: 14px;
          color: ${themeColors.textColor};
          transition: all 0.3s ease;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        "></i>
      </div>
      <div class="ball-ring" style="
        position: absolute;
        width: ${CONFIG.BUTTON_SIZE}px;
        height: ${CONFIG.BUTTON_SIZE}px;
        border-radius: 50%;
        border: 2px solid ${themeColors.borderColor};
        opacity: 0.4;
        transition: all 0.3s ease;
        z-index: 1;
      "></div>
      <div class="ball-pulse" style="
        position: absolute;
        width: ${innerSize}px;
        height: ${innerSize}px;
        border-radius: 50%;
        background: ${themeColors.quoteColor};
        opacity: 0;
        z-index: 0;
        pointer-events: none;
      "></div>
    `;

    floatingButton.addEventListener('mouseenter', applyFloatingButtonHoverStyle);
    floatingButton.addEventListener('mouseleave', applyFloatingButtonNormalStyle);
    installFloatingButtonDragHandlers(floatingButton);

    parentDocument.body.appendChild(floatingButton);
  }

  function installFloatingButtonDragHandlers(button) {
    const parentDocument = getParentDocument();
    const parentWindow = window.parent || window;
    let dragState = null;

    button.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      const rect = button.getBoundingClientRect();
      dragState = {
        moved: false,
        startX: event.clientX,
        startY: event.clientY,
        startLeft: rect.left,
        startTop: rect.top,
        width: rect.width,
        height: rect.height,
      };

      parentDocument.addEventListener('mousemove', onMouseMove);
      parentDocument.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(event) {
      if (!dragState) return;

      const dx = event.clientX - dragState.startX;
      const dy = event.clientY - dragState.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.moved = true;

      const left = clamp(dragState.startLeft + dx, 0, parentWindow.innerWidth - dragState.width);
      const top = clamp(dragState.startTop + dy, 0, parentWindow.innerHeight - dragState.height);

      button.style.left = `${left}px`;
      button.style.top = `${top}px`;
      button.style.right = 'auto';
      button.style.bottom = 'auto';
    }

    function onMouseUp() {
      if (!dragState) return;

      parentDocument.removeEventListener('mousemove', onMouseMove);
      parentDocument.removeEventListener('mouseup', onMouseUp);

      const wasDragged = dragState.moved;
      const rect = button.getBoundingClientRect();
      dragState = null;

      if (wasDragged) {
        setButtonPosition({ x: rect.left, y: rect.top });
      } else {
        handleEditAction();
      }
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function applyFloatingButtonHoverStyle() {
    if (!floatingButton) return;

    const inner = floatingButton.querySelector('.ball-inner');
    const ring = floatingButton.querySelector('.ball-ring');
    const icon = floatingButton.querySelector('.ball-inner i');

    Object.assign(inner.style, {
      transform: 'scale(1.08)',
      boxShadow:
        '0 6px 20px rgba(0, 0, 0, 0.35), 0 3px 6px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
      background: `linear-gradient(145deg, ${themeColors.controlHoverBg}, ${themeColors.controlBg})`,
    });
    Object.assign(ring.style, {
      opacity: '0.7',
      transform: 'scale(1.1)',
      borderColor: themeColors.quoteColor,
    });
    Object.assign(icon.style, {
      transform: 'scale(1.1)',
      color: themeColors.quoteColor,
    });
  }

  function applyFloatingButtonNormalStyle() {
    if (!floatingButton) return;

    const inner = floatingButton.querySelector('.ball-inner');
    const ring = floatingButton.querySelector('.ball-ring');
    const icon = floatingButton.querySelector('.ball-inner i');

    Object.assign(inner.style, {
      transform: 'scale(1)',
      boxShadow:
        '0 4px 15px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      background: `linear-gradient(145deg, ${themeColors.controlBg}, ${themeColors.barBg})`,
    });
    Object.assign(ring.style, {
      opacity: '0.4',
      transform: 'scale(1)',
      borderColor: themeColors.borderColor,
    });
    Object.assign(icon.style, {
      transform: 'scale(1)',
      color: themeColors.textColor,
    });
  }

  function updateFloatingButtonTheme() {
    if (!floatingButton) return;

    const inner = floatingButton.querySelector('.ball-inner');
    const ring = floatingButton.querySelector('.ball-ring');
    const icon = floatingButton.querySelector('.ball-inner i');
    const pulse = floatingButton.querySelector('.ball-pulse');

    if (inner) {
      inner.style.background = `linear-gradient(145deg, ${themeColors.controlBg}, ${themeColors.barBg})`;
      inner.style.borderColor = themeColors.borderColor;
    }
    if (ring) ring.style.borderColor = themeColors.borderColor;
    if (icon) icon.style.color = themeColors.textColor;
    if (pulse) pulse.style.background = themeColors.quoteColor;
  }

  function destroyFloatingButton() {
    if (!floatingButton) return;

    try {
      floatingButton.removeEventListener('mouseenter', applyFloatingButtonHoverStyle);
      floatingButton.removeEventListener('mouseleave', applyFloatingButtonNormalStyle);
      floatingButton.remove();
    } catch (_) {
      // Ignore cleanup errors.
    }

    floatingButton = null;
    disconnectThemeObserver();
  }

  function handleEditAction() {
    if (isHandlingEdit) return;

    isHandlingEdit = true;

    try {
      const { target, selectedText } = getTargetMessageAndSelection();
      if (!target || !target.length) return;

      if (isMessageEditing(target)) {
        saveCurrentEdit(target);
        return;
      }

      const scroll = getScrollContainer();
      if (scroll) savedScrollTop = scroll[0].scrollTop;

      target.attr(CONFIG.ATTRIBUTES.TEMP_TARGET, 'true');

      if (!clickEditButton(target)) {
        target.removeAttr(CONFIG.ATTRIBUTES.TEMP_TARGET);
        savedScrollTop = null;
        return;
      }

      waitForEditor(`[${CONFIG.ATTRIBUTES.TEMP_TARGET}="true"]`, selectedText);
    } finally {
      setTimeout(() => {
        isHandlingEdit = false;
      }, CONFIG.RE_ENTRY_GUARD_DELAY);
    }
  }

  function getTargetMessageAndSelection() {
    const $ = getJQuery();
    const parentDocument = getParentDocument();

    const currentEditor = $(parentDocument).find(CONFIG.SELECTORS.ST_EDITOR_TEXTAREA);
    if (currentEditor.length > 0) {
      return {
        target: currentEditor.closest(CONFIG.SELECTORS.MESSAGE),
        selectedText: '',
      };
    }

    const selection = window.parent.getSelection?.();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      const commonAncestor = selection.getRangeAt(0).commonAncestorContainer;
      const element = commonAncestor.nodeType === Node.TEXT_NODE ? commonAncestor.parentElement : commonAncestor;

      if (element) {
        const message = $(element).closest(CONFIG.SELECTORS.MESSAGE);
        if (message.length > 0) {
          return {
            target: message,
            selectedText: selection.toString(),
          };
        }
      }
    }

    return {
      target: currentVisibleMessage ? $(currentVisibleMessage) : null,
      selectedText: '',
    };
  }

  function clickEditButton(message) {
    for (const selector of CONFIG.SELECTORS.EDIT_BUTTONS) {
      const button = message.find(selector).filter(':visible').first();
      if (button.length > 0) {
        button.trigger('click');
        return true;
      }
    }

    return false;
  }

  function waitForEditor(targetSelector, selectedText) {
    const $ = getJQuery();
    const parentDocument = getParentDocument();
    const target = $(parentDocument).find(targetSelector);

    if (!target.length) return;

    let timeout = null;
    let observer = null;

    const cleanup = () => {
      observer?.disconnect();
      clearTimeout(timeout);
      target.removeAttr(CONFIG.ATTRIBUTES.TEMP_TARGET);
    };

    const findEditor = () => {
      const currentEditor = $(parentDocument).find(CONFIG.SELECTORS.ST_EDITOR_TEXTAREA);
      if (currentEditor.length > 0 && currentEditor.is(':visible')) return currentEditor[0];

      const messageText = target.find('.mes_text');
      if (messageText.length > 0) {
        const nestedEditor = messageText.find('textarea:visible, [contenteditable="true"]:visible').first();
        if (nestedEditor.length > 0) return nestedEditor[0];
      }

      const editor = target.find(CONFIG.SELECTORS.EDITOR).first();
      return editor.length > 0 ? editor[0] : null;
    };

    const handleEditor = (editor) => {
      scrollEditorIntoView(editor);

      requestAnimationFrame(() => {
        const text = selectedText.trim();
        if (text.length > 0) {
          const matched = selectMatchingText(editor, text);
          if (!matched) {
            editor.focus();
            editor.scrollTop = 0;
            safeCall(() => getToastr()?.warning('无法定位到选中文本，光标已置于开头'));
          }
        } else {
          editor.focus();
          editor.scrollTop = 0;
        }
      });
    };

    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const editor = findEditor();
          if (editor) {
            cleanup();
            handleEditor(editor);
            return;
          }
        }
      }
    });

    timeout = setTimeout(() => {
      const editor = findEditor();
      if (editor) handleEditor(editor);
      cleanup();
    }, CONFIG.EDITOR_APPEAR_TIMEOUT);

    observer.observe(target[0], { childList: true, subtree: true });

    const editor = findEditor();
    if (editor) {
      cleanup();
      handleEditor(editor);
    }
  }

  function scrollEditorIntoView(editor) {
    const $ = getJQuery();
    const scroll = getScrollContainer();
    if (!editor || !scroll) return;

    const scrollElement = scroll[0];
    const editorTop = $(editor).offset()?.top || 0;
    const scrollTop = scroll.offset()?.top || 0;
    const distance = editorTop - scrollTop;
    const nextScrollTop = scrollElement.scrollTop + distance - CONFIG.SCROLL_INTO_VIEW_OFFSET;

    scroll.stop(true).scrollTop(nextScrollTop);
  }

  function selectMatchingText(editor, selectedText) {
    const isTextarea = editor.tagName === 'TEXTAREA';
    const fullText = isTextarea ? editor.value : editor.textContent || '';
    const needle = selectedText.trim();

    if (!needle) return false;

    const match = findFlexibleMatch(fullText, needle);
    if (!match || match.index === undefined) return false;

    const start = match.index;
    const end = start + match[0].length;

    if (isTextarea) {
      editor.focus();
      editor.setSelectionRange(start, end);
      scrollTextareaToSelection(editor);
      return true;
    }

    const range = window.parent.document.createRange();
    const [startNode, startOffset] = getTextNodeAtOffset(editor, start);
    const [endNode, endOffset] = getTextNodeAtOffset(editor, end);

    if (!startNode || !endNode) return false;

    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    const selection = window.parent.getSelection?.();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    editor.focus();
    scrollContentEditableToRange(editor, range);
    return true;
  }

  function findFlexibleMatch(fullText, selectedText) {
    const escaped = escapeRegExp(selectedText).replace(/\s+/g, '\\s+');
    let match = fullText.match(new RegExp(escaped, 'i'));
    if (match) return match;

    const markdownWrapper = '[*_~`]*';
    const markdownTolerantPattern =
      markdownWrapper +
      [...selectedText]
        .map((character) => (/\s/.test(character) ? `${markdownWrapper}\\s+${markdownWrapper}` : escapeRegExp(character)))
        .join(markdownWrapper);

    match = fullText.match(new RegExp(markdownTolerantPattern, 'i'));
    if (match) return match;

    const stripped = selectedText.replace(/[*_~`]/g, '');
    if (stripped && stripped !== selectedText) {
      const strippedPattern = escapeRegExp(stripped).replace(/\s+/g, '\\s+');
      match = fullText.match(new RegExp(strippedPattern, 'i'));
      if (match) return match;
    }

    return lcsMatch(fullText, selectedText);
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function lcsMatch(haystack, needle) {
    const m = needle.length;
    const n = haystack.length;

    if (m < CONFIG.LCS_MIN_NEEDLE_LENGTH || m > CONFIG.LCS_MAX_NEEDLE) return null;
    if (n === 0 || n > CONFIG.LCS_MAX_HAYSTACK) return null;

    const cols = n + 1;
    const dp = new Uint32Array((m + 1) * cols);

    for (let i = 1; i <= m; i++) {
      const needleChar = needle[i - 1];
      const rowOffset = i * cols;
      const prevRowOffset = (i - 1) * cols;

      for (let j = 1; j <= n; j++) {
        if (needleChar === haystack[j - 1]) {
          dp[rowOffset + j] = dp[prevRowOffset + (j - 1)] + 1;
        } else {
          dp[rowOffset + j] = Math.max(dp[prevRowOffset + j], dp[rowOffset + (j - 1)]);
        }
      }
    }

    const lcsLength = dp[m * cols + n];
    const similarity = lcsLength / m;
    if (similarity < CONFIG.LCS_MIN_SIMILARITY) return null;

    const haystackMatches = [];
    let i = m;
    let j = n;

    while (i > 0 && j > 0) {
      if (needle[i - 1] === haystack[j - 1]) {
        haystackMatches.unshift(j - 1);
        i--;
        j--;
      } else if (dp[(i - 1) * cols + j] > dp[i * cols + (j - 1)]) {
        i--;
      } else {
        j--;
      }
    }

    if (haystackMatches.length === 0) return null;

    const start = haystackMatches[0];
    const end = haystackMatches[haystackMatches.length - 1] + 1;

    return {
      index: start,
      0: haystack.substring(start, end),
    };
  }

  function scrollTextareaToSelection(textarea) {
    try {
      const parentDocument = getParentDocument();
      const style = window.parent.getComputedStyle(textarea);
      const mirror = measurementDiv || createMeasurementDiv(parentDocument);

      mirror.style.width = `${textarea.clientWidth}px`;
      mirror.style.padding = `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`;
      mirror.style.font = style.font;
      mirror.style.fontSize = style.fontSize;
      mirror.style.fontFamily = style.fontFamily;
      mirror.style.fontWeight = style.fontWeight;
      mirror.style.lineHeight = style.lineHeight;
      mirror.style.whiteSpace = style.whiteSpace || 'pre-wrap';
      mirror.style.wordWrap = style.wordWrap || 'break-word';
      mirror.style.wordBreak = style.wordBreak || 'break-word';
      mirror.style.overflowWrap = style.overflowWrap || 'break-word';
      mirror.textContent = textarea.value.substring(0, textarea.selectionStart);

      const heightBeforeSelection = mirror.offsetHeight;
      const lineHeight = parseFloat(style.lineHeight) || 20;
      let scrollTop =
        heightBeforeSelection + lineHeight / 2 - textarea.clientHeight * CONFIG.EDITOR_SCROLL_ALIGNMENT_RATIO;
      scrollTop = Math.max(0, scrollTop);
      scrollTop = Math.min(textarea.scrollHeight - textarea.clientHeight, scrollTop);

      getJQuery()(textarea).stop(true).animate({ scrollTop }, CONFIG.ANIMATION_DURATION);
    } catch (error) {
      console.error('[Convenient Edit] Error in scrollTextareaToSelection:', error);
    }
  }

  function createMeasurementDiv(parentDocument) {
    measurementDiv = parentDocument.createElement('div');
    measurementDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      pointer-events: none;
      box-sizing: border-box;
      left: -9999px;
      top: -9999px;
    `;
    parentDocument.body.appendChild(measurementDiv);
    return measurementDiv;
  }

  function scrollContentEditableToRange(editor, range) {
    try {
      const rangeRect = range.getBoundingClientRect();
      const editorRect = editor.getBoundingClientRect();
      const rangeCenter = rangeRect.top + rangeRect.height / 2;
      const editorTop = editorRect.top;

      let scrollTop = rangeCenter - editorTop - editor.clientHeight * CONFIG.EDITOR_SCROLL_ALIGNMENT_RATIO;
      scrollTop = Math.max(0, scrollTop);
      scrollTop = Math.min(editor.scrollHeight - editor.clientHeight, scrollTop);

      getJQuery()(editor).stop(true).animate({ scrollTop }, CONFIG.ANIMATION_DURATION);
    } catch (error) {
      console.error('[Convenient Edit] Error in scrollContentEditableToRange:', error);
    }
  }

  function getTextNodeAtOffset(root, offset) {
    let currentOffset = 0;
    const walker = window.parent.document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node = walker.nextNode();

    while (node) {
      const length = node.textContent?.length || 0;
      if (currentOffset + length >= offset) {
        return [node, Math.max(0, offset - currentOffset)];
      }
      currentOffset += length;
      node = walker.nextNode();
    }

    return [null, 0];
  }

  function handleShortcut(event) {
    if (event.key === 'F8') {
      event.preventDefault();
      setTimeout(handleEditAction, 0);
    }
  }

  function handleParentMouseDown(event) {
    const $ = getJQuery();
    const parentDocument = getParentDocument();
    const activeEditor = $(parentDocument).find(CONFIG.SELECTORS.ST_EDITOR_TEXTAREA);
    if (!activeEditor.length) return;

    const target = event.target;
    const targetElement = $(target);
    const activeMessage = activeEditor.closest(CONFIG.SELECTORS.MESSAGE);

    const clickedDoneButton = targetElement.hasClass(CONFIG.SELECTORS.DONE_BUTTON.slice(1));
    const clickedInsideActiveMessage = activeMessage.length > 0 && activeMessage[0].contains(target);
    const clickedInsideFloatingButton = floatingButton && floatingButton.contains(target);

    if (!clickedDoneButton && !clickedInsideActiveMessage && !clickedInsideFloatingButton) {
      saveCurrentEdit(activeMessage);
    }
  }

  function saveCurrentEdit(message) {
    const doneButton = message.find(CONFIG.SELECTORS.DONE_BUTTON);

    if (!doneButton.length) {
      savedScrollTop = null;
      return;
    }

    setTimeout(() => {
      doneButton.trigger('click');

      if (savedScrollTop === null) return;
      const scrollTopToRestore = savedScrollTop;
      savedScrollTop = null;

      const scroll = getScrollContainer();
      if (!scroll) return;

      let timeout = null;
      const observer = new MutationObserver((_, currentObserver) => {
        if (!isMessageEditing(message)) {
          scroll.stop(true).animate({ scrollTop: scrollTopToRestore }, CONFIG.ANIMATION_DURATION);
          currentObserver.disconnect();
          clearTimeout(timeout);
        }
      });

      timeout = setTimeout(() => {
        observer.disconnect();
        if (!isMessageEditing(message)) {
          scroll.stop(true).animate({ scrollTop: scrollTopToRestore }, CONFIG.ANIMATION_DURATION);
        }
      }, CONFIG.OBSERVER_TIMEOUT);

      observer.observe(message[0], { childList: true, subtree: true });
    }, 10);
  }

  function isMessageEditing(message) {
    return message.find(CONFIG.SELECTORS.EDITOR).length > 0;
  }

  function getScrollContainer() {
    const $ = getJQuery();
    const parentDocument = getParentDocument();

    if (scrollContainer && scrollContainer.closest('body').length) return scrollContainer;

    for (const selector of CONFIG.SELECTORS.SCROLL_CONTAINERS) {
      const candidate = $(parentDocument).find(selector);
      if (candidate.length > 0) {
        scrollContainer = candidate.first();
        return scrollContainer;
      }
    }

    const fallback = $(parentDocument)
      .find('div')
      .filter((_, element) => {
        const overflowY = $(element).css('overflow-y');
        return (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          element.scrollHeight > element.clientHeight &&
          $(element).find(CONFIG.SELECTORS.MESSAGE).length > 0
        );
      })
      .first();

    if (fallback.length > 0) {
      scrollContainer = fallback;
      return scrollContainer;
    }

    return null;
  }

  function observeVisibleMessages() {
    const $ = getJQuery();
    const parentDocument = getParentDocument();
    const scroll = getScrollContainer();

    if (!scroll) {
      setTimeout(observeVisibleMessages, 500);
      return;
    }

    if (!('IntersectionObserver' in window.parent)) {
      currentVisibleMessage = $(parentDocument).find(CONFIG.SELECTORS.MESSAGE).last()[0] || null;
      return;
    }

    const visibleEntries = new Map();
    intersectionObserver = new window.parent.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleEntries.set(entry.target, entry.intersectionRatio);
          } else {
            visibleEntries.delete(entry.target);
          }
        });

        let highestRatio = 0;
        currentVisibleMessage = null;
        for (const [element, ratio] of visibleEntries.entries()) {
          if (ratio > highestRatio) {
            highestRatio = ratio;
            currentVisibleMessage = element;
          }
        }
      },
      {
        root: scroll[0],
        rootMargin: '0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    const refreshObservedMessages = () => {
      const messages = $(parentDocument).find(CONFIG.SELECTORS.MESSAGE);
      intersectionObserver?.disconnect();
      visibleEntries.clear();
      messages.each((_, element) => intersectionObserver?.observe(element));
    };

    refreshObservedMessages();
    bindTavernEvent('CHAT_CHANGED', () => setTimeout(refreshObservedMessages, 200));
    bindTavernEvent('MESSAGE_RECEIVED', () => setTimeout(refreshObservedMessages, 200));
    bindTavernEvent('MESSAGE_DELETED', () => setTimeout(refreshObservedMessages, 200));
  }

  function bindTavernEvent(eventName, handler) {
    safeCall(() => {
      const event = tavern_events?.[eventName];
      if (event && typeof eventOn === 'function') eventOn(event, handler);
    });
  }

  function getSettingsHost() {
    const $ = getJQuery();
    const parentDocument = getParentDocument();

    return (
      safeCall(() => document.querySelector('#extensions_settings2'), null) ||
      safeCall(() => parentDocument.querySelector('#extensions_settings2'), null) ||
      safeCall(() => $('#extensions_settings2')[0], null) ||
      safeCall(() => $(parentDocument).find('#extensions_settings2')[0], null)
    );
  }

  function getSettingsDocument() {
    const host = getSettingsHost();
    return host?.ownerDocument || getParentDocument() || document;
  }

  function injectSettingsStyle() {
    if (settingsStyle) return;

    const uiDocument = getSettingsDocument();
    const styleHost = uiDocument.head || uiDocument.documentElement;
    if (!styleHost) return;

    settingsStyle = uiDocument.createElement('style');
    settingsStyle.setAttribute(CONFIG.ATTRIBUTES.SCRIPT_ID, SCRIPT_ID);
    settingsStyle.textContent = `
      .${CONFIG.CLASSES.SETTINGS} .hint {
        opacity: 0.7;
        font-size: 12px;
      }
      .${CONFIG.CLASSES.SETTINGS} .flex-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    `;
    styleHost.appendChild(settingsStyle);
  }

  function renderSettingsPanel() {
    const host = getSettingsHost();

    if (!host) {
      scheduleSettingsRenderRetry();
      return;
    }

    if (settingsRoot && settingsRoot.isConnected) return;

    clearTimeout(settingsRenderRetryTimer);
    settingsRenderRetryTimer = null;
    settingsHostObserver?.disconnect();
    settingsHostObserver = null;

    injectSettingsStyle();

    const uiDocument = host.ownerDocument || getSettingsDocument();
    settingsRoot = uiDocument.createElement('div');
    settingsRoot.setAttribute(CONFIG.ATTRIBUTES.SCRIPT_ID, SCRIPT_ID);
    settingsRoot.className = CONFIG.CLASSES.SETTINGS;

    const safeScriptId = String(SCRIPT_ID).replace(/[^\w-]/g, '-');
    const checkboxId = `show-button-checkbox-${safeScriptId}`;
    settingsRoot.innerHTML = `
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>✏️更好的小铅笔</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
          <div class="convenient-edit-extension_block flex-container">
            <input type="checkbox" id="${checkboxId}" ${settings.showButton ? 'checked' : ''} />
            <label for="${checkboxId}">显示悬浮编辑按钮</label>
          </div>
          <hr class="sysHR" />
          <div class="hint">
            <span>提示：选取文本按下按钮或 F8 快捷键可定位修改，再次点击按钮或空白处可保存</span>
          </div>
        </div>
      </div>
    `;

    const checkbox = settingsRoot.querySelector('input[type="checkbox"]');
    checkbox?.addEventListener('change', (event) => setShowButton(event.target.checked));

    host.appendChild(settingsRoot);
  }

  function scheduleSettingsRenderRetry() {
    if (settingsRenderRetryTimer) return;

    settingsRenderRetryTimer = setTimeout(() => {
      settingsRenderRetryTimer = null;
      renderSettingsPanel();
    }, 500);

    if (settingsHostObserver) return;

    const observeDocument = getParentDocument();
    const observeTarget = observeDocument?.body || observeDocument?.documentElement;
    if (!observeTarget) return;

    settingsHostObserver = new MutationObserver(() => {
      if (getSettingsHost()) renderSettingsPanel();
    });

    settingsHostObserver.observe(observeTarget, {
      childList: true,
      subtree: true,
    });
  }

  function cleanup() {
    safeCall(() => {
      measurementDiv?.remove();
      measurementDiv = null;

      intersectionObserver?.disconnect();
      intersectionObserver = null;
      currentVisibleMessage = null;

      destroyFloatingButton();

      const parentDocument = getParentDocument();
      parentDocument.removeEventListener('mousedown', handleParentMouseDown);
      parentDocument.removeEventListener('keydown', handleShortcut);

      clearTimeout(settingsRenderRetryTimer);
      settingsRenderRetryTimer = null;

      settingsHostObserver?.disconnect();
      settingsHostObserver = null;

      settingsRoot?.remove();
      settingsRoot = null;

      settingsStyle?.remove();
      settingsStyle = null;
    });
  }

  function boot() {
    const $ = getJQuery();
    if (!$) {
      console.error('[方便修改] 未找到 jQuery，扩展无法初始化。');
      return;
    }

    persistDefaultSettingsIfNeeded();
    renderSettingsPanel();

    if (settings.showButton) createFloatingButton();

    const parentDocument = getParentDocument();
    parentDocument.addEventListener('mousedown', handleParentMouseDown);
    parentDocument.addEventListener('keydown', handleShortcut);

    observeVisibleMessages();
    window.addEventListener('pagehide', cleanup, { once: true });
  }

  const $ready = getJQuery();
  if ($ready) {
    $ready(boot);
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
