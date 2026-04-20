import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

export class StartRecordAction extends CommandAction {
  readonly name = 'start_record';
  displayName = 'Start Recording';
  description = 'Start OBS recording';
  readonly groupName = 'Recording';

  async onKeyDown() {
    await obsConnection.call('StartRecord');
  }
}
