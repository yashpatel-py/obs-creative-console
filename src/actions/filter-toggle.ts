import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function makeFilterToggleAction(sourceName: string, filterName: string) {
  const id = `${slug(sourceName)}_${slug(filterName)}`;
  return class extends CommandAction {
    readonly name = `toggle_filter_${id}`;
    displayName = `Filter: ${filterName}`;
    description = `Toggle the "${filterName}" filter on "${sourceName}"`;
    readonly groupName = 'Filters';

    async onKeyDown() {
      const result = (await obsConnection.call('GetSourceFilter', {
        sourceName,
        filterName,
      })) as { filterEnabled: boolean };
      await obsConnection.call('SetSourceFilterEnabled', {
        sourceName,
        filterName,
        filterEnabled: !result.filterEnabled,
      });
    }
  };
}
