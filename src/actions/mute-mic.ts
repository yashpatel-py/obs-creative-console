import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

export class MuteMicAction extends CommandAction {
  readonly name = 'mute_mic';
  displayName = 'Mute Microphone';
  description = 'Mute the microphone source in OBS';
  readonly groupName = 'Audio';
  async onKeyDown() {
    await obsConnection.call('SetInputMute', { inputName: obsConnection.config.micSource, inputMuted: true });
  }
}

export class UnmuteMicAction extends CommandAction {
  readonly name = 'unmute_mic';
  displayName = 'Unmute Microphone';
  description = 'Unmute the microphone source in OBS';
  readonly groupName = 'Audio';
  async onKeyDown() {
    await obsConnection.call('SetInputMute', { inputName: obsConnection.config.micSource, inputMuted: false });
  }
}

export class ToggleMicMuteAction extends CommandAction {
  readonly name = 'toggle_mic_mute';
  displayName = 'Toggle Microphone Mute';
  description = 'Mute or unmute the microphone source in OBS';
  readonly groupName = 'Audio';
  async onKeyDown() {
    await obsConnection.call('ToggleInputMute', { inputName: obsConnection.config.micSource });
  }
}
