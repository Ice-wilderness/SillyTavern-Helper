import { createPinia, storeToRefs } from "pinia";
import { klona } from "klona";
import SettingsPanel from "./设置界面.vue";
import { CONSTANTS } from "./constants";
import { useSettingsStore } from "./settings";
import { useThemeStore, type ThemeColors } from "./theme";

const { createApp, watch } = Vue;

let floatingButton: JQuery<HTMLElement> | null = null;
let wasDragged = false;
let isReEntryLocked = false;
let savedScrollTop: number | null = null;
let scrollContainerCache: JQuery<HTMLElement> | null = null;
let hiddenMeasureDiv: HTMLDivElement | null = null;
let messageIntersectionObserver: IntersectionObserver | null = null;
let mostVisibleMessage: Element | null = null;

function getThemeColors(): ThemeColors {
  try {
    return useThemeStore().themeColors;
  } catch {
    return {
      controlBg: "rgba(45, 55, 72, 0.8)",
      barBg: "rgba(30, 30, 40, 0.9)",
      controlHoverBg: "rgba(35, 45, 62, 0.8)",
      borderColor: "#718096",
      textColor: "#e2e8f0",
      quoteColor: "#9ca3af",
    };
  }
}

function updateFloatingButtonTheme() {
  if (!floatingButton) return;

  const colors = getThemeColors();
  const inner = floatingButton.find(".ball-inner");
  const ring = floatingButton.find(".ball-ring");
  const icon = floatingButton.find(".ball-inner i");
  const pulse = floatingButton.find(".ball-pulse");

  inner.css({
    background: `linear-gradient(145deg, ${colors.controlBg}, ${colors.barBg})`,
    borderColor: colors.borderColor,
  });
  ring.css({ borderColor: colors.borderColor });
  icon.css({ color: colors.textColor });
  pulse.css({ background: colors.quoteColor });
}

