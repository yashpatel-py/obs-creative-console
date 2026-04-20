import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

export class MuteDesktopAction extends CommandAction {
  readonly name = 'mute_desktop';
  displayName = 'Mute Desktop Audio';
  description = 'Mute desktop audio in OBS';
  readonly groupName = 'Audio';
  async onKeyDown() {
    await obsConnection.call('SetInputMute', { inputName: obsConnection.config.desktopSource, inputMuted: true });
  }
}

export class UnmuteDesktopAction extends CommandAction {
  readonly name = 'unmute_desktop';
  displayName = 'Unmute Desktop Audio';
  description = 'Unmute desktop audio in OBS';
  readonly groupName = 'Audio';
  async onKeyDown() {
    await obsConnection.call('SetInputMute', { inputName: obsConnection.config.desktopSource, inputMuted: false });
  }
}

export class ToggleDesktopMuteAction extends CommandAction {
  readonly name = 'toggle_desktop_mute';
  displayName = 'Toggle Desktop Audio Mute';
  description = 'Mute or unmute desktop audio in OBS';
  readonly groupName = 'Audio';
  async onKeyDown() {
    await obsConnection.call('ToggleInputMute', { inputName: obsConnection.config.desktopSource });
  }
}
