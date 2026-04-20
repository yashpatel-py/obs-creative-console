import OBSWebSocket from 'obs-websocket-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { setupNotifications } from './notifications.js';

export type OBSConfig = {
  host: string;
  port: number;
  password: string;
  scenes: string[];
  sources: string[];
  micSource: string;
  desktopSource: string;
};

const CONFIG_PATH = join(homedir(), '.obs-controller-config.json');

const DEFAULT_CONFIG: OBSConfig = {
  host: 'localhost',
  port: 4455,
  password: '',
  scenes: ['Scene 1', 'Scene 2', 'Scene 3'],
  sources: [],
  micSource: 'Mic/Aux',
  desktopSource: 'Desktop Audio',
};

class OBSConnection {
  readonly obs = new OBSWebSocket();
  private connected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  config: OBSConfig;

  constructor() {
    this.config = this.loadConfig();
    this.obs.on('ConnectionClosed', () => {
      this.connected = false;
      this.scheduleReconnect();
    });
    setupNotifications(this.obs);
  }

  loadConfig(): OBSConfig {
    if (!existsSync(CONFIG_PATH)) {
      writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
      return { ...DEFAULT_CONFIG };
    }
    try {
      const raw = readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      // migrate old sceneSlots format
      if (parsed.sceneSlots && !parsed.scenes) {
        parsed.scenes = Object.values(parsed.sceneSlots as Record<string, string>);
        delete parsed.sceneSlots;
      }
      // migrate old sources-as-objects format
      if (Array.isArray(parsed.sources) && parsed.sources[0]?.name) {
        parsed.sources = (parsed.sources as Array<{ name: string }>).map((s) => s.name);
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    try {
      const url = `ws://${this.config.host}:${this.config.port}`;
      await this.obs.connect(url, this.config.password || undefined);
      this.connected = true;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  async call(
    request: string,
    data?: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.connected) await this.connect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.obs as any).call(request, data);
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const obsConnection = new OBSConnection();
