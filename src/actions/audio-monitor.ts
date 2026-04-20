import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// Cycles: None → Monitor Only → Monitor & Output → None
const MONITOR_STATES = [
  'OBS_MONITORING_TYPE_NONE',
  'OBS_MONITORING_TYPE_MONITOR_ONLY',
  'OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT',
] as const;

const MONITOR_LABELS = ['Off', 'Monitor Only', 'Monitor & Output'];

export function makeAudioMonitorAction(sourceName: string) {
  const id = slug(sourceName);
  return class extends CommandAction {
    readonly name = `cycle_monitor_${id}`;
    displayName = `Monitor: ${sourceName}`;
    description = `Cycle audio monitoring for "${sourceName}" (Off → Monitor → Monitor & Output)`;
    readonly groupName = 'Audio';

    async onKeyDown() {
      const result = (await obsConnection.call('GetInputAudioMonitorType', {
        inputName: sourceName,
      })) as { monitorType: string };

      const currentIndex = MONITOR_STATES.indexOf(
        result.monitorType as (typeof MONITOR_STATES)[number]
      );
      const nextIndex = (currentIndex + 1) % MONITOR_STATES.length;

      await obsConnection.call('SetInputAudioMonitorType', {
        inputName: sourceName,
        monitorType: MONITOR_STATES[nextIndex],
      });

      console.log(`[OBS] ${sourceName} monitor → ${MONITOR_LABELS[nextIndex]}`);
    }
  };
}
