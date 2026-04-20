import { CommandAction } from '@logitech/plugin-sdk';
import { obsConnection } from '../obs-connection.js';

export class ToggleVirtualCameraAction extends CommandAction {
  readonly name = 'toggle_virtual_camera';
  displayName = 'Toggle Virtual Camera';
  description = 'Turn the OBS virtual camera on or off';
  readonly groupName = 'General';
  async onKeyDown() { await obsConnection.call('ToggleVirtualCam'); }
}

export class StartVirtualCameraAction extends CommandAction {
  readonly name = 'start_virtual_camera';
  displayName = 'Start Virtual Camera';
  description = 'Turn the OBS virtual camera on';
  readonly groupName = 'General';
  async onKeyDown() { await obsConnection.call('StartVirtualCam'); }
}

export class StopVirtualCameraAction extends CommandAction {
  readonly name = 'stop_virtual_camera';
  displayName = 'Stop Virtual Camera';
  description = 'Turn the OBS virtual camera off';
  readonly groupName = 'General';
  async onKeyDown() { await obsConnection.call('StopVirtualCam'); }
}