function createFloatingButton() {
  if (floatingButton) return;

  const themeStore = useThemeStore();
  themeStore.initializeThemeObserver();

  const colors = getThemeColors();
  const variables =
    getVariables({ type: "script", script_id: getScriptId() }) ?? {};
  const buttonPosition = variables.buttonPosition;
  const hasSavedPosition =
    buttonPosition && (buttonPosition.x > 0 || buttonPosition.y > 0);
  const innerSize = CONSTANTS.BUTTON_SIZE - 4;

  floatingButton = $("<div>")
    .attr(CONSTANTS.ATTRIBUTES.SCRIPT_ID, getScriptId())
    .addClass(CONSTANTS.CLASSES.BUTTON)
    .css({
      position: "fixed",
      zIndex: CONSTANTS.Z_INDEX,
      width: `${CONSTANTS.BUTTON_SIZE}px`,
      height: `${CONSTANTS.BUTTON_SIZE}px`,
      cursor: "pointer",
      userSelect: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...(hasSavedPosition
        ? { left: `${buttonPosition.x}px`, top: `${buttonPosition.y}px` }
        : CONSTANTS.DEFAULT_POSITION),
    }).html(`
      <div class="ball-inner" style="
        position: relative;
        width: ${innerSize}px;
        height: ${innerSize}px;
        background: linear-gradient(145deg, ${colors.controlBg}, ${colors.barBg});
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid ${colors.borderColor};
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 2;
      ">
        <i class="fa-solid fa-pencil" style="
          font-size: 14px;
          color: ${colors.textColor};
          transition: all 0.3s ease;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        "></i>
      </div>
      <div class="ball-ring" style="
        position: absolute;
        width: ${CONSTANTS.BUTTON_SIZE}px;
        height: ${CONSTANTS.BUTTON_SIZE}px;
        border-radius: 50%;
        transition: all 0.3s ease;
        z-index: 1;
      "></div>
      <div class="ball-pulse" style="
        position: absolute;
        width: ${innerSize}px;
        height: ${innerSize}px;
        border-radius: 50%;
        background: ${colors.quoteColor};
        opacity: 0;
        z-index: 0;
        pointer-events: none;
      "></div>
    `);

  floatingButton
    .find(".ball-ring")
    .css({ border: `2px solid ${colors.borderColor}`, opacity: 0.4 });

  floatingButton
    .on("mousedown", (event) => {
      event.stopPropagation();
      wasDragged = false;
    })
    .on("mouseup", () => {
      if (!wasDragged) toggleEditing();
    })
    .on("mouseenter", function () {
      const inner = $(this).find(".ball-inner");
      const ring = $(this).find(".ball-ring");
      const icon = $(this).find(".ball-inner i");
      const nextColors = getThemeColors();

      inner.css({
        transform: "scale(1.08)",
        boxShadow:
          "0 6px 20px rgba(0, 0, 0, 0.35), 0 3px 6px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        background: `linear-gradient(145deg, ${nextColors.controlHoverBg}, ${nextColors.controlBg})`,
      });
      ring.css({
        opacity: 0.7,
        transform: "scale(1.1)",
        borderColor: nextColors.quoteColor,
      });
      icon.css({ transform: "scale(1.1)", color: nextColors.quoteColor });
    })
    .on("mouseleave", function () {
      const inner = $(this).find(".ball-inner");
      const ring = $(this).find(".ball-ring");
      const icon = $(this).find(".ball-inner i");
      const nextColors = getThemeColors();

      inner.css({
        transform: "scale(1)",
        boxShadow:
          "0 4px 15px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        background: `linear-gradient(145deg, ${nextColors.controlBg}, ${nextColors.barBg})`,
      });
      ring.css({
        opacity: 0.4,
        transform: "scale(1)",
        borderColor: nextColors.borderColor,
      });
      icon.css({ transform: "scale(1)", color: nextColors.textColor });
    });

  $(window.parent.document.body).append(floatingButton);

  watch(() => themeStore.themeColors, updateFloatingButtonTheme, {
    deep: true,
  });

  try {
    let buttonWidth = 0;
    let buttonHeight = 0;
    let viewportWidth = 0;
    let viewportHeight = 0;

    floatingButton.draggable({
      scroll: false,
      start: () => {
        wasDragged = true;
        if (!floatingButton) return;
        buttonWidth = floatingButton.outerWidth() ?? 0;
        buttonHeight = floatingButton.outerHeight() ?? 0;
        viewportWidth = window.parent.innerWidth;
        viewportHeight = window.parent.innerHeight;
      },
      drag: (_event, ui) => {
        if (ui.position.left < 0) ui.position.left = 0;
        if (ui.position.top < 0) ui.position.top = 0;
        if (ui.position.left + buttonWidth > viewportWidth)
          ui.position.left = viewportWidth - buttonWidth;
        if (ui.position.top + buttonHeight > viewportHeight)
          ui.position.top = viewportHeight - buttonHeight;
      },
      stop: (_event, ui) => {
        const position = {
          x: Math.round(ui.position.left),
          y: Math.round(ui.position.top),
        };
        insertOrAssignVariables(
          { buttonPosition: klona(position) },
          { type: "script", script_id: getScriptId() },
        );
      },
    });
  } catch (error) {
    console.error(
      "[Convenient Edit] Draggable feature failed to initialize.",
      error,
    );
  }
}

function destroyFloatingButton() {
  if (!floatingButton) return;

  try {
    floatingButton.draggable?.("destroy");
    useThemeStore().disconnectThemeObserver();
  } catch {}

  floatingButton.off("mouseenter mouseleave");
  floatingButton.remove();
  floatingButton = null;
}

function getCurrentTargetMessage(): {
  target: JQuery<HTMLElement> | null;
  selectedText: string;
} {
  const activeEditor = $(window.parent.document).find(
    CONSTANTS.SELECTORS.ST_EDITOR_TEXTAREA,
  );
  if (activeEditor.length > 0) {
    return {
      target: activeEditor.closest(CONSTANTS.SELECTORS.MESSAGE),
      selectedText: "",
    };
  }

  const selection = window.parent.getSelection();
  if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
    const commonAncestor = selection.getRangeAt(0).commonAncestorContainer;
    const element =
      commonAncestor.nodeType === Node.TEXT_NODE
        ? commonAncestor.parentElement
        : commonAncestor;

    if (element) {
      const target = $(element).closest(CONSTANTS.SELECTORS.MESSAGE);
      if (target.length > 0) {
        return { target, selectedText: selection.toString() };
      }
    }
  }

  return {
    target: mostVisibleMessage ? $(mostVisibleMessage) : null,
    selectedText: "",
  };
}

