import OBSWebSocket from 'obs-websocket-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { setupNotifications } from './notifications.js';

export type OBSConfig = {
  host: string;
  port: number;
  password: string;
  // Text source presets are the only thing that can't be auto-discovered
  textSources: Array<{ sourceName: string; presets: string[] }>;
  // Optional overrides — if blank, auto-detected from OBS
  micSource: string;
  desktopSource: string;
};

const CONFIG_PATH = join(homedir(), '.obs-controller-config.json');

const DEFAULT_CONFIG: OBSConfig = {
  host: 'localhost',
  port: 4455,
  password: '',
  textSources: [],
  micSource: '',
  desktopSource: '',
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
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    const url = `ws://${this.config.host}:${this.config.port}`;
    await this.obs.connect(url, this.config.password || undefined);
    this.connected = true;
  }

  connectWithRetry(): void {
    this.connect().catch(() => this.scheduleReconnect());
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => this.scheduleReconnect());
    }, 5000);
  }

  async call(request: string, data?: Record<string, unknown>): Promise<unknown> {
    if (!this.connected) await this.connect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.obs as any).call(request, data);
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const obsConnection = new OBSConnection();
