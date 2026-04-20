import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function makeHotkeyAction(displayLabel: string, hotkeyName: string) {
  const id = slug(displayLabel);
  return class extends CommandAction {
    readonly name = `hotkey_${id}`;
    displayName = displayLabel;
    description = `Trigger OBS hotkey: ${hotkeyName}`;
    readonly groupName = 'Hotkeys';

    async onKeyDown() {
      await obsConnection.call('TriggerHotkeyByName', { hotkeyName });
    }
  };
}
