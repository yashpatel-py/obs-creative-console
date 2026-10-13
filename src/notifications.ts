import { exec } from 'child_process';

function notify(title: string, message: string) {
  const safe = (s: string) => s.replace(/"/g, '\\"');
  exec(`osascript -e 'display notification "${safe(message)}" with title "${safe(title)}"'`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setupNotifications(obs: any) {
  obs.on('RecordStateChanged', (data: unknown) => {
    const { outputState } = data as { outputState: string };
    if (outputState === 'OBS_WEBSOCKET_OUTPUT_STARTED') notify('Studio Controller', '🔴 Recording started');
    if (outputState === 'OBS_WEBSOCKET_OUTPUT_STOPPED') notify('Studio Controller', '⏹ Recording stopped');
    if (outputState === 'OBS_WEBSOCKET_OUTPUT_PAUSED')  notify('Studio Controller', '⏸ Recording paused');
    if (outputState === 'OBS_WEBSOCKET_OUTPUT_RESUMED') notify('Studio Controller', '▶️ Recording resumed');
  });

  obs.on('StreamStateChanged', (data: unknown) => {
    const { outputState } = data as { outputState: string };
    if (outputState === 'OBS_WEBSOCKET_OUTPUT_STARTED') notify('Studio Controller', '🟢 Stream started — you are live!');
    if (outputState === 'OBS_WEBSOCKET_OUTPUT_STOPPED') notify('Studio Controller', '🔴 Stream stopped');
  });

  obs.on('ReplayBufferStateChanged', (data: unknown) => {
    const { outputState } = data as { outputState: string };
    if (outputState === 'OBS_WEBSOCKET_OUTPUT_STARTED') notify('Studio Controller', '🔁 Replay buffer active');
    if (outputState === 'OBS_WEBSOCKET_OUTPUT_STOPPED') notify('Studio Controller', '⏹ Replay buffer stopped');
  });

  obs.on('ReplayBufferSaved', (data: unknown) => {
    const { savedReplayPath } = data as { savedReplayPath: string };
    const file = savedReplayPath.split('/').pop() ?? 'clip';
    notify('Studio Controller', `💾 Replay saved: ${file}`);
  });

  obs.on('SceneChanged', (data: unknown) => {
    const { sceneName } = data as { sceneName: string };
    notify('Studio Controller', `🎬 Scene: ${sceneName}`);
  });

  obs.on('VirtualcamStateChanged', (data: unknown) => {
    const { outputActive } = data as { outputActive: boolean };
    notify('Studio Controller', outputActive ? '📷 Virtual camera ON' : '📷 Virtual camera OFF');
  });
}
