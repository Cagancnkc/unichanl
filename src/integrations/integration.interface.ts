export interface DetectionResult {
  installed: boolean;
  version?: string;
  configPath?: string;
  binaryPath?: string;
  reason?: string;
}

export interface ToolConfigurationSnapshot {
  raw: unknown;
  configPath: string;
  isConfiguredForUnichanl: boolean;
}

export interface BackupResult {
  backupPath: string;
  originalPath: string;
  timestamp: string;
}

export interface ConfigurationResult {
  ok: boolean;
  message: string;
  writtenPath?: string;
}

export interface ValidationResult {
  ok: boolean;
  message: string;
}

export interface CanConfigureResult {
  supported: boolean;
  reason?: string;
}

export interface ToolIntegration {
  readonly name: string;
  readonly displayName: string;
  detect(): Promise<DetectionResult>;
  getConfiguration(): Promise<ToolConfigurationSnapshot | null>;
  canConfigureGateway(): Promise<CanConfigureResult>;
  backupConfiguration(): Promise<BackupResult | null>;
  configureGateway(gatewayUrl: string, localApiKey: string): Promise<ConfigurationResult>;
  validate(gatewayUrl: string, localApiKey: string): Promise<ValidationResult>;
  uninstall(): Promise<ConfigurationResult>;
}
