export const CONSTANTS = {
  BUTTON_SIZE: 38,
  Z_INDEX: 1020,
  DEFAULT_POSITION: { right: "20px", bottom: "120px" },
  ANIMATION_DURATION: 200,
  RE_ENTRY_GUARD_DELAY: 100,
  OBSERVER_TIMEOUT: 1000,
  EDITOR_APPEAR_TIMEOUT: 5000,
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
  CLASSES: {
    BUTTON: "convenient-edit-floating-button",
  },
} as const;
