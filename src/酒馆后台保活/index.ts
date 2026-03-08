const KEEPALIVE_LOG_PREFIX = '[后台保活]';
const DEFAULT_MEDIA_KEEPALIVE_URL = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

const KeepaliveSettingsSchema = z
  .object({
    enabled: z.boolean().prefault(true),
    mode: z.enum(['safe', 'balanced', 'strong']).prefault('balanced'),
    heartbeatIntervalMs: z.coerce.number().transform(value => _.clamp(Math.round(value), 3_000, 300_000)).prefault(15_000),
    idleThresholdMs: z.coerce.number().transform(value => _.clamp(Math.round(value), 15_000, 600_000)).prefault(45_000),
    maxConsecutiveFailures: z.coerce.number().transform(value => _.clamp(Math.round(value), 1, 20)).prefault(3),
    recoverCooldownMs: z.coerce.number().transform(value => _.clamp(Math.round(value), 30_000, 600_000)).prefault(180_000),
    debugLog: z.boolean().prefault(false),
    notifyOnRecover: z.boolean().prefault(true),
    mediaBoostEnabled: z.boolean().prefault(false),
    mediaChannel: z.enum(['ambient', 'bgm']).prefault('ambient'),
    mediaKeepaliveUrl: z
      .string()
      .transform(value => value.trim() || DEFAULT_MEDIA_KEEPALIVE_URL)
      .prefault(DEFAULT_MEDIA_KEEPALIVE_URL),
    mediaVolume: z.coerce.number().transform(value => _.clamp(Math.round(value), 0, 100)).prefault(0),
  })
  .prefault({});

type KeepaliveSettings = z.infer<typeof KeepaliveSettingsSchema>;

type ScriptVariableOption = {
  type: 'script';
  script_id: string;
};

type MediaSnapshot = {
  settings: AudioSettings;
  list: Audio[];
};

type RuntimeState = {
  scriptVariableOption: ScriptVariableOption;
  keepaliveAudioTitle: string;
  settings: KeepaliveSettings;
  lastAliveTs: number;
  lastProbeTs: number;
  lastRecoverTs: number;
  lastNotifyTs: number;
  consecutiveFailures: number;
  isGenerating: boolean;
  isBackground: boolean;
  currentIntervalMs: number;
  timer: number | null;
  eventStops: EventOnReturn[];
  mediaBoostActive: boolean;
  mediaSnapshot: MediaSnapshot | null;
  disposed: boolean;
  visibilityHandler: (() => void) | null;
};

$(() => {
  errorCatched(init)();
});

function init(): void {
  const scriptId = getScriptId();
  const scriptVariableOption: ScriptVariableOption = {
    type: 'script',
    script_id: scriptId,
  };

  const settings = loadSettings(scriptVariableOption);
  if (!settings.enabled) {
    logInfo('脚本已禁用，跳过初始化');
    return;
  }

  const now = Date.now();
  const state: RuntimeState = {
    scriptVariableOption,
    keepaliveAudioTitle: `[后台保活] ${scriptId}`,
    settings,
    lastAliveTs: now,
    lastProbeTs: now,
    lastRecoverTs: 0,
    lastNotifyTs: 0,
    consecutiveFailures: 0,
    isGenerating: false,
    isBackground: document.visibilityState === 'hidden',
    currentIntervalMs: getBaseIntervalMs(settings),
    timer: null,
    eventStops: [],
    mediaBoostActive: false,
    mediaSnapshot: null,
    disposed: false,
    visibilityHandler: null,
  };

  bindHeartbeatEvents(state);
  bindVisibilityEvents(state);
  restartTimer(state, state.currentIntervalMs);

  if (state.settings.mediaBoostEnabled && state.isBackground) {
    ensureMediaBoost(state, 'init');
  }

  logInfo('后台保活已启动', {
    mode: state.settings.mode,
    intervalMs: state.currentIntervalMs,
    idleThresholdMs: getIdleThresholdMs(state.settings),
    mediaBoostEnabled: state.settings.mediaBoostEnabled,
    mediaChannel: state.settings.mediaChannel,
  });

  $(window).on('pagehide', () => {
    dispose(state, 'pagehide');
  });
}

