import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

export class ScreenshotAction extends CommandAction {
  readonly name = 'screenshot';
  displayName = 'Screenshot';
  description = 'Take a screenshot of the current OBS scene';
  readonly groupName = 'General';
  async onKeyDown() { await obsConnection.call('TriggerHotkeyByName', { hotkeyName: 'OBSBasic.Screenshot' }); }
}
