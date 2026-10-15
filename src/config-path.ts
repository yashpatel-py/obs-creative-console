import { copyFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export const CONFIG_PATH = join(homedir(), '.studio-controller-config.json');

// Where the config lived before the plugin was renamed to Studio Controller
const LEGACY_CONFIG_PATH = join(homedir(), '.obs-controller-config.json');

// Carry over credentials saved under the old name so existing setups keep working
export function migrateLegacyConfig(): void {
  if (existsSync(CONFIG_PATH) || !existsSync(LEGACY_CONFIG_PATH)) return;
  try { copyFileSync(LEGACY_CONFIG_PATH, CONFIG_PATH); } catch { /* ignore */ }
}
