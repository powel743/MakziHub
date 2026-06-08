import { describe, it, expect } from 'vitest'
import { maskName, maskPhone, maskEmail } from '../mask'

describe('maskEmail', () => {
  it('masks the local part', () => {
    expect(maskEmail('john@gmail.com')).toBe('j***@gmail.com')
    expect(maskEmail('ab@x.co')).toBe('a***@x.co')
  })
  it('returns empty/invalid input unchanged', () => {
    expect(maskEmail('')).toBe('')
    expect(maskEmail('notanemail')).toBe('notanemail')
  })
})

describe('maskPhone', () => {
  it('shows first 4 and last 3 digits', () => {
    expect(maskPhone('0722345678')).toBe('0722***678')
    expect(maskPhone('254722345678')).toBe('2547***678')
  })
  it('strips a leading + and spaces', () => {
    expect(maskPhone('+254722345678')).toBe('2547***678')
  })
  it('returns empty for empty input', () => {
    expect(maskPhone('')).toBe('')
  })
})

describe('maskName', () => {
  it('masks each word to initial + ***', () => {
    expect(maskName('John Mwangi')).toBe('J*** M***')
    expect(maskName('Madonna')).toBe('M***')
  })
  it('returns empty string for empty input', () => {
    expect(maskName('')).toBe('')
    expect(maskName(null)).toBe('')
  })
})
