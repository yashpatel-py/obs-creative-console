import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

export class ToggleStudioModeAction extends CommandAction {
  readonly name = 'toggle_studio_mode';
  displayName = 'Toggle Studio Mode';
  description = 'Enable or disable OBS Studio Mode';
  readonly groupName = 'General';
  async onKeyDown() { await obsConnection.call('ToggleStudioMode'); }
}
