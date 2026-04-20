import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

export class StartStreamAction extends CommandAction {
  readonly name = 'start_stream';
  displayName = 'Start Streaming';
  description = 'Start OBS stream';
  readonly groupName = 'Streaming';

  async onKeyDown() {
    await obsConnection.call('StartStream');
  }
}
