import {
  createPinia as t,
  defineStore as e,
  storeToRefs as n,
} from "https://testingcf.jsdelivr.net/npm/pinia/+esm";
import { klona as o } from "https://testingcf.jsdelivr.net/npm/klona/+esm";
var r = {
    424(t, e, n) {
      function o(t, e) {
        for (var n = [], o = {}, r = 0; r < e.length; r++) {
          var i = e[r],
            s = i[0],
            a = { id: t + ":" + r, css: i[1], media: i[2], sourceMap: i[3] };
          o[s] ? o[s].parts.push(a) : n.push((o[s] = { id: s, parts: [a] }));
        }
        return n;
      }
      n.d(e, { A: () => g });
      var r = "undefined" != typeof document;
      if ("undefined" != typeof DEBUG && DEBUG && !r)
        throw new Error(
          "vue-style-loader cannot be used in a non-browser environment. Use { target: 'node' } in your Webpack config to indicate a server-rendering environment.",
        );
      var i = {},
        s = r && (document.head || document.getElementsByTagName("head")[0]),
        a = null,
        l = 0,
        c = !1,
        d = function () {},
        u = null,
        p = "data-vue-ssr-id",
        f =
          "undefined" != typeof navigator &&
          /msie [6-9]\b/.test(navigator.userAgent.toLowerCase());
      function g(t, e, n, r) {
        ((c = n), (u = r || {}));
        var s = o(t, e);
        return (
          h(s),
          function (e) {
            for (var n = [], r = 0; r < s.length; r++) {
              var a = s[r];
              ((l = i[a.id]).refs--, n.push(l));
            }
            e ? h((s = o(t, e))) : (s = []);
            for (r = 0; r < n.length; r++) {
              var l;
              if (0 === (l = n[r]).refs) {
                for (var c = 0; c < l.parts.length; c++) l.parts[c]();
                delete i[l.id];
              }
            }
          }
        );
      }
      function h(t) {
        for (var e = 0; e < t.length; e++) {
          var n = t[e],
            o = i[n.id];
          if (o) {
            o.refs++;
            for (var r = 0; r < o.parts.length; r++) o.parts[r](n.parts[r]);
            for (; r < n.parts.length; r++) o.parts.push(m(n.parts[r]));
            o.parts.length > n.parts.length &&
              (o.parts.length = n.parts.length);
          } else {
            var s = [];
            for (r = 0; r < n.parts.length; r++) s.push(m(n.parts[r]));
            i[n.id] = { id: n.id, refs: 1, parts: s };
          }
        }
      }
      function b() {
        var t = document.createElement("style");
        return ((t.type = "text/css"), s.appendChild(t), t);
      }
      function m(t) {
        var e,
          n,
          o = document.querySelector("style[" + p + '~="' + t.id + '"]');
        if (o) {
          if (c) return d;
          o.parentNode.removeChild(o);
        }
        if (f) {
          var r = l++;
          ((o = a || (a = b())),
            (e = E.bind(null, o, r, !1)),
            (n = E.bind(null, o, r, !0)));
        } else
          ((o = b()),
            (e = w.bind(null, o)),
            (n = function () {
              o.parentNode.removeChild(o);
            }));
        return (
          e(t),
          function (o) {
            if (o) {
              if (
                o.css === t.css &&
                o.media === t.media &&
                o.sourceMap === t.sourceMap
              )
                return;
              e((t = o));
            } else n();
          }
        );
      }
      var T,
        v =
          ((T = []),
          function (t, e) {
            return ((T[t] = e), T.filter(Boolean).join("\n"));
          });
      function E(t, e, n, o) {
        var r = n ? "" : o.css;
        if (t.styleSheet) t.styleSheet.cssText = v(e, r);
        else {
          var i = document.createTextNode(r),
            s = t.childNodes;
          (s[e] && t.removeChild(s[e]),
            s.length ? t.insertBefore(i, s[e]) : t.appendChild(i));
        }
      }
      function w(t, e) {
        var n = e.css,
          o = e.media,
          r = e.sourceMap;
        if (
          (o && t.setAttribute("media", o),
          u.ssrId && t.setAttribute(p, e.id),
          r &&
            ((n += "\n/*# sourceURL=" + r.sources[0] + " */"),
            (n +=
              "\n/*# sourceMappingURL=data:application/json;base64," +
              btoa(unescape(encodeURIComponent(JSON.stringify(r)))) +
              " */")),
          t.styleSheet)
        )
          t.styleSheet.cssText = n;
        else {
          for (; t.firstChild; ) t.removeChild(t.firstChild);
          t.appendChild(document.createTextNode(n));
        }
      }
    },
    492(t) {
      t.exports = function (t) {
        var e = t[1],
          n = t[3];
        if (!n) return e;
        if ("function" == typeof btoa) {
          var o = btoa(unescape(encodeURIComponent(JSON.stringify(n)))),
            r =
              "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(
                o,
              ),
            i = "/*# ".concat(r, " */");
          return [e].concat([i]).join("\n");
        }
        return [e].join("\n");
      };
    },
    502(t, e) {
      e.A = (t, e) => {
        const n = t.__vccOpts || t;
        for (const [t, o] of e) n[t] = o;
        return n;
      };
    },
    530(t, e, n) {
      (n.r(e), n.d(e, { default: () => a }));
      var o = n(492),
        r = n.n(o),
        i = n(748),
        s = n.n(i)()(r());
      s.push([
        t.id,
        ".hint[data-v-6537be84]{opacity:0.7;font-size:12px}.flex-container[data-v-6537be84]{display:flex;align-items:center;gap:8px}\n",
        "",
        {
          version: 3,
          sources: ["webpack://./src/方便修改/设置界面.vue"],
          names: [],
          mappings:
            "AA6BA,uBACC,WAAY,CACZ,cACD,CACA,iCACC,YAAa,CACb,kBAAmB,CACnB,OACD",
          sourcesContent: [
            '<template>\n\t<div class="convenient-edit-extension-settings">\n\t\t<div class="inline-drawer">\n\t\t\t<div class="inline-drawer-toggle inline-drawer-header">\n\t\t\t\t<b>{{ `✏️更好的小铅笔` }}</b>\n\t\t\t\t<div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>\n\t\t\t</div>\n\t\t\t<div class="inline-drawer-content">\n\t\t\t\t<div class="convenient-edit-extension_block flex-container">\n\t\t\t\t\t<input v-model="settings.showButton" type="checkbox" id="show-button-checkbox" />\n\t\t\t\t\t<label for="show-button-checkbox">{{ `显示悬浮编辑按钮` }}</label>\n\t\t\t\t</div>\n\t\t\t\t<hr class="sysHR" />\n\t\t\t\t<div class="hint">\n\t\t\t\t\t<span>提示：选取文本按下按钮或 F8 快捷键可定位修改，再次点击按钮或空白处可保存</span>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</template>\n\n<script setup lang="ts">\nimport { storeToRefs } from \'pinia\';\nimport { useSettingsStore } from \'./settings\';\n\nconst { settings } = storeToRefs(useSettingsStore());\n<\/script>\n\n<style scoped>\n.hint {\n\topacity: 0.7;\n\tfont-size: 12px;\n}\n.flex-container {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 8px;\n}\n</style>\n\n\n',
          ],
          sourceRoot: "",
        },
      ]);
      const a = s;
    },
    739(t, e, n) {
      var o = n(530);
      (o.__esModule && (o = o.default),
        "string" == typeof o && (o = [[t.id, o, ""]]),
        o.locals && (t.exports = o.locals));
      (0, n(424).A)("1b869912", o, !1, { ssrId: !0 });
    },
    748(t) {
      t.exports = function (t) {
        var e = [];
        return (
          (e.toString = function () {
            return this.map(function (e) {
              var n = "",
                o = void 0 !== e[5];
              return (
                e[4] && (n += "@supports (".concat(e[4], ") {")),
                e[2] && (n += "@media ".concat(e[2], " {")),
                o &&
                  (n += "@layer".concat(
                    e[5].length > 0 ? " ".concat(e[5]) : "",
                    " {",
                  )),
                (n += t(e)),
                o && (n += "}"),
                e[2] && (n += "}"),
                e[4] && (n += "}"),
                n
              );
            }).join("");
          }),
          (e.i = function (t, n, o, r, i) {
            "string" == typeof t && (t = [[null, t, void 0]]);
            var s = {};
            if (o)
              for (var a = 0; a < this.length; a++) {
                var l = this[a][0];
                null != l && (s[l] = !0);
              }
            for (var c = 0; c < t.length; c++) {
              var d = [].concat(t[c]);
              (o && s[d[0]]) ||
                (void 0 !== i &&
                  (void 0 === d[5] ||
                    (d[1] = "@layer"
                      .concat(d[5].length > 0 ? " ".concat(d[5]) : "", " {")
                      .concat(d[1], "}")),
                  (d[5] = i)),
                n &&
                  (d[2]
                    ? ((d[1] = "@media ".concat(d[2], " {").concat(d[1], "}")),
                      (d[2] = n))
                    : (d[2] = n)),
                r &&
                  (d[4]
                    ? ((d[1] = "@supports ("
                        .concat(d[4], ") {")
                        .concat(d[1], "}")),
                      (d[4] = r))
                    : (d[4] = "".concat(r))),
                e.push(d));
            }
          }),
          e
        );
      };
    },
  },
  i = {};
