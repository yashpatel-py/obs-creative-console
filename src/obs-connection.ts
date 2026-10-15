import OBSWebSocket from 'obs-websocket-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { CONFIG_PATH, migrateLegacyConfig } from './config-path.js';
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
  private connectedHandlers: Array<() => void> = [];
  private lastConfigError = '';
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
    return this.readConfig() ?? { ...DEFAULT_CONFIG };
  }

  // Returns null if the config file can't be parsed (e.g. mid-edit)
  private readConfig(): OBSConfig | null {
    migrateLegacyConfig();
    if (!existsSync(CONFIG_PATH)) {
      writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
      return { ...DEFAULT_CONFIG };
    }
    try {
      const raw = readFileSync(CONFIG_PATH, 'utf-8');
      const config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      this.lastConfigError = '';
      return config;
    } catch (e) {
      // Warn once per distinct error — this runs on every reconnect attempt. Don't log the
      // JSON parser's message: it can quote part of the password.
      const reason = e instanceof SyntaxError ? 'not valid JSON' : (e as Error).message;
      if (reason !== this.lastConfigError) {
        console.warn(`[OBS] Could not read ${CONFIG_PATH} (${reason}) — ignoring it until it's fixed`);
        this.lastConfigError = reason;
      }
      return null;
    }
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    // Re-read credentials so edits to the config file apply without restarting the plugin;
    // keep the current ones if the file can't be parsed
    const fresh = this.readConfig();
    if (fresh) Object.assign(this.config, { host: fresh.host, port: fresh.port, password: fresh.password });
    const url = `ws://${this.config.host}:${this.config.port}`;
    await this.obs.connect(url, this.config.password || undefined);
    this.connected = true;
    for (const handler of this.connectedHandlers) handler();
  }

  // Called after every successful connection made from now on
  onConnected(handler: () => void): void {
    this.connectedHandlers.push(handler);
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
