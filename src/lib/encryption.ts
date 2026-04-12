import CryptoJS from 'crypto-js'

// In production, use a proper secret from env; never expose to client
const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'mongocraft-aes256-secret-key-2024'

export function encrypt(plaintext: string): string {
  return CryptoJS.AES.encrypt(plaintext, SECRET_KEY).toString()
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export function maskUri(uri: string): string {
  try {
    const url = new URL(uri)
    if (url.password) {
      url.password = '****'
    }
    return url.toString()
  } catch {
    // Not a valid URL; redact everything after @
    return uri.replace(/:([^@]+)@/, ':****@')
  }
}