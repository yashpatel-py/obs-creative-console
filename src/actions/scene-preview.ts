import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function makeScenePreviewAction(sceneName: string) {
  const id = slug(sceneName);
  return class extends CommandAction {
    readonly name = `preview_scene_${id}`;
    displayName = `Preview: ${sceneName}`;
    description = `Send "${sceneName}" to preview (Studio Mode must be on)`;
    readonly groupName = 'Scenes';

    async onKeyDown() {
      await obsConnection.call('SetCurrentPreviewScene', { sceneName });
    }
  };
}
