import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

export class ToggleStreamAction extends CommandAction {
  readonly name = 'toggle_stream';
  displayName = 'Toggle Streaming';
  description = 'Start or stop OBS stream';
  readonly groupName = 'Streaming';

  async onKeyDown() {
    await obsConnection.call('ToggleStream');
  }
}