function s(t) {
  var e = i[t];
  if (void 0 !== e) return e.exports;
  var n = (i[t] = { id: t, exports: {} });
  return (r[t](n, n.exports, s), n.exports);
}
((s.n = (t) => {
  var e = t && t.__esModule ? () => t.default : () => t;
  return (s.d(e, { a: e }), e);
}),
  (s.d = (t, e) => {
    for (var n in e)
      s.o(e, n) &&
        !s.o(t, n) &&
        Object.defineProperty(t, n, { enumerable: !0, get: e[n] });
  }),
  (s.o = (t, e) => Object.prototype.hasOwnProperty.call(t, e)),
  (s.r = (t) => {
    ("undefined" != typeof Symbol &&
      Symbol.toStringTag &&
      Object.defineProperty(t, Symbol.toStringTag, { value: "Module" }),
      Object.defineProperty(t, "__esModule", { value: !0 }));
  }));
const a = z,
  l = Vue,
  c = a.z.object({ x: a.z.number().default(0), y: a.z.number().default(0) }),
  d = a.z.object({
    showButton: a.z.boolean().default(!0),
    buttonPosition: c.optional(),
  }),
  u = e("convenient-edit-settings", () => {
    const t = (0, l.ref)(
      d.parse(getVariables({ type: "script", script_id: getScriptId() }) ?? {}),
    );
    return (
      void 0 ===
        (getVariables({ type: "script", script_id: getScriptId() }) ?? {})
          .showButton &&
        insertOrAssignVariables(
          { showButton: t.value.showButton },
          { type: "script", script_id: getScriptId() },
        ),
      (0, l.watch)(
        () => t.value.showButton,
        (t) => {
          insertOrAssignVariables(
            { showButton: t },
            { type: "script", script_id: getScriptId() },
          );
        },
      ),
      { settings: t }
    );
  }),
  p = $;
