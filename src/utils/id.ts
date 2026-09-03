import { nanoid, customAlphabet } from 'nanoid';

const alphanumeric = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 28);

export function generateRequestId(): string {
  return nanoid(16);
}

export function generateApiKey(): string {
  return `tkg_${alphanumeric()}`;
}

export function generateSessionId(): string {
  return `sess_${nanoid(20)}`;
}
