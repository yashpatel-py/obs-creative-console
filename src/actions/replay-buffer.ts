import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

export class StartReplayBufferAction extends CommandAction {
  readonly name = 'start_replay_buffer';
  displayName = 'Start Replay Buffer';
  description = 'Start the OBS replay buffer';
  readonly groupName = 'Replay Buffer';
  async onKeyDown() { await obsConnection.call('StartReplayBuffer'); }
}

export class StopReplayBufferAction extends CommandAction {
  readonly name = 'stop_replay_buffer';
  displayName = 'Stop Replay Buffer';
  description = 'Stop the OBS replay buffer';
  readonly groupName = 'Replay Buffer';
  async onKeyDown() { await obsConnection.call('StopReplayBuffer'); }
}

export class ToggleReplayBufferAction extends CommandAction {
  readonly name = 'toggle_replay_buffer';
  displayName = 'Toggle Replay Buffer';
  description = 'Start or stop the OBS replay buffer';
  readonly groupName = 'Replay Buffer';
  async onKeyDown() { await obsConnection.call('ToggleReplayBuffer'); }
}

export class SaveReplayBufferAction extends CommandAction {
  readonly name = 'save_replay_buffer';
  displayName = 'Save Replay';
  description = 'Save the current replay buffer clip to disk';
  readonly groupName = 'Replay Buffer';
  async onKeyDown() { await obsConnection.call('SaveReplayBuffer'); }
}