function loadSettings(scriptVariableOption: ScriptVariableOption): KeepaliveSettings {
  const settings = KeepaliveSettingsSchema.parse(getVariables(scriptVariableOption));
  insertOrAssignVariables(settings as Record<string, any>, scriptVariableOption);
  return settings;
}

function bindHeartbeatEvents(state: RuntimeState): void {
  clearHeartbeatEvents(state);

  state.eventStops.push(
    eventOn(tavern_events.APP_READY, () => {
      touch(state, 'app_ready');
    }),
  );

  state.eventStops.push(
    eventOn(tavern_events.MESSAGE_SENT, () => {
      touch(state, 'message_sent');
    }),
  );

  state.eventStops.push(
    eventOn(tavern_events.MESSAGE_RECEIVED, () => {
      touch(state, 'message_received');
    }),
  );

  state.eventStops.push(
    eventOn(tavern_events.MESSAGE_UPDATED, () => {
      touch(state, 'message_updated');
    }),
  );

  state.eventStops.push(
    eventOn(tavern_events.CHAT_CHANGED, () => {
      touch(state, 'chat_changed');
    }),
  );

  state.eventStops.push(
    eventOn(tavern_events.GENERATION_STARTED, () => {
      state.isGenerating = true;
      touch(state, 'generation_started');
    }),
  );

  state.eventStops.push(
    eventOn(tavern_events.GENERATION_ENDED, () => {
      state.isGenerating = false;
      touch(state, 'generation_ended');
    }),
  );

  state.eventStops.push(
    eventOn(tavern_events.GENERATION_STOPPED, () => {
      state.isGenerating = false;
      touch(state, 'generation_stopped');
    }),
  );
}

function clearHeartbeatEvents(state: RuntimeState): void {
  state.eventStops.forEach(handler => {
    try {
      handler.stop();
    } catch (error) {
      logWarn('取消事件监听失败', { error: toErrorMessage(error) });
    }
  });
  state.eventStops = [];
}

function bindVisibilityEvents(state: RuntimeState): void {
  const handler = () => {
    if (state.disposed) return;

    state.isBackground = document.visibilityState === 'hidden';
    touch(state, state.isBackground ? 'visibility_hidden' : 'visibility_visible');

    if (!state.settings.mediaBoostEnabled) return;

    if (state.isBackground) {
      ensureMediaBoost(state, 'visibility_hidden');
      return;
    }

    disableMediaBoost(state, 'visibility_visible');
  };

  state.visibilityHandler = handler;
  $(document).on('visibilitychange', handler);
}

function unbindVisibilityEvents(state: RuntimeState): void {
  if (!state.visibilityHandler) return;

  $(document).off('visibilitychange', state.visibilityHandler);
  state.visibilityHandler = null;
}

function restartTimer(state: RuntimeState, intervalMs: number): void {
  if (state.timer !== null) {
    clearInterval(state.timer);
  }

  state.currentIntervalMs = intervalMs;
  state.timer = window.setInterval(() => {
    onTimerTick(state);
  }, intervalMs);

  logDebug(state, '巡检定时器已重启', { intervalMs });
}

