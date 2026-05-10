declare const Vue: typeof import("vue");
declare const z: typeof import("zod");
declare const $: JQueryStatic;
declare const _: typeof import("lodash");

declare function getScriptId(): string;
declare function getVariables(options: {
  type: "script";
  script_id: string;
}): Record<string, any> | undefined;
declare function insertOrAssignVariables(
  value: Record<string, any>,
  options: { type: "script"; script_id: string },
): void;

declare const tavern_events: {
  CHAT_CHANGED: string;
  MESSAGE_RECEIVED: string;
  MESSAGE_DELETED: string;
};

declare function eventOn(
  event: string,
  handler: (...args: any[]) => void,
): void;