var f = s.n(p);
const g = _,
  h = e("convenient_edit_theme", () => {
    const t = (0, l.ref)({
      barBg: "rgba(30, 30, 40, 0.9)",
      controlBg: "rgba(45, 55, 72, 0.8)",
      controlHoverBg: "rgba(35, 45, 62, 0.8)",
      textColor: "#e2e8f0",
      borderColor: "#718096",
      quoteColor: "#9ca3af",
    });
    let e = null;
    const n = (t, e) => {
        if (!t || "transparent" === t) return "rgba(0, 0, 0, 1)";
        try {
          if (t.startsWith("rgba")) {
            const e = t
              .substring(t.indexOf("(") + 1, t.lastIndexOf(")"))
              .split(",");
            if (e.length >= 3)
              return `rgba(${e[0].trim()}, ${e[1].trim()}, ${e[2].trim()}, 1)`;
          }
        } catch (t) {}
        return t;
      },
      o = () => {
        try {
          const e = window.parent.document;
          let o = "rgba(30, 30, 40, 0.9)",
            r = "rgba(45, 55, 72, 0.8)",
            i = "rgba(35, 45, 62, 0.8)",
            s = "#e2e8f0",
            a = "#718096",
            l = "#9ca3af";
          const c = (() => {
            const t = f()(window.parent.document),
              e = [".simplebar-content-wrapper", "#chat"];
            for (const n of e) {
              const e = t.find(n);
              if (e.length > 0) return e.first();
            }
            return null;
          })();
          if (c) {
            let t = window.parent.getComputedStyle(c[0]).backgroundColor;
            ("rgba(0, 0, 0, 0)" !== t && "transparent" !== t) ||
              (t = window.parent.getComputedStyle(e.body).backgroundColor);
            const r = e.querySelector("#top-bar");
            if (r) {
              const e = window.parent.getComputedStyle(r).backgroundColor;
              o = n("rgba(0, 0, 0, 0)" !== e && "transparent" !== e ? e : t);
            } else o = n(t);
          }
          const d = e.querySelector(".mes:not(.user-mes)");
          if (d) {
            const t = window.parent.getComputedStyle(d).backgroundColor;
            ((r = n(t)),
              (i = ((t, e) => {
                try {
                  if (t.startsWith("rgba")) {
                    const n = t
                      .substring(t.indexOf("(") + 1, t.lastIndexOf(")"))
                      .split(",");
                    if (n.length >= 3) {
                      let t = parseInt(n[0].trim(), 10),
                        o = parseInt(n[1].trim(), 10),
                        r = parseInt(n[2].trim(), 10);
                      const i = n.length > 3 ? parseFloat(n[3].trim()) : 1;
                      return (
                        (t = Math.max(0, t - t * e)),
                        (o = Math.max(0, o - o * e)),
                        (r = Math.max(0, r - r * e)),
                        `rgba(${Math.round(t)}, ${Math.round(o)}, ${Math.round(r)}, ${i})`
                      );
                    }
                  }
                } catch (t) {}
                return t;
              })(r, 0.15)));
          }
          const u = e.querySelector(".mes_text");
          if (u) {
            s = window.parent.getComputedStyle(u).color;
          }
          const p = e.querySelector(".mes_text blockquote");
          if (p) l = window.parent.getComputedStyle(p).color;
          else {
            const t = e.querySelector("blockquote");
            if (t) l = window.parent.getComputedStyle(t).color;
            else {
              const t = window.parent
                .getComputedStyle(e.documentElement)
                .getPropertyValue("--SmartThemeQuoteColor")
                .trim();
              t && (l = t);
            }
          }
          const g = e.querySelector("#send_textarea");
          (g && (a = window.parent.getComputedStyle(g).borderColor),
            (t.value = {
              barBg: o,
              controlBg: r,
              controlHoverBg: i,
              textColor: s,
              borderColor: a,
              quoteColor: l,
            }));
        } catch (t) {
          console.warn("[方便修改] 获取父窗口样式失败:", t);
        }
      };
    return {
      themeColors: t,
      initializeThemeObserver: () => {
        o();
        try {
          const t = (0, g.debounce)(o, 250);
          ((e = new MutationObserver(t)),
            e.observe(window.parent.document.head, {
              childList: !0,
              subtree: !0,
              attributes: !0,
              characterData: !0,
            }),
            e.observe(window.parent.document.body, {
              attributes: !0,
              attributeFilter: ["class", "style"],
            }),
            e.observe(window.parent.document.documentElement, {
              attributes: !0,
              attributeFilter: ["style", "class"],
            }));
          const n = window.parent.document.querySelector("#chat");
          n &&
            e.observe(n, {
              attributes: !0,
              attributeFilter: ["style", "class"],
              childList: !0,
            });
        } catch (t) {
          console.error("[方便修改] 无法监听主题变化:", t);
        }
      },
      disconnectThemeObserver: () => {
        e?.disconnect();
      },
      updateThemeColors: o,
    };
  }),
  b = {
    BUTTON_SIZE: 38,
    Z_INDEX: 1020,
    DEFAULT_POSITION: { right: "20px", bottom: "120px" },
    ANIMATION_DURATION: 200,
    RE_ENTRY_GUARD_DELAY: 100,
    OBSERVER_TIMEOUT: 1e3,
    EDITOR_APPEAR_TIMEOUT: 5e3,
    SCROLL_INTO_VIEW_OFFSET: 120,
    EDITOR_SCROLL_ALIGNMENT_RATIO: 0.3,
    SELECTORS: {
      MESSAGE: ".mes",
      EDIT_BUTTONS: [".mes_edit", ".fa-edit", ".fa-pencil"],
      DONE_BUTTON: ".mes_edit_done",
      EDITOR: 'textarea:visible, [contenteditable="true"]:visible',
      ST_EDITOR_TEXTAREA: "#curEditTextarea",
      SCROLL_CONTAINERS: [".simplebar-content-wrapper", "#chat"],
    },
    ATTRIBUTES: {
      SCRIPT_ID: "script_id",
      TEMP_TARGET: "data-convenient-edit-target",
    },
    CLASSES: { BUTTON: "convenient-edit-floating-button" },
  };
