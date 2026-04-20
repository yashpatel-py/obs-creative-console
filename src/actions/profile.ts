import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function makeProfileAction(profileName: string) {
  const id = slug(profileName);
  return class extends CommandAction {
    readonly name = `switch_profile_${id}`;
    displayName = `Profile: ${profileName}`;
    description = `Switch OBS to profile "${profileName}"`;
    readonly groupName = 'Profiles';

    async onKeyDown() {
      await obsConnection.call('SetCurrentProfile', { profileName });
    }
  };
}
