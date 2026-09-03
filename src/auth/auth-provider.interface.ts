export interface LoginResult {
  ok: boolean;
  mode: string;
  message: string;
}

export interface AuthProvider {
  readonly name: string;
  login(): Promise<LoginResult>;
  logout(): Promise<void>;
  getToken(): Promise<string | null>;
}
