import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// Open fullscreen projector for program output
export class OpenProgramProjectorAction extends CommandAction {
  readonly name = 'open_program_projector';
  displayName = 'Open Program Projector';
  description = 'Open a fullscreen projector window for the program output';
  readonly groupName = 'Projector';

  async onKeyDown() {
    await obsConnection.call('OpenVideoMixProjector', {
      videoMixType: 'OBS_WEBSOCKET_VIDEO_MIX_TYPE_PROGRAM',
      monitorIndex: -1,
    });
  }
}

// Open fullscreen projector for preview output
export class OpenPreviewProjectorAction extends CommandAction {
  readonly name = 'open_preview_projector';
  displayName = 'Open Preview Projector';
  description = 'Open a fullscreen projector window for the preview output';
  readonly groupName = 'Projector';

  async onKeyDown() {
    await obsConnection.call('OpenVideoMixProjector', {
      videoMixType: 'OBS_WEBSOCKET_VIDEO_MIX_TYPE_PREVIEW',
      monitorIndex: -1,
    });
  }
}

// Open projector for a specific source
export function makeSourceProjectorAction(sourceName: string) {
  const id = slug(sourceName);
  return class extends CommandAction {
    readonly name = `open_projector_${id}`;
    displayName = `Projector: ${sourceName}`;
    description = `Open a fullscreen projector for "${sourceName}"`;
    readonly groupName = 'Projector';

    async onKeyDown() {
      await obsConnection.call('OpenSourceProjector', {
        sourceName,
        monitorIndex: -1,
      });
    }
  };
}
