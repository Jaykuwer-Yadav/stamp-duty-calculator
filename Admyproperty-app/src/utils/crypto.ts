import CryptoJS from 'crypto-js';

// Master Client-side Secret Key to protect Firestore text data from leaks
const MASTER_CRYPTO_KEY = 'admyproperty_vault_key_2026';

/**
 * Encrypts cleartext message using AES-256
 */
export const encryptMessage = (text: string): string => {
  if (!text) return '';
  try {
    return CryptoJS.AES.encrypt(text.trim(), MASTER_CRYPTO_KEY).toString();
  } catch (e) {
    console.error('Encryption failed:', e);
    return text;
  }
};

/**
 * Decrypts ciphertext message using AES-256
 */
export const decryptMessage = (ciphertext: string): string => {
  if (!ciphertext) return '';
  try {
    // If it doesn't look like AES ciphertext, don't try to decrypt it to avoid crypto-js errors
    if (!ciphertext.startsWith('U2FsdGVkX1')) {
      return ciphertext;
    }
    const bytes = CryptoJS.AES.decrypt(ciphertext, MASTER_CRYPTO_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || ciphertext;
  } catch (e) {
    console.warn('Decryption failed, returning raw ciphertext:', e);
    return ciphertext;
  }
};