function onTimerTick(state: RuntimeState): void {
  if (state.disposed) return;

  try {
    state.isBackground = document.visibilityState === 'hidden';

    if (state.settings.mediaBoostEnabled) {
      if (state.isBackground) {
        ensureMediaBoost(state, 'timer_tick');
      } else {
        disableMediaBoost(state, 'timer_visible');
      }
    }

    const idleMs = Date.now() - state.lastAliveTs;
    if (idleMs < getIdleThresholdMs(state.settings)) {
      maybeRestoreBaseInterval(state);
      return;
    }

    const probeSuccess = runLightProbe(state, idleMs);
    if (probeSuccess) {
      state.consecutiveFailures = 0;
      maybeRestoreBaseInterval(state);
      return;
    }

    state.consecutiveFailures += 1;
    logWarn('巡检探测失败', {
      consecutiveFailures: state.consecutiveFailures,
      idleMs,
      intervalMs: state.currentIntervalMs,
    });

    if (state.consecutiveFailures >= state.settings.maxConsecutiveFailures) {
      softRecover(state, `probe_failed_${state.consecutiveFailures}`);
    }
  } catch (error) {
    state.consecutiveFailures += 1;
    logWarn('巡检异常', {
      consecutiveFailures: state.consecutiveFailures,
      error: toErrorMessage(error),
    });

    if (state.consecutiveFailures >= state.settings.maxConsecutiveFailures) {
      softRecover(state, `tick_exception_${state.consecutiveFailures}`);
    }
  }
}

function runLightProbe(state: RuntimeState, idleMs: number): boolean {
  state.lastProbeTs = Date.now();

  try {
    void getVariables(state.scriptVariableOption);
    touch(state, `probe_${Math.floor(idleMs / 1000)}s`);
    logDebug(state, '巡检探测成功', { idleMs, isGenerating: state.isGenerating });
    return true;
  } catch (error) {
    logWarn('巡检探测异常', { idleMs, error: toErrorMessage(error) });
    return false;
  }
}

function softRecover(state: RuntimeState, reason: string): void {
  const now = Date.now();
  const cooldownMs = now - state.lastRecoverTs;
  const nextIntervalMs = getNextBackoffIntervalMs(state);

  if (cooldownMs < state.settings.recoverCooldownMs) {
    if (nextIntervalMs !== state.currentIntervalMs) {
      restartTimer(state, nextIntervalMs);
    }

    logDebug(state, '恢复冷却中，已应用退避', {
      reason,
      cooldownMs,
      recoverCooldownMs: state.settings.recoverCooldownMs,
      intervalMs: state.currentIntervalMs,
    });
    return;
  }

  state.lastRecoverTs = now;

  if (nextIntervalMs !== state.currentIntervalMs) {
    restartTimer(state, nextIntervalMs);
  }

  bindHeartbeatEvents(state);

  if (state.settings.mediaBoostEnabled && state.isBackground) {
    ensureMediaBoost(state, `soft_recover_${reason}`);
  }

  touch(state, `soft_recover_${reason}`);
  state.consecutiveFailures = 0;

  logWarn('已执行软恢复', {
    reason,
    intervalMs: state.currentIntervalMs,
  });

  if (state.settings.notifyOnRecover && now - state.lastNotifyTs >= 60_000) {
    state.lastNotifyTs = now;
    toastr.info(`后台保活已执行恢复：${reason}`);
  }
}

function maybeRestoreBaseInterval(state: RuntimeState): void {
  const baseIntervalMs = getBaseIntervalMs(state.settings);
  if (state.currentIntervalMs === baseIntervalMs) return;

  restartTimer(state, baseIntervalMs);
  logDebug(state, '巡检定时器恢复到基础间隔', { intervalMs: baseIntervalMs });
}

function getNextBackoffIntervalMs(state: RuntimeState): number {
  const baseIntervalMs = getBaseIntervalMs(state.settings);
  const nextIntervalMs = Math.max(baseIntervalMs * 2, state.currentIntervalMs * 2);
  return _.clamp(nextIntervalMs, baseIntervalMs, 120_000);
}

function getBaseIntervalMs(settings: KeepaliveSettings): number {
  switch (settings.mode) {
    case 'safe':
      return _.clamp(settings.heartbeatIntervalMs * 2, 5_000, 120_000);
    case 'strong':
      return _.clamp(Math.floor(settings.heartbeatIntervalMs / 2), 3_000, 30_000);
    default:
      return _.clamp(settings.heartbeatIntervalMs, 3_000, 60_000);
  }
}

