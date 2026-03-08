const LOG_PREFIX = '[酒馆后台保活]';
const HEARTBEAT_INTERVAL_MS = 1000;
const SUMMARY_INTERVAL_MS = 30000;
const FREEZE_GAP_WARN_MS = 4000;

const jq = ((window as any).$ ?? (window.parent as any).$) as any;
const toast = ((window as any).toastr ?? (window.parent as any).toastr) as
  | {
      success?: (...args: any[]) => void;
      warning?: (...args: any[]) => void;
      info?: (...args: any[]) => void;
    }
  | undefined;

type AudioKeepAliveState = 'pending_auto' | 'running' | 'suspended' | 'unsupported' | 'failed';

type KeepAliveState = {
  started_at: number;
  main_ticks: number;
  worker_ticks: number;
  main_last_tick: number;
  worker_last_tick: number;
  last_freeze_gap_ms: number;
  max_freeze_gap_ms: number;
  hidden_since: number | null;
  audio_state: AudioKeepAliveState;
};

type WorkerTickMessage = {
  type: 'tick';
  now: number;
  delta: number;
};

if (typeof jq !== 'function') {
  console.error(LOG_PREFIX, '未找到 jQuery，脚本无法启动');
} else {
  jq(() => {
  const started_at = Date.now();
  const state: KeepAliveState = {
    started_at,
    main_ticks: 0,
    worker_ticks: 0,
    main_last_tick: started_at,
    worker_last_tick: started_at,
    last_freeze_gap_ms: 0,
    max_freeze_gap_ms: 0,
    hidden_since: document.visibilityState === 'hidden' ? started_at : null,
    audio_state: 'pending_auto',
  };

  const stop_list: Array<() => void> = [];
  let stopped = false;

  const logInfo = (...args: any[]) => console.info(LOG_PREFIX, ...args);
  const logWarn = (...args: any[]) => console.warn(LOG_PREFIX, ...args);
  const logError = (...args: any[]) => console.error(LOG_PREFIX, ...args);

  const recordFreezeGap = (delta: number, source: 'main' | 'worker') => {
    if (delta <= FREEZE_GAP_WARN_MS) {
      return;
    }
    state.last_freeze_gap_ms = delta;
    state.max_freeze_gap_ms = Math.max(state.max_freeze_gap_ms, delta);
    logWarn(`${source} 心跳检测到疑似冻结/降频: ${delta}ms`);
  };

  const safelyStop = (stop: () => void) => {
    try {
      stop();
    } catch (error) {
      logError('资源清理失败', error);
    }
  };

  let lastMainTickAt = started_at;
  const mainHeartbeatTimer = window.setInterval(() => {
    const now = Date.now();
    const delta = now - lastMainTickAt;
    lastMainTickAt = now;

    state.main_ticks += 1;
    state.main_last_tick = now;
    recordFreezeGap(delta, 'main');
  }, HEARTBEAT_INTERVAL_MS);
  stop_list.push(() => window.clearInterval(mainHeartbeatTimer));

  const startWorkerHeartbeat = () => {
    if (
      typeof Worker === 'undefined' ||
      typeof Blob === 'undefined' ||
      typeof URL === 'undefined' ||
      typeof URL.createObjectURL !== 'function'
    ) {
      logWarn('当前环境不支持 Worker 心跳层');
      return;
    }

    const workerCode = `
      let timer = null;
      let last = Date.now();
      const tick = () => {
        const now = Date.now();
        const delta = now - last;
        last = now;
        self.postMessage({ type: 'tick', now, delta });
      };
      timer = self.setInterval(tick, ${HEARTBEAT_INTERVAL_MS});
      self.onmessage = event => {
        if (event?.data?.type === 'stop' && timer !== null) {
          self.clearInterval(timer);
          timer = null;
        }
      };
    `;

    try {
      const blob = new Blob([workerCode], { type: 'text/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      const worker = new Worker(blobUrl);

      worker.onmessage = (event: MessageEvent<Partial<WorkerTickMessage>>) => {
        const data = event.data;
        if (!data || data.type !== 'tick' || typeof data.now !== 'number' || typeof data.delta !== 'number') {
          return;
        }
        state.worker_ticks += 1;
        state.worker_last_tick = data.now;
        recordFreezeGap(data.delta, 'worker');
      };

      worker.onerror = event => {
        logWarn('Worker 心跳层异常，已退化为主线程保活', event);
        toast?.warning?.('Worker 保活层异常，已退化为主线程保活');
      };

      stop_list.push(() => {
        worker.postMessage({ type: 'stop' });
        worker.terminate();
        URL.revokeObjectURL(blobUrl);
      });

      logInfo('Worker 心跳层已启动');
    } catch (error) {
      logWarn('Worker 心跳层启动失败', error);
    }
  };

  let audioContext: AudioContext | null = null;
  let oscillator: OscillatorNode | null = null;
  let gainNode: GainNode | null = null;

  const AudioContextConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  const syncAudioState = () => {
    if (!audioContext) {
      return;
    }
    state.audio_state = audioContext.state === 'running' ? 'running' : 'suspended';
  };


  const startAudioKeepAlive = async () => {
    if (!AudioContextConstructor) {
      state.audio_state = 'unsupported';
      return;
    }

    try {
      if (!audioContext) {
        audioContext = new AudioContextConstructor();

        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 36;
        gainNode.gain.value = 0.00001;

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();

        audioContext.addEventListener('statechange', syncAudioState);

        stop_list.push(() => {
          if (audioContext) {
            audioContext.removeEventListener('statechange', syncAudioState);
          }
          try {
            oscillator?.stop();
          } catch {
            // ignore
          }
          oscillator?.disconnect();
          gainNode?.disconnect();
          if (audioContext) {
            void audioContext.close();
          }
          oscillator = null;
          gainNode = null;
          audioContext = null;
        });
      }

      await audioContext.resume();
      syncAudioState();

      if (state.audio_state === 'running') {
        logInfo('音频增强层已启用');
        toast?.success?.('后台保活音频增强层已启用');
      } else {
        logWarn(`音频增强层未进入 running 状态: ${audioContext.state}`);
      }
    } catch (error) {
      state.audio_state = 'failed';
      logWarn('音频增强层启动失败，继续使用主线程+Worker 保活', error);
      toast?.warning?.('音频增强层启动失败，继续使用主线程+Worker 保活');
    }
  };

  if (!AudioContextConstructor) {
    state.audio_state = 'unsupported';
    logWarn('当前环境不支持 AudioContext，跳过音频增强层');
  } else {
    void startAudioKeepAlive();
    toast?.info?.('正在自动启用后台保活音频增强层');
  }

  const onVisibilityChange = () => {
    const now = Date.now();

    if (document.visibilityState === 'hidden') {
      state.hidden_since = now;
      logInfo('页面进入后台');
      return;
    }

    if (state.hidden_since !== null) {
      logInfo(`页面回到前台，后台持续 ${now - state.hidden_since}ms`);
    }
    state.hidden_since = null;
  };

  const onFocus = () => {
    logInfo('窗口获得焦点');
  };

  const onBlur = () => {
    logInfo('窗口失去焦点');
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('focus', onFocus);
  window.addEventListener('blur', onBlur);
  stop_list.push(() => document.removeEventListener('visibilitychange', onVisibilityChange));
  stop_list.push(() => window.removeEventListener('focus', onFocus));
  stop_list.push(() => window.removeEventListener('blur', onBlur));

  const summaryTimer = window.setInterval(() => {
    const now = Date.now();
    logInfo('状态摘要', {
      visibility: document.visibilityState,
      main_ticks: state.main_ticks,
      worker_ticks: state.worker_ticks,
      main_lag_ms: now - state.main_last_tick,
      worker_lag_ms: now - state.worker_last_tick,
      audio_state: state.audio_state,
      last_freeze_gap_ms: state.last_freeze_gap_ms,
      max_freeze_gap_ms: state.max_freeze_gap_ms,
    });
  }, SUMMARY_INTERVAL_MS);
  stop_list.push(() => window.clearInterval(summaryTimer));

  startWorkerHeartbeat();

  logInfo('最佳努力后台保活已启动', {
    heartbeat_interval_ms: HEARTBEAT_INTERVAL_MS,
    summary_interval_ms: SUMMARY_INTERVAL_MS,
  });
  toast?.success?.('酒馆后台保活已启动（最佳努力模式）');

  const stopAll = () => {
    if (stopped) {
      return;
    }
    stopped = true;

    while (stop_list.length > 0) {
      const stop = stop_list.pop();
      if (stop) {
        safelyStop(stop);
      }
    }

    logInfo('后台保活已卸载');
  };

  jq(window).on('pagehide', () => {
    stopAll();
    toast?.info?.('酒馆后台保活已停止');
  });
  });
}
