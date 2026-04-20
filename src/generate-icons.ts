/**
 * Prebuild step — reads config and generates icons for all dynamic actions.
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
  filters?: Array<{ sourceName: string; filterName: string }>;
  textSources?: Array<{ sourceName: string }>;
  monitorSources?: string[];
  hotkeys?: Array<{ name: string }>;
  sceneCollections?: string[];
  profiles?: string[];
  transitions?: string[];
};

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function cloneIcon(actionName: string, template: string) {
  const src = join(ICONS_DIR, template);
  if (!existsSync(src)) return;
  const content = readFileSync(src, 'utf-8');
  writeFileSync(join(ICONS_DIR, `${actionName}.svg`), content);
  writeFileSync(join(SYMBOLS_DIR, `${actionName}.svg`), content);
}

let config: Config = {};
if (existsSync(CONFIG_PATH)) {
  try { config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')); } catch { /* ignore */ }
}

// Scenes
for (const name of config.scenes ?? []) {
  const id = slug(name);
  cloneIcon(`switch_scene_${id}`, '_scene_switch_template.svg');
  cloneIcon(`preview_scene_${id}`, '_scene_preview_template.svg');
}

// Source visibility + projectors
for (const name of config.sources ?? []) {
  const id = slug(name);
  cloneIcon(`show_source_${id}`, '_show_source_template.svg');
  cloneIcon(`hide_source_${id}`, '_hide_source_template.svg');
  cloneIcon(`toggle_source_${id}`, '_toggle_source_template.svg');
  cloneIcon(`open_projector_${id}`, '_source_projector_template.svg');
}

// Filters
for (const { sourceName, filterName } of config.filters ?? []) {
  cloneIcon(`toggle_filter_${slug(sourceName)}_${slug(filterName)}`, '_filter_toggle_template.svg');
}

// Text sources
for (const { sourceName } of config.textSources ?? []) {
  cloneIcon(`cycle_text_${slug(sourceName)}`, '_text_cycle_template.svg');
}

// Audio monitor
for (const name of config.monitorSources ?? []) {
  cloneIcon(`cycle_monitor_${slug(name)}`, '_audio_monitor_template.svg');
}

// Hotkeys
for (const { name } of config.hotkeys ?? []) {
  cloneIcon(`hotkey_${slug(name)}`, '_hotkey_template.svg');
}

// Scene collections
for (const name of config.sceneCollections ?? []) {
  cloneIcon(`switch_collection_${slug(name)}`, '_collection_template.svg');
}

// Profiles
for (const name of config.profiles ?? []) {
  cloneIcon(`switch_profile_${slug(name)}`, '_profile_template.svg');
}

// Transitions
for (const name of config.transitions ?? []) {
  cloneIcon(`set_transition_${slug(name)}`, '_transition_template.svg');
}

console.log('✅  Icons generated.');
