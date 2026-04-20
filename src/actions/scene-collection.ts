import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function makeSceneCollectionAction(collectionName: string) {
  const id = slug(collectionName);
  return class extends CommandAction {
    readonly name = `switch_collection_${id}`;
    displayName = `Collection: ${collectionName}`;
    description = `Switch OBS to scene collection "${collectionName}"`;
    readonly groupName = 'Scene Collections';

    async onKeyDown() {
      await obsConnection.call('SetCurrentSceneCollection', { sceneCollectionName: collectionName });
    }
  };
}