function clickFirstVisibleEditButton(
  message: JQuery<HTMLElement>,
  selectors: readonly string[],
): boolean {
  for (const selector of selectors) {
    const button = message.find(selector).filter(":visible").first();
    if (button.length > 0) {
      button.trigger("click");
      return true;
    }
  }

  return false;
}

function toggleEditing() {
  if (isReEntryLocked) return;

  isReEntryLocked = true;
  try {
    const { target, selectedText } = getCurrentTargetMessage();
    if (!target) return;

    if (messageHasEditor(target)) {
      finishEditing(target);
      return;
    }

    const scrollContainer = getScrollContainer();
    if (scrollContainer) savedScrollTop = scrollContainer[0].scrollTop;

    target.attr(CONSTANTS.ATTRIBUTES.TEMP_TARGET, "true");

    if (
      !clickFirstVisibleEditButton(target, CONSTANTS.SELECTORS.EDIT_BUTTONS)
    ) {
      target.removeAttr(CONSTANTS.ATTRIBUTES.TEMP_TARGET);
      savedScrollTop = null;
      return;
    }

    waitForEditorAndFocus(
      `[${CONSTANTS.ATTRIBUTES.TEMP_TARGET}="true"]`,
      selectedText,
    );
  } finally {
    setTimeout(() => {
      isReEntryLocked = false;
    }, CONSTANTS.RE_ENTRY_GUARD_DELAY);
  }
}

function waitForEditorAndFocus(targetSelector: string, selectedText: string) {
  const target = $(window.parent.document).find(targetSelector);
  if (!target.length) return;

  const cleanup = (observer?: MutationObserver) => {
    observer?.disconnect();
    clearTimeout(timeoutId);
    target.removeAttr(CONSTANTS.ATTRIBUTES.TEMP_TARGET);
  };

  const findEditor = (): HTMLElement | null => {
    const globalEditor = $(window.parent.document).find(
      CONSTANTS.SELECTORS.ST_EDITOR_TEXTAREA,
    );
    if (globalEditor.length > 0 && globalEditor.is(":visible"))
      return globalEditor[0];

    const messageText = target.find(".mes_text");
    if (messageText.length > 0) {
      const localEditor = messageText
        .find('textarea:visible, [contenteditable="true"]:visible')
        .first();
      if (localEditor.length > 0) return localEditor[0];
    }

    const fallbackEditor = target.find(CONSTANTS.SELECTORS.EDITOR).first();
    return fallbackEditor.length > 0 ? fallbackEditor[0] : null;
  };

  const focusEditor = (editor: HTMLElement) => {
    scrollEditorIntoView(editor);

    requestAnimationFrame(() => {
      const trimmedSelection = selectedText.trim();

      if (trimmedSelection.length > 0) {
        const found = selectTextInEditor(editor, trimmedSelection);
        if (!found) {
          editor.focus();
          editor.scrollTop = 0;
        }
      } else {
        editor.focus();
        editor.scrollTop = 0;
      }
    });
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        const editor = findEditor();
        if (editor) {
          cleanup(observer);
          focusEditor(editor);
          return;
        }
      }
    }
  });

  const timeoutId = setTimeout(() => {
    const editor = findEditor();
    if (editor) focusEditor(editor);
    cleanup(observer);
  }, CONSTANTS.EDITOR_APPEAR_TIMEOUT);

  observer.observe(target[0], { childList: true, subtree: true });

  const editor = findEditor();
  if (editor) {
    cleanup(observer);
    focusEditor(editor);
  }
}