let m = null,
  T = !1,
  v = !1,
  E = null,
  w = null,
  S = null,
  x = null,
  y = null;
function C() {
  try {
    return h().themeColors;
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
function O() {
  if (m) return;
  const t = h();
  t.initializeThemeObserver();
  const e = C(),
    n = (getVariables({ type: "script", script_id: getScriptId() }) ?? {})
      .buttonPosition,
    r = n && (n.x > 0 || n.y > 0),
    i = b.BUTTON_SIZE - 4;
  ((m = $("<div>")
    .attr(b.ATTRIBUTES.SCRIPT_ID, getScriptId())
    .addClass(b.CLASSES.BUTTON)
    .css({
      position: "fixed",
      zIndex: b.Z_INDEX,
      width: `${b.BUTTON_SIZE}px`,
      height: `${b.BUTTON_SIZE}px`,
      cursor: "pointer",
      userSelect: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...(r ? { left: `${n.x}px`, top: `${n.y}px` } : b.DEFAULT_POSITION),
    })
    .html(
      `\n      <div class="ball-inner" style="\n        position: relative;\n        width: ${i}px;\n        height: ${i}px;\n        background: linear-gradient(145deg, ${e.controlBg}, ${e.barBg});\n        border-radius: 50%;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        border: 1px solid ${e.borderColor};\n        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);\n        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n        z-index: 2;\n      ">\n        <i class="fa-solid fa-pencil" style="\n          font-size: 14px;\n          color: ${e.textColor};\n          transition: all 0.3s ease;\n          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));\n        "></i>\n      </div>\n      <div class="ball-ring" style="\n        position: absolute;\n        width: ${b.BUTTON_SIZE}px;\n        height: ${b.BUTTON_SIZE}px;\n        border-radius: 50%;\n        transition: all 0.3s ease;\n        z-index: 1;\n      "></div>\n      <div class="ball-pulse" style="\n        position: absolute;\n        width: ${i}px;\n        height: ${i}px;\n        border-radius: 50%;\n        background: ${e.quoteColor};\n        opacity: 0;\n        z-index: 0;\n        pointer-events: none;\n      "></div>\n    `,
    )),
    m
      .find(".ball-ring")
      .css({ border: `2px solid ${e.borderColor}`, opacity: 0.4 }),
    m
      .on("mousedown", (t) => {
        (t.stopPropagation(), (T = !1));
      })
      .on("mouseup", () => {
        T || R();
      })
      .on("mouseenter", function () {
        const t = $(this).find(".ball-inner"),
          e = $(this).find(".ball-ring"),
          n = $(this).find(".ball-inner i"),
          o = C();
        (t.css({
          transform: "scale(1.08)",
          boxShadow:
            "0 6px 20px rgba(0, 0, 0, 0.35), 0 3px 6px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
          background: `linear-gradient(145deg, ${o.controlHoverBg}, ${o.controlBg})`,
        }),
          e.css({
            opacity: 0.7,
            transform: "scale(1.1)",
            borderColor: o.quoteColor,
          }),
          n.css({ transform: "scale(1.1)", color: o.quoteColor }));
      })
      .on("mouseleave", function () {
        const t = $(this).find(".ball-inner"),
          e = $(this).find(".ball-ring"),
          n = $(this).find(".ball-inner i"),
          o = C();
        (t.css({
          transform: "scale(1)",
          boxShadow:
            "0 4px 15px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          background: `linear-gradient(145deg, ${o.controlBg}, ${o.barBg})`,
        }),
          e.css({
            opacity: 0.4,
            transform: "scale(1)",
            borderColor: o.borderColor,
          }),
          n.css({ transform: "scale(1)", color: o.textColor }));
      }),
    $(window.parent.document.body).append(m),
    (0, l.watch)(
      () => t.themeColors,
      () => {
        !(function () {
          if (!m) return;
          const t = C(),
            e = m.find(".ball-inner"),
            n = m.find(".ball-ring"),
            o = m.find(".ball-inner i"),
            r = m.find(".ball-pulse");
          (e.css({
            background: `linear-gradient(145deg, ${t.controlBg}, ${t.barBg})`,
            borderColor: t.borderColor,
          }),
            n.css({ borderColor: t.borderColor }),
            o.css({ color: t.textColor }),
            r.css({ background: t.quoteColor }));
        })();
      },
      { deep: !0 },
    ));
  try {
    let t, e, n, r;
    m.draggable({
      scroll: !1,
      start: () => {
        ((T = !0),
          m &&
            ((t = m.outerWidth() ?? 0),
            (e = m.outerHeight() ?? 0),
            (n = window.parent.innerWidth),
            (r = window.parent.innerHeight)));
      },
      drag: (o, i) => {
        (i.position.left < 0 && (i.position.left = 0),
          i.position.top < 0 && (i.position.top = 0),
          i.position.left + t > n && (i.position.left = n - t),
          i.position.top + e > r && (i.position.top = r - e));
      },
      stop: (t, e) => {
        const n = {
          x: Math.round(e.position.left),
          y: Math.round(e.position.top),
        };
        insertOrAssignVariables(
          { buttonPosition: o(n) },
          { type: "script", script_id: getScriptId() },
        );
      },
    });
  } catch (t) {
    console.error(
      "[Convenient Edit] Draggable feature failed to initialize.",
      t,
    );
  }
}
function A() {
  if (m) {
    try {
      m.draggable?.("destroy");
      h().disconnectThemeObserver();
    } catch (t) {}
    (m.off("mouseenter mouseleave"), m.remove(), (m = null));
  }
}
function R() {
  if (!v) {
    v = !0;
    try {
      const { target: t, selectedText: e } = (function () {
        const t = $(window.parent.document).find(
          b.SELECTORS.ST_EDITOR_TEXTAREA,
        );
        if (t.length > 0)
          return { target: t.closest(b.SELECTORS.MESSAGE), selectedText: "" };
        const e = window.parent.getSelection();
        if (e && !e.isCollapsed && e.rangeCount > 0) {
          const t = e.getRangeAt(0).commonAncestorContainer,
            n = t.nodeType === Node.TEXT_NODE ? t.parentElement : t;
          if (n) {
            const t = $(n).closest(b.SELECTORS.MESSAGE);
            if (t.length > 0) return { target: t, selectedText: e.toString() };
          }
        }
        return { target: y ? $(y) : null, selectedText: "" };
      })();
      if (!t) return;
      if (M(t)) B(t);
      else {
        const n = L();
        (n && (E = n[0].scrollTop),
          t.attr(b.ATTRIBUTES.TEMP_TARGET, "true"),
          !(function (t, e) {
            for (const n of e) {
              const e = t.find(n).filter(":visible").first();
              if (e.length > 0) return (e.trigger("click"), !0);
            }
            return !1;
          })(t, b.SELECTORS.EDIT_BUTTONS)
            ? (t.removeAttr(b.ATTRIBUTES.TEMP_TARGET), (E = null))
            : (function (t, e) {
                const n = $(window.parent.document).find(t);
                if (!n.length) return;
                const o = (t) => {
                    (t?.disconnect(),
                      clearTimeout(a),
                      n.removeAttr(b.ATTRIBUTES.TEMP_TARGET));
                  },
                  r = () => {
                    const t = $(window.parent.document).find(
                      b.SELECTORS.ST_EDITOR_TEXTAREA,
                    );
                    if (t.length > 0 && t.is(":visible")) return t[0];
                    const e = n.find(".mes_text");
                    if (e.length > 0) {
                      const t = e
                        .find(
                          'textarea:visible, [contenteditable="true"]:visible',
                        )
                        .first();
                      if (t.length > 0) return t[0];
                    }
                    const o = n.find(b.SELECTORS.EDITOR).first();
                    return o.length > 0 ? o[0] : null;
                  },
                  i = (t) => {
                    (!(function (t) {
                      const e = L();
                      if (!t || !e) return;
                      const n = e[0],
                        o = $(t),
                        r = o.offset()?.top || 0,
                        i = e.offset()?.top || 0,
                        s = r - i,
                        a = n.scrollTop + s - b.SCROLL_INTO_VIEW_OFFSET;
                      e.stop(!0).scrollTop(a);
                    })(t),
                      requestAnimationFrame(() => {
                        const n = e.trim();
                        if (n.length > 0) {
                          const e = (function (t, e) {
                            const n = "TEXTAREA" === t.tagName,
                              o = n ? t.value : (t.textContent ?? ""),
                              r = e.trim();
                            if (!r) return !1;
                            const i = (function (t, e) {
                              const n = (t) =>
                                  t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                                o = n(e).replace(/\s+/g, "\\s+"),
                                r = t.match(new RegExp(o, "i"));
                              if (r) return r;
                              const i = "[*_~`]*",
                                s = [...e],
                                a =
                                  i +
                                  s
                                    .map((t) =>
                                      /\s/.test(t) ? i + "\\s+" + i : n(t) + i,
                                    )
                                    .join(""),
                                l = t.match(new RegExp(a, "i"));
                              if (l) return l;
                              const c = e.replace(/[*_~`]/g, "");
                              if (c && c !== e) {
                                const e = n(c).replace(/\s+/g, "\\s+"),
                                  o = t.match(new RegExp(e, "i"));
                                if (o) return o;
                              }
                              return null;
                            })(o, r);
                            if (!i || void 0 === i.index) return !1;
                            const s = i.index,
                              a = i[0],
                              l = s + a.length;
                            if (n) {
                              const e = t;
                              (e.focus(),
                                e.setSelectionRange(s, l),
                                (function (t) {
                                  try {
                                    const e = getComputedStyle(t),
                                      n =
                                        (S ||
                                          ((S =
                                            window.parent.document.createElement(
                                              "div",
                                            )),
                                          (S.style.cssText =
                                            "\n      position: absolute;\n      visibility: hidden;\n      pointer-events: none;\n      box-sizing: border-box;\n      left: -9999px;\n      top: -9999px;\n    "),
                                          window.parent.document.body.appendChild(
                                            S,
                                          )),
                                        S);
                                    ((n.style.width = `${t.clientWidth}px`),
                                      (n.style.padding = `${e.paddingTop} ${e.paddingRight} ${e.paddingBottom} ${e.paddingLeft}`),
                                      (n.style.font = e.font),
                                      (n.style.fontSize = e.fontSize),
                                      (n.style.fontFamily = e.fontFamily),
                                      (n.style.fontWeight = e.fontWeight),
                                      (n.style.lineHeight = e.lineHeight),
                                      (n.style.whiteSpace =
                                        e.whiteSpace || "pre-wrap"),
                                      (n.style.wordWrap =
                                        e.wordWrap || "break-word"),
                                      (n.style.wordBreak =
                                        e.wordBreak || "break-word"),
                                      (n.style.overflowWrap =
                                        e.overflowWrap || "break-word"));
                                    const o = t.value.substring(
                                      0,
                                      t.selectionStart,
                                    );
                                    n.textContent = o;
                                    const r = n.offsetHeight,
                                      i = parseFloat(e.lineHeight) || 20;
                                    let s =
                                      r +
                                      i / 2 -
                                      t.clientHeight *
                                        b.EDITOR_SCROLL_ALIGNMENT_RATIO;
                                    s = Math.max(0, s);
                                    const a = t.scrollHeight - t.clientHeight;
                                    ((s = Math.min(a, s)),
                                      $(t)
                                        .stop(!0)
                                        .animate(
                                          { scrollTop: s },
                                          b.ANIMATION_DURATION,
                                        ));
                                  } catch (t) {
                                    console.error(
                                      "[Convenient Edit] Error in scrollTextareaToMatch:",
                                      t,
                                    );
                                  }
                                })(e));
                            } else {
                              const e = window.parent.document.createRange(),
                                [n, o] = U(t, s),
                                [r, i] = U(t, l);
                              if (!n || !r) return !1;
                              (e.setStart(n, o), e.setEnd(r, i));
                              const a = window.parent.getSelection();
                              (a && (a.removeAllRanges(), a.addRange(e)),
                                t.focus(),
                                (function (t, e) {
                                  try {
                                    const n = e.getBoundingClientRect(),
                                      o = t.getBoundingClientRect(),
                                      r = n.top + n.height / 2,
                                      i = o.top;
                                    let s =
                                      r -
                                      i -
                                      t.clientHeight *
                                        b.EDITOR_SCROLL_ALIGNMENT_RATIO;
                                    s = Math.max(0, s);
                                    const a = t.scrollHeight - t.clientHeight;
                                    ((s = Math.min(a, s)),
                                      $(t)
                                        .stop(!0)
                                        .animate(
                                          { scrollTop: s },
                                          b.ANIMATION_DURATION,
                                        ));
                                  } catch (t) {
                                    console.error(
                                      "[Convenient Edit] Error in scrollContentEditableToMatch:",
                                      t,
                                    );
                                  }
                                })(t, e));
                            }
                            return !0;
                          })(t, n);
                          e || (t.focus(), (t.scrollTop = 0));
                        } else (t.focus(), (t.scrollTop = 0));
                      }));
                  },
                  s = new MutationObserver((t) => {
                    for (const e of t)
                      if ("childList" === e.type && e.addedNodes.length > 0) {
                        const t = r();
                        if (t) return (o(s), void i(t));
                      }
                  }),
                  a = setTimeout(() => {
                    const t = r();
                    (t && i(t), o(s));
                  }, b.EDITOR_APPEAR_TIMEOUT);
                s.observe(n[0], { childList: !0, subtree: !0 });
                const l = r();
                l && (o(s), i(l));
              })(`[${b.ATTRIBUTES.TEMP_TARGET}="true"]`, e));
      }
    } finally {
      setTimeout(() => {
        v = !1;
      }, b.RE_ENTRY_GUARD_DELAY);
    }
  }
}
function I(t) {
  "F8" === t.key && (t.preventDefault(), setTimeout(R, 0));
}
function N(t) {
  const e = $(window.parent.document).find(b.SELECTORS.ST_EDITOR_TEXTAREA);
  if (!e.length) return;
  const n = t.target,
    o = $(n),
    r = e.closest(b.SELECTORS.MESSAGE);
  o.hasClass(b.SELECTORS.DONE_BUTTON.substring(1)) ||
    (r.length > 0 && r[0].contains(n)) ||
    (m && m[0].contains(n)) ||
    B(r);
}
function B(t) {
  const e = t.find(b.SELECTORS.DONE_BUTTON);
  e.length
    ? setTimeout(() => {
        if ((e.trigger("click"), null === E)) return;
        const n = E;
        E = null;
        const o = L();
        if (!o) return;
        const r = new MutationObserver((e, r) => {
            M(t) ||
              (o.stop(!0).animate({ scrollTop: n }, b.ANIMATION_DURATION),
              r.disconnect(),
              clearTimeout(i));
          }),
          i = setTimeout(() => {
            (r.disconnect(),
              M(t) ||
                o.stop(!0).animate({ scrollTop: n }, b.ANIMATION_DURATION));
          }, b.OBSERVER_TIMEOUT);
        r.observe(t[0], { childList: !0, subtree: !0 });
      }, 10)
    : (E = null);
}
function M(t) {
  return t.find(b.SELECTORS.EDITOR).length > 0;
}
function L() {
  if (w && w.closest("body").length) return w;
  const t = $(window.parent.document);
  for (const e of b.SELECTORS.SCROLL_CONTAINERS) {
    const n = t.find(e);
    if (n.length > 0) return ((w = n.first()), w);
  }
  const e = t
    .find("div")
    .filter((t, e) => {
      const n = $(e).css("overflow-y");
      return (
        ("auto" === n || "scroll" === n) &&
        e.scrollHeight > e.clientHeight &&
        $(e).find(b.SELECTORS.MESSAGE).length > 0
      );
    })
    .first();
  return e.length > 0 ? ((w = e), w) : null;
}
function D() {
  const t = L();
  if (!t) return void setTimeout(D, 500);
  const e = new Map();
  x = new IntersectionObserver(
    (t) => {
      t.forEach((t) => {
        t.isIntersecting
          ? e.set(t.target, t.intersectionRatio)
          : e.delete(t.target);
      });
      let n = 0;
      y = null;
      for (const [t, o] of e.entries()) o > n && ((n = o), (y = t));
    },
    { root: t[0], rootMargin: "0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
  );
  const n = () => {
    const t = $(window.parent.document).find(b.SELECTORS.MESSAGE);
    (x?.disconnect(), t.each((t, e) => x?.observe(e)));
  };
  (n(),
    eventOn(tavern_events.CHAT_CHANGED, () => setTimeout(n, 200)),
    eventOn(tavern_events.MESSAGE_RECEIVED, () => setTimeout(n, 200)),
    eventOn(tavern_events.MESSAGE_DELETED, () => setTimeout(n, 200)));
}
function U(t, e) {
  let n = 0;
  const o = window.parent.document.createTreeWalker(
    t,
    NodeFilter.SHOW_TEXT,
    null,
  );
  let r = o.nextNode();
  for (; r; ) {
    const t = r.textContent?.length ?? 0;
    if (n + t >= e) return [r, Math.max(0, e - n)];
    ((n += t), (r = o.nextNode()));
  }
  return [null, 0];
}
$(() => {
  const t = u(),
    { settings: e } = n(t);
  (e.value.showButton && O(),
    $(window.parent.document).on("mousedown", N),
    $(window.parent.document).on("keydown", I),
    D(),
    (0, l.watch)(
      e,
      (t, e) => {
        t.showButton !== e.showButton && (t.showButton ? O() : A());
      },
      { deep: !0 },
    ),
    $(window).on("pagehide", () => {
      (S && S.parentNode && S.parentNode.removeChild(S),
        (S = null),
        x?.disconnect(),
        (x = null),
        A(),
        $(window.parent.document).off("mousedown", N),
        $(window.parent.document).off("keydown", I));
    }));
});
const k = { class: "convenient-edit-extension-settings" },
  V = { class: "inline-drawer" },
  H = { class: "inline-drawer-content" },
  P = { class: "convenient-edit-extension_block flex-container" },
  G = (0, l.defineComponent)({
    __name: "设置界面",
    setup(t) {
      const { settings: e } = n(u());
      return (t, n) => (
        (0, l.openBlock)(),
        (0, l.createElementBlock)("div", k, [
          (0, l.createElementVNode)("div", V, [
            n[4] ||
              (n[4] = (0, l.createElementVNode)(
                "div",
                { class: "inline-drawer-toggle inline-drawer-header" },
                [
                  (0, l.createElementVNode)(
                    "b",
                    null,
                    (0, l.toDisplayString)("✏️更好的小铅笔"),
                  ),
                  (0, l.createElementVNode)("div", {
                    class:
                      "inline-drawer-icon fa-solid fa-circle-chevron-down down",
                  }),
                ],
                -1,
              )),
            (0, l.createElementVNode)("div", H, [
              (0, l.createElementVNode)("div", P, [
                (0, l.withDirectives)(
                  (0, l.createElementVNode)(
                    "input",
                    {
                      "onUpdate:modelValue":
                        n[0] ||
                        (n[0] = (t) => ((0, l.unref)(e).showButton = t)),
                      type: "checkbox",
                      id: "show-button-checkbox",
                    },
                    null,
                    512,
                  ),
                  [[l.vModelCheckbox, (0, l.unref)(e).showButton]],
                ),
                n[1] ||
                  (n[1] = (0, l.createElementVNode)(
                    "label",
                    { for: "show-button-checkbox" },
                    (0, l.toDisplayString)("显示悬浮编辑按钮"),
                    -1,
                  )),
              ]),
              n[2] ||
                (n[2] = (0, l.createElementVNode)(
                  "hr",
                  { class: "sysHR" },
                  null,
                  -1,
                )),
              n[3] ||
                (n[3] = (0, l.createElementVNode)(
                  "div",
                  { class: "hint" },
                  [
                    (0, l.createElementVNode)(
                      "span",
                      null,
                      "提示：选取文本按下按钮或 F8 快捷键可定位修改，再次点击按钮或空白处可保存",
                    ),
                  ],
                  -1,
                )),
            ]),
          ]),
        ])
      );
    },
  });
s(739);
const q = (0, s(502).A)(G, [["__scopeId", "data-v-6537be84"]]),
  F = (0, l.createApp)(q).use(t());
($(() => {
  const t = $("<div>").attr("script_id", getScriptId());
  ($("#extensions_settings2").append(t),
    (function () {
      if ($(`head > div[script_id="${getScriptId()}"]`).length > 0) return;
      const t = $("<div>")
        .attr("script_id", getScriptId())
        .append($("head > style", document).clone());
      $("head").append(t);
    })(),
    F.mount(t[0]));
}),
  $(window).on("pagehide", () => {
    (F.unmount(),
      $(`head > div[script_id="${getScriptId()}"]`).remove(),
      $(`div[script_id="${getScriptId()}"]`).remove());
  }));
//# sourceMappingURL=index.js.map
