/**
 * ENCRYPTION WORKER - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Background encryption/decryption operations
 */

// Handle messages from main thread
self.onmessage = async (event) => {
  const { action, data, requestId } = event.data;
  
  try {
    let result;
    
    switch (action) {
      case 'encrypt':
        result = await handleEncrypt(data);
        break;
      case 'decrypt':
        result = await handleDecrypt(data);
        break;
      case 'hash':
        result = await handleHash(data);
        break;
      case 'hashFile':
        result = await handleHashFile(data);
        break;
      case 'generateKey':
        result = await handleGenerateKey(data);
        break;
      case 'sign':
        result = await handleSign(data);
        break;
      case 'verify':
        result = await handleVerify(data);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    self.postMessage({ requestId, success: true, data: result });
    
  } catch (error) {
    self.postMessage({ requestId, success: false, error: error.message });
  }
};

/**
 * Encrypt data
 */
async function handleEncrypt(data) {
  const { plaintext, password } = data;
  
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Generate key from password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  
  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  
  // Convert to base64
  return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypt data
 */
async function handleDecrypt(data) {
  const { ciphertext, password } = data;
  
  const combined = base64ToArrayBuffer(ciphertext);
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);
  
  // Generate key from password
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    encrypted
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Hash data
 */
async function handleHash(data) {
  const encoder = new TextEncoder();
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return arrayBufferToHex(hashBuffer);
}

/**
 * Hash file
 */
async function handleHashFile(data) {
  const { file } = data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', file);
  return arrayBufferToHex(hashBuffer);
}

/**
 * Generate key pair
 */
async function handleGenerateKey() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );
  
  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  
  return {
    publicKey: arrayBufferToBase64(publicKey),
    privateKey: arrayBufferToBase64(privateKey)
  };
}

/**
 * Sign data
 */
async function handleSign(data) {
  const { message, secret } = data;
  const encoder = new TextEncoder();
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );
  
  return arrayBufferToBase64(signature);
}

/**
 * Verify signature
 */
async function handleVerify(data) {
  const { message, signature, secret } = data;
  const encoder = new TextEncoder();
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  return crypto.subtle.verify(
    'HMAC',
    key,
    base64ToArrayBuffer(signature),
    encoder.encode(message)
  );
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert ArrayBuffer to Hex
 */
function arrayBufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

console.log('✅ Encryption Worker initialized');
