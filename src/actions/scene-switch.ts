import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function makeSceneAction(sceneName: string) {
  const id = slug(sceneName);
  return class extends CommandAction {
    readonly name = `switch_scene_${id}`;
    displayName = `Scene: ${sceneName}`;
    description = `Switch OBS to scene "${sceneName}"`;
    readonly groupName = 'Scenes';

    async onKeyDown() {
      await obsConnection.call('SetCurrentProgramScene', { sceneName });
    }
  };
}