function getIdleThresholdMs(settings: KeepaliveSettings): number {
  switch (settings.mode) {
    case 'safe':
      return _.clamp(settings.idleThresholdMs * 2, 30_000, 600_000);
    case 'strong':
      return _.clamp(Math.floor(settings.idleThresholdMs * 0.75), 15_000, 120_000);
    default:
      return _.clamp(settings.idleThresholdMs, 15_000, 300_000);
  }
}

function ensureMediaBoost(state: RuntimeState, reason: string): boolean {
  if (state.disposed || state.mediaBoostActive || !state.settings.mediaBoostEnabled) {
    return true;
  }

  const channel = state.settings.mediaChannel;
  const keepaliveAudio: AudioWithOptionalTitle = {
    title: state.keepaliveAudioTitle,
    url: state.settings.mediaKeepaliveUrl,
  };

  try {
    state.mediaSnapshot = {
      settings: { ...getAudioSettings(channel) },
      list: getAudioList(channel).map(audio => ({ ...audio })),
    };

    appendAudioList(channel, [keepaliveAudio]);
    setAudioSettings(channel, {
      enabled: true,
      mode: 'repeat_one',
      muted: false,
      volume: state.settings.mediaVolume,
    });
    playAudio(channel, keepaliveAudio);

    state.mediaBoostActive = true;
    logInfo('媒体增强已激活', {
      channel,
      reason,
      volume: state.settings.mediaVolume,
    });
    return true;
  } catch (error) {
    const failedError = toErrorMessage(error);

    if (state.mediaSnapshot) {
      try {
        replaceAudioList(channel, state.mediaSnapshot.list);
        setAudioSettings(channel, state.mediaSnapshot.settings);
      } catch (restoreError) {
        logWarn('媒体增强失败后恢复音频状态时出错', {
          channel,
          reason,
          error: toErrorMessage(restoreError),
        });
      }
    }

    state.mediaSnapshot = null;
    state.mediaBoostActive = false;

    logWarn('媒体增强激活失败，已自动降级', {
      channel,
      reason,
      error: failedError,
    });
    return false;
  }
}

function disableMediaBoost(state: RuntimeState, reason: string): void {
  if (!state.mediaBoostActive) return;

  const channel = state.settings.mediaChannel;

  try {
    pauseAudio(channel);

    if (state.mediaSnapshot) {
      replaceAudioList(channel, state.mediaSnapshot.list);
      setAudioSettings(channel, state.mediaSnapshot.settings);
    }

    logInfo('媒体增强已恢复原状态', {
      channel,
      reason,
    });
  } catch (error) {
    logWarn('媒体增强恢复失败', {
      channel,
      reason,
      error: toErrorMessage(error),
    });
  } finally {
    state.mediaBoostActive = false;
    state.mediaSnapshot = null;
  }
}

function touch(state: RuntimeState, reason: string): void {
  state.lastAliveTs = Date.now();
  logDebug(state, '心跳更新', { reason });
}

function dispose(state: RuntimeState, reason: string): void {
  if (state.disposed) return;

  state.disposed = true;

  if (state.timer !== null) {
    clearInterval(state.timer);
    state.timer = null;
  }

  clearHeartbeatEvents(state);
  unbindVisibilityEvents(state);
  disableMediaBoost(state, `dispose_${reason}`);

  logInfo('后台保活已停止', { reason });
}

function logInfo(message: string, detail?: Record<string, unknown>): void {
  if (detail) {
    console.info(KEEPALIVE_LOG_PREFIX, message, detail);
    return;
  }
  console.info(KEEPALIVE_LOG_PREFIX, message);
}

function logWarn(message: string, detail?: Record<string, unknown>): void {
  if (detail) {
    console.warn(KEEPALIVE_LOG_PREFIX, message, detail);
    return;
  }
  console.warn(KEEPALIVE_LOG_PREFIX, message);
}

function logDebug(state: RuntimeState, message: string, detail?: Record<string, unknown>): void {
  if (!state.settings.debugLog) return;

  if (detail) {
    console.info(KEEPALIVE_LOG_PREFIX, message, detail);
    return;
  }

  console.info(KEEPALIVE_LOG_PREFIX, message);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
