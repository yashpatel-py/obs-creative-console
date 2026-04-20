#!/usr/bin/env node
/**
 * One-time setup — only asks for OBS WebSocket credentials.
 * Everything else (scenes, sources, filters, transitions...) is auto-discovered
 * at plugin startup by connecting to OBS directly.
 *
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

async function main() {
  console.log('\n🎬  OBS Controller — Setup\n');
  console.log('Scenes, sources, filters, and transitions are auto-discovered from OBS.');
  console.log('This setup only needs your WebSocket credentials.\n');

  let existing: Record<string, unknown> = {};
  if (existsSync(CONFIG_PATH)) {
    try { existing = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')); } catch { /* ignore */ }
  }

  const host     = await ask('OBS WebSocket host', (existing.host as string) ?? 'localhost');
  const portStr  = await ask('OBS WebSocket port', String((existing.port as number) ?? 4455));
  const password = await ask('Password (leave blank if none)', (existing.password as string) ?? '');

  // Verify connection
  console.log('\nVerifying connection...');
  const obs = new OBSWebSocket();
  try {
    await obs.connect(`ws://${host}:${portStr}`, password || undefined);
    console.log('✅  Connected to OBS!\n');

    // Show what will be auto-discovered
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const call = (req: string, data?: Record<string, unknown>) => (obs as any).call(req, data);

    const sceneData = await call('GetSceneList') as { scenes: Array<{ sceneName: string }> };
    const inputData = await call('GetInputList') as { inputs: Array<{ inputName: string }> };
    const transData = await call('GetSceneTransitionList') as { transitions: Array<{ transitionName: string }> };
    const colData   = await call('GetSceneCollectionList') as { sceneCollections: string[] };
    const profData  = await call('GetProfileList') as { profiles: string[] };

    console.log('📋  Will auto-discover:');
    console.log(`   ${sceneData.scenes.length} scenes`);
    console.log(`   ${inputData.inputs.length} sources/inputs`);
    console.log(`   ${transData.transitions.length} transitions`);
    console.log(`   ${colData.sceneCollections.length} scene collections`);
    console.log(`   ${profData.profiles.length} profiles`);
    console.log('   All filters on every source');
    console.log('   Audio inputs & outputs\n');

    await obs.disconnect();
  } catch (e) {
    console.warn(`\n⚠️  Could not connect: ${(e as Error).message}`);
    console.warn('   Config will be saved anyway. Make sure OBS is open before using the plugin.\n');
  }

  // Optional: source overrides
  const overrideMic     = await ask('Override mic source name? (leave blank to auto-detect)', '');
  const overrideDesktop = await ask('Override desktop audio source name? (leave blank to auto-detect)', '');

  // Optional: text source presets
  const textSources: Array<{ sourceName: string; presets: string[] }> = [];
  const existingText = (existing.textSources as typeof textSources) ?? [];
  if (existingText.length > 0) {
    console.log(`\nExisting text source presets: ${existingText.map((t) => t.sourceName).join(', ')}`);
    const keep = await ask('Keep existing text source presets? (y/n)', 'y');
    if (keep.toLowerCase() === 'y') textSources.push(...existingText);
  }

  const addText = await ask('\nAdd text source presets? (y/n)', 'n');
  if (addText.toLowerCase() === 'y') {
    let adding = true;
    while (adding) {
      const srcName = await ask('  Text source name in OBS (or blank to stop)', '');
      if (!srcName) { adding = false; break; }
      const presetsRaw = await ask(`  Presets for "${srcName}" (comma-separated)`, 'BRB, Live, Offline');
      const presets = presetsRaw.split(',').map((p) => p.trim()).filter(Boolean);
      textSources.push({ sourceName: srcName, presets });
    }
  }

  const config = {
    host,
    port: parseInt(portStr),
    password,
    micSource: overrideMic,
    desktopSource: overrideDesktop,
    textSources,
  };

  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(`\n✅  Config saved to ${CONFIG_PATH}`);
  console.log('\n▶️   Now run: npm run build && npm run link\n');
  rl.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
