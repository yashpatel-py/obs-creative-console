import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

export class StopStreamAction extends CommandAction {
  readonly name = 'stop_stream';
  displayName = 'Stop Streaming';
  description = 'Stop OBS stream';
  readonly groupName = 'Streaming';

  async onKeyDown() {
    await obsConnection.call('StopStream');
  }
}
