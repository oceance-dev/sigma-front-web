export interface PwStrengthResult {
  length:  boolean
  lower:   boolean
  upper:   boolean
  digit:   boolean
  special: boolean
}

export function pwStrength(value: string): PwStrengthResult {
  return {
    length:  value.length >= 12 && value.length <= 128,
    lower:   /[a-z]/.test(value),
    upper:   /[A-Z]/.test(value),
    digit:   /\d/.test(value),
    special: /[^a-zA-Z0-9]/.test(value),
  }
}

export function pwValid(value: string): boolean {
  const s = pwStrength(value)
  return s.length && s.lower && s.upper && s.digit && s.special
}
