/**
 * Prebuild step — reads config and generates icons for dynamic actions
 * (scenes and sources) by cloning the template SVGs with the correct action names.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join, resolve } from 'path';

const CONFIG_PATH = join(homedir(), '.obs-controller-config.json');
const ICONS_DIR = resolve('package/actionicons');
const SYMBOLS_DIR = resolve('package/actionsymbols');

type Config = {
  scenes?: string[];
  sources?: string[];
};

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function writeIcon(name: string, template: string) {
  const src = join(ICONS_DIR, template);
  if (!existsSync(src)) return;
  const content = readFileSync(src, 'utf-8');
  writeFileSync(join(ICONS_DIR, `${name}.svg`), content);
  writeFileSync(join(SYMBOLS_DIR, `${name}.svg`), content);
}

let config: Config = { scenes: [], sources: [] };
if (existsSync(CONFIG_PATH)) {
  try { config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')); } catch { /* ignore */ }
}

for (const sceneName of config.scenes ?? []) {
  const id = slug(sceneName);
  writeIcon(`switch_scene_${id}`, '_scene_switch_template.svg');
  writeIcon(`preview_scene_${id}`, '_scene_preview_template.svg');
}

for (const sourceName of config.sources ?? []) {
  const id = slug(sourceName);
  writeIcon(`show_source_${id}`, '_show_source_template.svg');
  writeIcon(`hide_source_${id}`, '_hide_source_template.svg');
  writeIcon(`toggle_source_${id}`, '_toggle_source_template.svg');
}

console.log('✅  Icons generated for scenes and sources.');
