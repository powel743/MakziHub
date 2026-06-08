import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE')}`
}

export function formatDate(date: string): string {
  try {
    return format(parseISO(date), 'd MMM yyyy')
  } catch {
    return date
  }
}

export function formatRelative(date: string): string {
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true })
  } catch {
    return date
  }
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone
  const clean = phone.replace(/\s/g, '')
  const visible = clean.slice(-3)
  return `${clean.slice(0, 4)} ***${visible}`
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email
  const [local, domain] = email.split('@')
  return `${local.slice(0, 1)}***@${domain}`
}

export function whatsappUrl(phone: string, listing_title: string): string {
  const clean = phone.replace(/\D/g, '')
  const kenyan = clean.startsWith('0') ? `254${clean.slice(1)}` : clean
  const msg = encodeURIComponent(`Hi, I'm interested in ${listing_title} listed on MakaziHub`)
  return `https://wa.me/${kenyan}?text=${msg}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatHouseType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

export function formatBedrooms(n: number): string {
  if (n === 0) return 'Studio'
  return `${n} Bed${n > 1 ? 's' : ''}`
}
