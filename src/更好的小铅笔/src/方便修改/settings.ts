import { defineStore } from "pinia";

const { ref, watch } = Vue;

const buttonPositionSchema = z.z.object({
  x: z.z.number().default(0),
  y: z.z.number().default(0),
});

const settingsSchema = z.z.object({
  showButton: z.z.boolean().default(true),
  buttonPosition: buttonPositionSchema.optional(),
});

export type ConvenientEditSettings = z.infer<typeof settingsSchema>;

function readScriptVariables(): unknown {
  return getVariables({ type: "script", script_id: getScriptId() }) ?? {};
}

function saveScriptVariables(value: Partial<ConvenientEditSettings>) {
  insertOrAssignVariables(value, { type: "script", script_id: getScriptId() });
}

export const useSettingsStore = defineStore("convenient-edit-settings", () => {
  const settings = ref<ConvenientEditSettings>(
    settingsSchema.parse(readScriptVariables()),
  );

  const rawVariables = readScriptVariables() as Partial<ConvenientEditSettings>;
  if (rawVariables.showButton === undefined) {
    saveScriptVariables({ showButton: settings.value.showButton });
  }

  watch(
    () => settings.value.showButton,
    (showButton) => {
      saveScriptVariables({ showButton });
    },
  );

  return { settings };
});
