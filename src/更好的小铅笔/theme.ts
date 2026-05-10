import { defineStore } from "pinia";

export interface ThemeColors {
  barBg: string;
  controlBg: string;
  controlHoverBg: string;
  textColor: string;
  borderColor: string;
  quoteColor: string;
}

const DEFAULT_THEME_COLORS: ThemeColors = {
  barBg: "rgba(30, 30, 40, 0.9)",
  controlBg: "rgba(45, 55, 72, 0.8)",
  controlHoverBg: "rgba(35, 45, 62, 0.8)",
  textColor: "#e2e8f0",
  borderColor: "#718096",
  quoteColor: "#9ca3af",
};

const { ref } = Vue;

function forceOpaqueColor(color: string | null | undefined): string {
  if (!color || color === "transparent") return "rgba(0, 0, 0, 1)";

  try {
    if (color.startsWith("rgba")) {
      const parts = color
        .substring(color.indexOf("(") + 1, color.lastIndexOf(")"))
        .split(",");

      if (parts.length >= 3) {
        return `rgba(${parts[0].trim()}, ${parts[1].trim()}, ${parts[2].trim()}, 1)`;
      }
    }
  } catch {}

  return color;
}

function darkenRgba(color: string, amount: number): string {
  try {
    if (color.startsWith("rgba")) {
      const parts = color
        .substring(color.indexOf("(") + 1, color.lastIndexOf(")"))
        .split(",");

      if (parts.length >= 3) {
        let r = parseInt(parts[0].trim(), 10);
        let g = parseInt(parts[1].trim(), 10);
        let b = parseInt(parts[2].trim(), 10);
        const alpha = parts.length > 3 ? parseFloat(parts[3].trim()) : 1;

        r = Math.max(0, r - r * amount);
        g = Math.max(0, g - g * amount);
        b = Math.max(0, b - b * amount);

        return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
      }
    }
  } catch {}

  return color;
}

function findScrollContainer(): JQuery<HTMLElement> | null {
  const parentDocument = $(window.parent.document);
  const selectors = [".simplebar-content-wrapper", "#chat"];

  for (const selector of selectors) {
    const candidate = parentDocument.find(selector);
    if (candidate.length > 0) return candidate.first();
  }

  return null;
}

export const useThemeStore = defineStore("convenient_edit_theme", () => {
  const themeColors = ref<ThemeColors>({ ...DEFAULT_THEME_COLORS });
  let themeObserver: MutationObserver | null = null;

  const updateThemeColors = () => {
    try {
      const parentDocument = window.parent.document;

      let barBg = DEFAULT_THEME_COLORS.barBg;
      let controlBg = DEFAULT_THEME_COLORS.controlBg;
      let controlHoverBg = DEFAULT_THEME_COLORS.controlHoverBg;
      let textColor = DEFAULT_THEME_COLORS.textColor;
      let borderColor = DEFAULT_THEME_COLORS.borderColor;
      let quoteColor = DEFAULT_THEME_COLORS.quoteColor;

      const scrollContainer = findScrollContainer();
      if (scrollContainer) {
        let baseBg = window.parent.getComputedStyle(
          scrollContainer[0],
        ).backgroundColor;
        if (baseBg === "rgba(0, 0, 0, 0)" || baseBg === "transparent") {
          baseBg = window.parent.getComputedStyle(
            parentDocument.body,
          ).backgroundColor;
        }

        const topBar = parentDocument.querySelector("#top-bar");
        if (topBar) {
          const topBarBg =
            window.parent.getComputedStyle(topBar).backgroundColor;
          barBg = forceOpaqueColor(
            topBarBg !== "rgba(0, 0, 0, 0)" && topBarBg !== "transparent"
              ? topBarBg
              : baseBg,
          );
        } else {
          barBg = forceOpaqueColor(baseBg);
        }
      }

      const assistantMessage = parentDocument.querySelector(
        ".mes:not(.user-mes)",
      );
      if (assistantMessage) {
        const messageBg =
          window.parent.getComputedStyle(assistantMessage).backgroundColor;
        controlBg = forceOpaqueColor(messageBg);
        controlHoverBg = darkenRgba(controlBg, 0.15);
      }

      const messageText = parentDocument.querySelector(".mes_text");
      if (messageText) {
        textColor = window.parent.getComputedStyle(messageText).color;
      }

      const messageQuote = parentDocument.querySelector(".mes_text blockquote");
      if (messageQuote) {
        quoteColor = window.parent.getComputedStyle(messageQuote).color;
      } else {
        const quote = parentDocument.querySelector("blockquote");
        if (quote) {
          quoteColor = window.parent.getComputedStyle(quote).color;
        } else {
          const cssQuoteColor = window.parent
            .getComputedStyle(parentDocument.documentElement)
            .getPropertyValue("--SmartThemeQuoteColor")
            .trim();
          if (cssQuoteColor) quoteColor = cssQuoteColor;
        }
      }

      const sendTextarea = parentDocument.querySelector("#send_textarea");
      if (sendTextarea) {
        borderColor = window.parent.getComputedStyle(sendTextarea).borderColor;
      }

      themeColors.value = {
        barBg,
        controlBg,
        controlHoverBg,
        textColor,
        borderColor,
        quoteColor,
      };
    } catch (error) {
      console.warn("[方便修改] 获取父窗口样式失败:", error);
    }
  };

  const initializeThemeObserver = () => {
    updateThemeColors();

    try {
      const debouncedUpdate = _.debounce(updateThemeColors, 250);
      themeObserver = new MutationObserver(debouncedUpdate);

      themeObserver.observe(window.parent.document.head, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
      themeObserver.observe(window.parent.document.body, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });
      themeObserver.observe(window.parent.document.documentElement, {
        attributes: true,
        attributeFilter: ["style", "class"],
      });

      const chat = window.parent.document.querySelector("#chat");
      if (chat) {
        themeObserver.observe(chat, {
          attributes: true,
          attributeFilter: ["style", "class"],
          childList: true,
        });
      }
    } catch (error) {
      console.error("[方便修改] 无法监听主题变化:", error);
    }
  };

  const disconnectThemeObserver = () => {
    themeObserver?.disconnect();
  };

  return {
    themeColors,
    initializeThemeObserver,
    disconnectThemeObserver,
    updateThemeColors,
  };
});
