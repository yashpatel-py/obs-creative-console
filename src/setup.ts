#!/usr/bin/env node
/**
 * Interactive setup — connects to OBS, fetches scenes + sources, writes config.
 * Run: npm run setup
 */
import OBSWebSocket from 'obs-websocket-js';
import { createInterface } from 'readline';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_PATH = join(homedir(), '.obs-controller-config.json');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string, fallback = ''): Promise<string> =>
  new Promise((res) => {
    const hint = fallback ? ` (default: ${fallback})` : '';
    rl.question(`${q}${hint}: `, (ans) => res(ans.trim() || fallback));
  });

function notify(msg: string) {
  console.log(`\n${msg}`);
}

async function main() {
  console.log('\n🎬  OBS Controller — Setup\n');

  // Load existing config as defaults
  let existing: Record<string, unknown> = {};
  if (existsSync(CONFIG_PATH)) {
    try { existing = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')); } catch { /* ignore */ }
  }

  const host = await ask('OBS WebSocket host', (existing.host as string) ?? 'localhost');
  const portStr = await ask('OBS WebSocket port', String((existing.port as number) ?? 4455));
  const password = await ask('OBS WebSocket password (leave blank if none)', (existing.password as string) ?? '');

  notify('Connecting to OBS...');

  const obs = new OBSWebSocket();
  try {
    await obs.connect(`ws://${host}:${portStr}`, password || undefined);
  } catch (e) {
    console.error(`\n❌  Could not connect: ${(e as Error).message}`);
    console.error('   Make sure OBS is open and WebSocket server is enabled (Tools → WebSocket Server Settings).');
    rl.close();
    process.exit(1);
  }

  notify('✅  Connected!\n');

  // Fetch scenes
  const sceneData = (await obs.call('GetSceneList')) as unknown as {
    scenes: Array<{ sceneName: string }>;
  };
  const allScenes = sceneData.scenes.map((s) => s.sceneName).reverse(); // OBS returns newest-first

  console.log('📺  Scenes found:');
  allScenes.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

  const sceneInput = await ask(
    '\nWhich scenes to add as actions? Enter numbers separated by commas, or "all"',
    'all'
  );
  const selectedScenes =
    sceneInput.toLowerCase() === 'all'
      ? allScenes
      : sceneInput
          .split(',')
          .map((n) => allScenes[parseInt(n.trim()) - 1])
          .filter(Boolean);

  // Fetch audio sources
  const inputData = (await obs.call('GetInputList')) as {
    inputs: Array<{ inputName: string; inputKind: string }>;
  };
  const audioSources = inputData.inputs.filter((i) =>
    ['wasapi_input_capture', 'wasapi_output_capture', 'coreaudio_input_capture',
     'coreaudio_output_capture', 'pulse_input_capture', 'pulse_output_capture',
     'alsa_input_capture', 'ffmpeg_source'].includes(i.inputKind)
  );

  // Also include any source with "mic" or "audio" or "desktop" in name
  const allAudioLike = inputData.inputs.filter(
    (i) => /mic|audio|desktop|speaker|input|output/i.test(i.inputName)
  );
  const combinedAudio = [...new Map([...audioSources, ...allAudioLike].map((i) => [i.inputName, i])).values()];

  let micSource = (existing.micSource as string) ?? 'Mic/Aux';
  let desktopSource = (existing.desktopSource as string) ?? 'Desktop Audio';

  if (combinedAudio.length > 0) {
    console.log('\n🎙️  Audio sources found:');
    combinedAudio.forEach((s, i) => console.log(`   ${i + 1}. ${s.inputName}`));

    const micIndex = await ask('Which is your microphone? Enter number', '');
    if (micIndex) micSource = combinedAudio[parseInt(micIndex) - 1]?.inputName ?? micSource;

    const desktopIndex = await ask('Which is your desktop audio? Enter number', '');
    if (desktopIndex) desktopSource = combinedAudio[parseInt(desktopIndex) - 1]?.inputName ?? desktopSource;
  }

  // Fetch all sources for visibility actions
  console.log('\n🎞️  Fetching sources for visibility actions...');
  const currentScene = (await obs.call('GetCurrentProgramScene')) as { currentProgramSceneName: string };
  const itemData = (await obs.call('GetSceneItemList', { sceneName: currentScene.currentProgramSceneName })) as {
    sceneItems: Array<{ sourceName: string; sceneItemId: number }>;
  };
  const allSources = itemData.sceneItems.map((i) => i.sourceName);

  let selectedSources: string[] = [];
  if (allSources.length > 0) {
    console.log(`   Sources in "${currentScene.currentProgramSceneName}":`);
    allSources.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

    const sourceInput = await ask(
      'Which sources to add show/hide/toggle actions? Enter numbers, "all", or leave blank to skip',
      ''
    );
    if (sourceInput.toLowerCase() === 'all') {
      selectedSources = allSources;
    } else if (sourceInput) {
      selectedSources = sourceInput
        .split(',')
        .map((n) => allSources[parseInt(n.trim()) - 1])
        .filter(Boolean);
    }
  }

  await obs.disconnect();

  const config = {
    host,
    port: parseInt(portStr),
    password,
    scenes: selectedScenes,
    sources: selectedSources,
    micSource,
    desktopSource,
  };

  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

  console.log(`\n✅  Config saved to ${CONFIG_PATH}`);
  console.log('\n📋  Summary:');
  console.log(`   Scenes:  ${selectedScenes.join(', ') || 'none'}`);
  console.log(`   Sources: ${selectedSources.join(', ') || 'none'}`);
  console.log(`   Mic:     ${micSource}`);
  console.log(`   Desktop: ${desktopSource}`);
  console.log('\n▶️   Now run: npm run build && npm run link\n');

  rl.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
