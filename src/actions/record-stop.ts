import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

export class StopRecordAction extends CommandAction {
  readonly name = 'stop_record';
  displayName = 'Stop Recording';
  description = 'Stop OBS recording';
  readonly groupName = 'Recording';

  async onKeyDown() {
    await obsConnection.call('StopRecord');
  }
}