function scrollEditorIntoView(editor: HTMLElement) {
  const scrollContainer = getScrollContainer();
  if (!editor || !scrollContainer) return;

  const nativeScrollContainer = scrollContainer[0];
  const editorOffsetTop = $(editor).offset()?.top || 0;
  const containerOffsetTop = scrollContainer.offset()?.top || 0;
  const relativeTop = editorOffsetTop - containerOffsetTop;
  const targetScrollTop =
    nativeScrollContainer.scrollTop +
    relativeTop -
    CONSTANTS.SCROLL_INTO_VIEW_OFFSET;

  scrollContainer.stop(true).scrollTop(targetScrollTop);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findFlexibleMatch(
  text: string,
  query: string,
): RegExpMatchArray | null {
  const escaped = escapeRegExp(query).replace(/\s+/g, "\\s+");
  const directMatch = text.match(new RegExp(escaped, "i"));
  if (directMatch) return directMatch;

  const optionalMarkdown = "[*_~`]*";
  const markdownTolerantPattern =
    optionalMarkdown +
    [...query]
      .map((char) =>
        /\s/.test(char)
          ? `${optionalMarkdown}\\s+${optionalMarkdown}`
          : escapeRegExp(char) + optionalMarkdown,
      )
      .join("");
  const markdownTolerantMatch = text.match(
    new RegExp(markdownTolerantPattern, "i"),
  );
  if (markdownTolerantMatch) return markdownTolerantMatch;

  const queryWithoutMarkdown = query.replace(/[*_~`]/g, "");
  if (queryWithoutMarkdown && queryWithoutMarkdown !== query) {
    const plainPattern = escapeRegExp(queryWithoutMarkdown).replace(
      /\s+/g,
      "\\s+",
    );
    const plainMatch = text.match(new RegExp(plainPattern, "i"));
    if (plainMatch) return plainMatch;
  }

  return null;
}

function selectTextInEditor(
  editor: HTMLElement,
  selectedText: string,
): boolean {
  const isTextarea = editor.tagName === "TEXTAREA";
  const editorText = isTextarea
    ? (editor as HTMLTextAreaElement).value
    : (editor.textContent ?? "");
  const query = selectedText.trim();
  if (!query) return false;

  const match = findFlexibleMatch(editorText, query);
  if (!match || match.index === undefined) return false;

  const start = match.index;
  const end = start + match[0].length;

  if (isTextarea) {
    const textarea = editor as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(start, end);
    scrollTextareaToMatch(textarea);
  } else {
    const range = window.parent.document.createRange();
    const [startNode, startOffset] = findTextNodeAtOffset(editor, start);
    const [endNode, endOffset] = findTextNodeAtOffset(editor, end);
    if (!startNode || !endNode) return false;

    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    const selection = window.parent.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    editor.focus();
    scrollContentEditableToMatch(editor, range);
  }

  return true;
}

function scrollTextareaToMatch(textarea: HTMLTextAreaElement) {
  try {
    const style = getComputedStyle(textarea);
    const measureDiv =
      hiddenMeasureDiv ||
      (() => {
        hiddenMeasureDiv = window.parent.document.createElement("div");
        hiddenMeasureDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      pointer-events: none;
      box-sizing: border-box;
      left: -9999px;
      top: -9999px;
    `;
        window.parent.document.body.appendChild(hiddenMeasureDiv);
        return hiddenMeasureDiv;
      })();

    measureDiv.style.width = `${textarea.clientWidth}px`;
    measureDiv.style.padding = `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`;
    measureDiv.style.font = style.font;
    measureDiv.style.fontSize = style.fontSize;
    measureDiv.style.fontFamily = style.fontFamily;
    measureDiv.style.fontWeight = style.fontWeight;
    measureDiv.style.lineHeight = style.lineHeight;
    measureDiv.style.whiteSpace = style.whiteSpace || "pre-wrap";
    measureDiv.style.wordWrap = style.wordWrap || "break-word";
    measureDiv.style.wordBreak = style.wordBreak || "break-word";
    measureDiv.style.overflowWrap = style.overflowWrap || "break-word";

    measureDiv.textContent = textarea.value.substring(
      0,
      textarea.selectionStart,
    );

    const measuredHeight = measureDiv.offsetHeight;
    const lineHeight = parseFloat(style.lineHeight) || 20;
    let scrollTop =
      measuredHeight +
      lineHeight / 2 -
      textarea.clientHeight * CONSTANTS.EDITOR_SCROLL_ALIGNMENT_RATIO;
    scrollTop = Math.max(0, scrollTop);
    scrollTop = Math.min(
      textarea.scrollHeight - textarea.clientHeight,
      scrollTop,
    );

    $(textarea).stop(true).animate({ scrollTop }, CONSTANTS.ANIMATION_DURATION);
  } catch (error) {
    console.error("[Convenient Edit] Error in scrollTextareaToMatch:", error);
  }
}

