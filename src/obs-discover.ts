import OBSWebSocket from 'obs-websocket-js';

export type DiscoveredData = {
  scenes: string[];
  sources: string[];           // deduplicated across all scenes
  audioInputs: string[];       // all audio input sources
  audioOutputs: string[];      // all audio output sources
  micSource: string;           // best-guess mic
  desktopSource: string;       // best-guess desktop audio
  filters: Array<{ sourceName: string; filterName: string }>;
  transitions: string[];
  sceneCollections: string[];
  profiles: string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

export async function discoverOBS(obs: OBSWebSocket): Promise<DiscoveredData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = (req: string, data?: Record<string, unknown>) => (obs as any).call(req, data);

  // ── Scenes ──────────────────────────────────────────────────────────────────
  const sceneData = await safe(
    () => call('GetSceneList') as Promise<{ scenes: Array<{ sceneName: string }> }>,
    { scenes: [] }
  );
  const scenes = sceneData.scenes.map((s) => s.sceneName).reverse(); // OBS returns newest-first

  // ── All sources across every scene (deduplicated) ───────────────────────────
  const sourceSet = new Set<string>();
  for (const sceneName of scenes) {
    const itemData = await safe(
      () => call('GetSceneItemList', { sceneName }) as Promise<{
        sceneItems: Array<{ sourceName: string; inputKind?: string }>;
      }>,
      { sceneItems: [] }
    );
    for (const item of itemData.sceneItems) {
      if (item.sourceName) sourceSet.add(item.sourceName);
    }
  }
  const sources = [...sourceSet];

  // ── All inputs ───────────────────────────────────────────────────────────────
  const inputData = await safe(
    () => call('GetInputList') as Promise<{
      inputs: Array<{ inputName: string; inputKind: string }>;
    }>,
    { inputs: [] }
  );
  const inputs = inputData.inputs;

  const MIC_KINDS = [
    'coreaudio_input_capture',
    'wasapi_input_capture',
    'pulse_input_capture',
    'alsa_input_capture',
  ];
  const DESKTOP_KINDS = [
    'coreaudio_output_capture',
    'wasapi_output_capture',
    'pulse_output_capture',
  ];

  const audioInputs = inputs
    .filter((i) => MIC_KINDS.includes(i.inputKind) || /mic|microphone/i.test(i.inputName))
    .map((i) => i.inputName);

  const audioOutputs = inputs
    .filter((i) => DESKTOP_KINDS.includes(i.inputKind) || /desktop|speaker|output/i.test(i.inputName))
    .map((i) => i.inputName);

  // Best-guess defaults
  const micSource =
    audioInputs[0] ??
    inputs.find((i) => /mic/i.test(i.inputName))?.inputName ??
    'Mic/Aux';

  const desktopSource =
    audioOutputs[0] ??
    inputs.find((i) => /desktop|speaker/i.test(i.inputName))?.inputName ??
    'Desktop Audio';

  // ── Filters for every source ─────────────────────────────────────────────────
  const filters: Array<{ sourceName: string; filterName: string }> = [];
  for (const sourceName of sources) {
    const filterData = await safe(
      () => call('GetSourceFilterList', { sourceName }) as Promise<{
        filters: Array<{ filterName: string }>;
      }>,
      { filters: [] }
    );
    for (const f of filterData.filters) {
      filters.push({ sourceName, filterName: f.filterName });
    }
  }

  // ── Transitions ──────────────────────────────────────────────────────────────
  const transitionData = await safe(
    () => call('GetSceneTransitionList') as Promise<{
      transitions: Array<{ transitionName: string }>;
    }>,
    { transitions: [] }
  );
  const transitions = transitionData.transitions.map((t) => t.transitionName);

  // ── Scene collections ────────────────────────────────────────────────────────
  const collectionData = await safe(
    () => call('GetSceneCollectionList') as Promise<{ sceneCollections: string[] }>,
    { sceneCollections: [] }
  );

  // ── Profiles ──────────────────────────────────────────────────────────────────
  const profileData = await safe(
    () => call('GetProfileList') as Promise<{ profiles: string[] }>,
    { profiles: [] }
  );

  return {
    scenes,
    sources,
    audioInputs,
    audioOutputs,
    micSource,
    desktopSource,
    filters,
    transitions,
    sceneCollections: collectionData.sceneCollections,
    profiles: profileData.profiles,
  };
}
