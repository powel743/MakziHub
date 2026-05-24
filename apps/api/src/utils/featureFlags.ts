export function isEnabled(flag: 'FEATURE_ESCROW'): boolean {
  return process.env[flag] === 'true'
}
