/**
 * Mask a person's display name for public display (PRD §8.3).
 * "John Mwangi" → "J*** M***", "Madonna" → "M***", "" → "".
 */
export function maskName(name?: string | null): string {
  if (!name || !name.trim()) return ''
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.map((p) => `${p[0].toUpperCase()}***`).join(' ')
}

/**
 * Mask a phone number for the lister-facing inbox (PRD §6.3): first 4 + *** + last 3.
 * "0722345678" → "0722***678", "254722345678" → "2547***678".
 * A leading "+" and spaces are stripped first.
 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return ''
  const clean = phone.replace(/\s+/g, '').replace(/^\+/, '')
  if (clean.length < 7) return clean
  return `${clean.slice(0, 4)}***${clean.slice(-3)}`
}

/**
 * Mask an email for display: "john@gmail.com" → "j***@gmail.com".
 */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return email ?? ''
  const [local, domain] = email.split('@')
  return `${local.slice(0, 1)}***@${domain}`
}
