import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

export class ToggleRecordAction extends CommandAction {
  readonly name = 'toggle_record';
  displayName = 'Toggle Recording';
  description = 'Start or stop OBS recording';
  readonly groupName = 'Recording';

  async onKeyDown() {
    await obsConnection.call('ToggleRecord');
  }
}