function scrollContentEditableToMatch(editor: HTMLElement, range: Range) {
  try {
    const rangeRect = range.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();
    const rangeCenterY = rangeRect.top + rangeRect.height / 2;
    const editorTop = editorRect.top;

    let scrollTop =
      rangeCenterY -
      editorTop -
      editor.clientHeight * CONSTANTS.EDITOR_SCROLL_ALIGNMENT_RATIO;
    scrollTop = Math.max(0, scrollTop);
    scrollTop = Math.min(editor.scrollHeight - editor.clientHeight, scrollTop);

    $(editor).stop(true).animate({ scrollTop }, CONSTANTS.ANIMATION_DURATION);
  } catch (error) {
    console.error(
      "[Convenient Edit] Error in scrollContentEditableToMatch:",
      error,
    );
  }
}

function handleF8(event: KeyboardEvent) {
  if (event.key === "F8") {
    event.preventDefault();
    setTimeout(toggleEditing, 0);
  }
}

function handleDocumentMouseDown(event: JQuery.MouseDownEvent) {
  const activeEditor = $(window.parent.document).find(
    CONSTANTS.SELECTORS.ST_EDITOR_TEXTAREA,
  );
  if (!activeEditor.length) return;

  const targetNode = event.target;
  const $target = $(targetNode);
  const message = activeEditor.closest(CONSTANTS.SELECTORS.MESSAGE);

  if (
    $target.hasClass(CONSTANTS.SELECTORS.DONE_BUTTON.substring(1)) ||
    (message.length > 0 && message[0].contains(targetNode)) ||
    (floatingButton && floatingButton[0].contains(targetNode))
  ) {
    return;
  }

  finishEditing(message);
}

function finishEditing(message: JQuery<HTMLElement>) {
  const doneButton = message.find(CONSTANTS.SELECTORS.DONE_BUTTON);

  if (!doneButton.length) {
    savedScrollTop = null;
    return;
  }

  setTimeout(() => {
    doneButton.trigger("click");

    if (savedScrollTop === null) return;
    const previousScrollTop = savedScrollTop;
    savedScrollTop = null;

    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    const observer = new MutationObserver((_mutations, mutationObserver) => {
      if (!messageHasEditor(message)) {
        scrollContainer
          .stop(true)
          .animate(
            { scrollTop: previousScrollTop },
            CONSTANTS.ANIMATION_DURATION,
          );
        mutationObserver.disconnect();
        clearTimeout(timeoutId);
      }
    });

    const timeoutId = setTimeout(() => {
      observer.disconnect();
      if (!messageHasEditor(message)) {
        scrollContainer
          .stop(true)
          .animate(
            { scrollTop: previousScrollTop },
            CONSTANTS.ANIMATION_DURATION,
          );
      }
    }, CONSTANTS.OBSERVER_TIMEOUT);

    observer.observe(message[0], { childList: true, subtree: true });
  }, 10);
}

function messageHasEditor(message: JQuery<HTMLElement>): boolean {
  return message.find(CONSTANTS.SELECTORS.EDITOR).length > 0;
}

function getScrollContainer(): JQuery<HTMLElement> | null {
  if (scrollContainerCache && scrollContainerCache.closest("body").length) {
    return scrollContainerCache;
  }

  const parentDocument = $(window.parent.document);
  for (const selector of CONSTANTS.SELECTORS.SCROLL_CONTAINERS) {
    const candidate = parentDocument.find(selector);
    if (candidate.length > 0) {
      scrollContainerCache = candidate.first();
      return scrollContainerCache;
    }
  }

  const fallback = parentDocument
    .find("div")
    .filter((_index, element) => {
      const overflowY = $(element).css("overflow-y");
      return (
        (overflowY === "auto" || overflowY === "scroll") &&
        element.scrollHeight > element.clientHeight &&
        $(element).find(CONSTANTS.SELECTORS.MESSAGE).length > 0
      );
    })
    .first();

  if (fallback.length > 0) {
    scrollContainerCache = fallback;
    return scrollContainerCache;
  }

  return null;
}

