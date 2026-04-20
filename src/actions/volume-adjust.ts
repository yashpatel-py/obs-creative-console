import { AdjustmentAction, AdjustmentActionExecuteEvent } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

const STEP = 0.02; // 2% per dial tick
const CLAMP = (v: number) => Math.min(1, Math.max(0, v));

function makeVolumeAction(sourceKey: 'micSource' | 'desktopSource', label: string, name: string) {
  return class extends AdjustmentAction {
    readonly name = name;
    displayName = `${label} Volume`;
    description = `Adjust ${label} volume with the dial`;
    readonly groupName = 'Audio';
    readonly hasReset = false;

    async execute(event: AdjustmentActionExecuteEvent) {
      const inputName = obsConnection.config[sourceKey];
      const result = (await obsConnection.call('GetInputVolume', { inputName })) as {
        inputVolumeMul: number;
      };
      const newVol = CLAMP(result.inputVolumeMul + event.tick * STEP);
      await obsConnection.call('SetInputVolume', { inputName, inputVolumeMul: newVol });
    }
  };
}

export const MicVolumeAction = makeVolumeAction('micSource', 'Mic', 'mic_volume');
export const DesktopVolumeAction = makeVolumeAction('desktopSource', 'Desktop Audio', 'desktop_volume');
