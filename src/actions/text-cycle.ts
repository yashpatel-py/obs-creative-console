import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// Tracks which preset each text source is currently showing
const presetIndex = new Map<string, number>();

export function makeTextCycleAction(sourceName: string, presets: string[]) {
  const id = slug(sourceName);
  return class extends CommandAction {
    readonly name = `cycle_text_${id}`;
    displayName = `Text: ${sourceName}`;
    description = `Cycle "${sourceName}" through preset texts on each press`;
    readonly groupName = 'Text Sources';

    async onKeyDown() {
      const current = presetIndex.get(sourceName) ?? 0;
      const next = (current + 1) % presets.length;
      presetIndex.set(sourceName, next);
      await obsConnection.call('SetInputSettings', {
        inputName: sourceName,
        inputSettings: { text: presets[next] },
      });
    }
  };
}