function trackMostVisibleMessage() {
  const scrollContainer = getScrollContainer();
  if (!scrollContainer) {
    setTimeout(trackMostVisibleMessage, 500);
    return;
  }

  const visibleMessages = new Map<Element, number>();

  messageIntersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleMessages.set(entry.target, entry.intersectionRatio);
        } else {
          visibleMessages.delete(entry.target);
        }
      });

      let bestRatio = 0;
      mostVisibleMessage = null;
      for (const [message, ratio] of visibleMessages.entries()) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          mostVisibleMessage = message;
        }
      }
    },
    {
      root: scrollContainer[0],
      rootMargin: "0px",
      threshold: [0, 0.25, 0.5, 0.75, 1],
    },
  );

  const refreshObservedMessages = () => {
    const messages = $(window.parent.document).find(
      CONSTANTS.SELECTORS.MESSAGE,
    );
    messageIntersectionObserver?.disconnect();
    messages.each((_index, element) =>
      messageIntersectionObserver?.observe(element),
    );
  };

  refreshObservedMessages();
  eventOn(tavern_events.CHAT_CHANGED, () =>
    setTimeout(refreshObservedMessages, 200),
  );
  eventOn(tavern_events.MESSAGE_RECEIVED, () =>
    setTimeout(refreshObservedMessages, 200),
  );
  eventOn(tavern_events.MESSAGE_DELETED, () =>
    setTimeout(refreshObservedMessages, 200),
  );
}

function findTextNodeAtOffset(
  root: Node,
  targetOffset: number,
): [Node | null, number] {
  let currentOffset = 0;
  const walker = window.parent.document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null,
  );
  let node = walker.nextNode();

  while (node) {
    const length = node.textContent?.length ?? 0;
    if (currentOffset + length >= targetOffset) {
      return [node, Math.max(0, targetOffset - currentOffset)];
    }

    currentOffset += length;
    node = walker.nextNode();
  }

  return [null, 0];
}

$(() => {
  const settingsStore = useSettingsStore();
  const { settings } = storeToRefs(settingsStore);

  if (settings.value.showButton) createFloatingButton();

  $(window.parent.document).on("mousedown", handleDocumentMouseDown);
  $(window.parent.document).on("keydown", handleF8);
  trackMostVisibleMessage();

  watch(
    settings,
    (nextSettings, previousSettings) => {
      if (nextSettings.showButton !== previousSettings.showButton) {
        nextSettings.showButton
          ? createFloatingButton()
          : destroyFloatingButton();
      }
    },
    { deep: true },
  );

  $(window).on("pagehide", () => {
    if (hiddenMeasureDiv && hiddenMeasureDiv.parentNode) {
      hiddenMeasureDiv.parentNode.removeChild(hiddenMeasureDiv);
    }
    hiddenMeasureDiv = null;

    messageIntersectionObserver?.disconnect();
    messageIntersectionObserver = null;

    destroyFloatingButton();
    $(window.parent.document).off("mousedown", handleDocumentMouseDown);
    $(window.parent.document).off("keydown", handleF8);
  });
});

const app = createApp(SettingsPanel).use(createPinia());

$(() => {
  const mountPoint = $("<div>").attr("script_id", getScriptId());
  $("#extensions_settings2").append(mountPoint);

  copyInjectedStylesToHead();
  app.mount(mountPoint[0]);
});

$(window).on("pagehide", () => {
  app.unmount();
  $(`head > div[script_id="${getScriptId()}"]`).remove();
  $(`div[script_id="${getScriptId()}"]`).remove();
});

function copyInjectedStylesToHead() {
  if ($(`head > div[script_id="${getScriptId()}"]`).length > 0) return;

  const styleContainer = $("<div>")
    .attr("script_id", getScriptId())
    .append($("head > style", document).clone());

  $("head").append(styleContainer);
}
