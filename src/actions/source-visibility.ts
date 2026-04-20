import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

async function getSceneItemId(sceneName: string, sourceName: string): Promise<number | null> {
  const data = (await obsConnection.call('GetSceneItemList', { sceneName })) as {
    sceneItems: Array<{ sourceName: string; sceneItemId: number }>;
  };
  return data.sceneItems.find((i) => i.sourceName === sourceName)?.sceneItemId ?? null;
}

async function getCurrentScene(): Promise<string> {
  const res = (await obsConnection.call('GetCurrentProgramScene')) as { currentProgramSceneName: string };
  return res.currentProgramSceneName;
}

export function makeSourceVisibilityActions(sourceName: string) {
  const id = slug(sourceName);

  class ShowSourceAction extends CommandAction {
    readonly name = `show_source_${id}`;
    displayName = `Show: ${sourceName}`;
    description = `Make "${sourceName}" visible in OBS`;
    readonly groupName = 'Source Visibility';
    async onKeyDown() {
      const sceneName = await getCurrentScene();
      const sceneItemId = await getSceneItemId(sceneName, sourceName);
      if (sceneItemId != null)
        await obsConnection.call('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled: true });
    }
  }

  class HideSourceAction extends CommandAction {
    readonly name = `hide_source_${id}`;
    displayName = `Hide: ${sourceName}`;
    description = `Hide "${sourceName}" in OBS`;
    readonly groupName = 'Source Visibility';
    async onKeyDown() {
      const sceneName = await getCurrentScene();
      const sceneItemId = await getSceneItemId(sceneName, sourceName);
      if (sceneItemId != null)
        await obsConnection.call('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled: false });
    }
  }

  class ToggleSourceAction extends CommandAction {
    readonly name = `toggle_source_${id}`;
    displayName = `Toggle: ${sourceName}`;
    description = `Toggle visibility of "${sourceName}" in OBS`;
    readonly groupName = 'Source Visibility';
    async onKeyDown() {
      const sceneName = await getCurrentScene();
      const sceneItemId = await getSceneItemId(sceneName, sourceName);
      if (sceneItemId == null) return;
      const items = (await obsConnection.call('GetSceneItemList', { sceneName })) as {
        sceneItems: Array<{ sceneItemId: number; sceneItemEnabled: boolean }>;
      };
      const item = items.sceneItems.find((i) => i.sceneItemId === sceneItemId);
      if (item)
        await obsConnection.call('SetSceneItemEnabled', {
          sceneName,
          sceneItemId,
          sceneItemEnabled: !item.sceneItemEnabled,
        });
    }
  }

  return [new ShowSourceAction(), new HideSourceAction(), new ToggleSourceAction()];
}
