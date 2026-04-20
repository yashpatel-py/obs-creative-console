import { CommandAction, AdjustmentAction, AdjustmentActionExecuteEvent } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// Dial — adjust current transition duration in 50ms steps (min 0ms, max 20s)
export class TransitionDurationAction extends AdjustmentAction {
  readonly name = 'transition_duration';
  displayName = 'Transition Duration';
  description = 'Adjust scene transition duration with the dial (50ms per tick)';
  readonly groupName = 'Transitions';
  readonly hasReset = true;

  async execute(event: AdjustmentActionExecuteEvent) {
    const current = (await obsConnection.call('GetCurrentSceneTransition')) as {
      transitionDuration: number;
    };
    const next = Math.min(20000, Math.max(0, current.transitionDuration + event.tick * 50));
    await obsConnection.call('SetCurrentSceneTransitionDuration', { transitionDuration: next });
  }
}

// One action per transition name in config
export function makeSetTransitionAction(transitionName: string) {
  const id = slug(transitionName);
  return class extends CommandAction {
    readonly name = `set_transition_${id}`;
    displayName = `Transition: ${transitionName}`;
    description = `Switch OBS scene transition to "${transitionName}"`;
    readonly groupName = 'Transitions';
    async onKeyDown() {
      await obsConnection.call('SetCurrentSceneTransition', { transitionName });
    }
  };
}
