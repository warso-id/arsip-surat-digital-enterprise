/**
 * ============================================
 * ENCRYPTION WORKER - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL BACKGROUND CRYPTO OPERATIONS - SIAP PRODUKSI
 * Mendukung: AES-GCM, RSA-OAEP, ECDSA, HMAC,
 * PBKDF2, SHA-256/512, File Hashing, JWT
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

// ============================================
// MESSAGE HANDLER
// ============================================
self.onmessage = async (event) => {
  const { action, data, requestId } = event.data;

  try {
    let result;

    switch (action) {
      // Symmetric Encryption
      case 'encrypt': result = await handleEncrypt(data); break;
      case 'decrypt': result = await handleDecrypt(data); break;
      case 'encryptFile': result = await handleEncryptFile(data); break;
      case 'decryptFile': result = await handleDecryptFile(data); break;

      // Hashing
      case 'hash': result = await handleHash(data); break;
      case 'hashFile': result = await handleHashFile(data); break;
      case 'hashStream': result = await handleHashStream(data); break;

      // Key Generation
      case 'generateKey': result = await handleGenerateKey(data); break;
      case 'generateAESKey': result = await handleGenerateAESKey(data); break;
      case 'generateHMACKey': result = await handleGenerateHMACKey(data); break;
      case 'generateECDSAKey': result = await handleGenerateECDSAKey(data); break;
      case 'deriveKey': result = await handleDeriveKey(data); break;

      // Signing
      case 'sign': result = await handleSign(data); break;
      case 'signECDSA': result = await handleSignECDSA(data); break;
      case 'verify': result = await handleVerify(data); break;
      case 'verifyECDSA': result = await handleVerifyECDSA(data); break;

      // JWT
      case 'createJWT': result = await handleCreateJWT(data); break;
      case 'verifyJWT': result = await handleVerifyJWT(data); break;

      // Utilities
      case 'randomBytes': result = handleRandomBytes(data); break;
      case 'randomUUID': result = handleRandomUUID(); break;
      case 'base64Encode': result = handleBase64Encode(data); break;
      case 'base64Decode': result = handleBase64Decode(data); break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    self.postMessage({ requestId, success: true, data: result });

  } catch (error) {
    self.postMessage({ requestId, success: false, error: error.message });
  }
};

// ============================================
// AES-GCM SYMMETRIC ENCRYPTION
// ============================================
async function handleEncrypt({ plaintext, password, salt: providedSalt, iterations = 100000 }) {
  const encoder = new TextEncoder();
  const salt = providedSalt ? hexToUint8(providedSalt) : crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveAESKey(password, salt, iterations);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    encoder.encode(typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext))
  );

  // Combine: salt (16) + iv (12) + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return {
    ciphertext: arrayBufferToBase64(combined.buffer),
    salt: uint8ToHex(salt),
    iv: uint8ToHex(iv),
    algorithm: 'AES-256-GCM',
    iterations
  };
}

async function handleDecrypt({ ciphertext, password, iterations = 100000 }) {
  const combined = new Uint8Array(base64ToArrayBuffer(ciphertext));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);

  const key = await deriveAESKey(password, salt, iterations);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    encrypted
  );

  const decoder = new TextDecoder();
  const text = decoder.decode(decrypted);

  // Try parsing as JSON
  try { return JSON.parse(text); } catch { return text; }
}

async function handleEncryptFile({ fileBuffer, password }) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveAESKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    fileBuffer
  );

  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return combined.buffer;
}

async function handleDecryptFile({ encryptedBuffer, password }) {
  const combined = new Uint8Array(encryptedBuffer);
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);

  const key = await deriveAESKey(password, salt);

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    encrypted
  );
}

async function deriveAESKey(password, salt, iterations = 100000) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ============================================
// HASHING
// ============================================
async function handleHash({ data, algorithm = 'SHA-256' }) {
  const encoder = new TextEncoder();
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const hashBuffer = await crypto.subtle.digest(algorithm, encoder.encode(text));
  return {
    hash: arrayBufferToHex(hashBuffer),
    algorithm,
    length: hashBuffer.byteLength * 8
  };
}

async function handleHashFile({ fileBuffer, algorithm = 'SHA-256' }) {
  const hashBuffer = await crypto.subtle.digest(algorithm, fileBuffer);
  return {
    hash: arrayBufferToHex(hashBuffer),
    algorithm,
    length: hashBuffer.byteLength * 8
  };
}

async function handleHashStream({ chunks, algorithm = 'SHA-256' }) {
  // Process chunks incrementally
  let combined = new Uint8Array(0);
  for (const chunk of chunks) {
    const temp = new Uint8Array(combined.length + chunk.length);
    temp.set(combined, 0);
    temp.set(new Uint8Array(chunk), combined.length);
    combined = temp;
  }
  const hashBuffer = await crypto.subtle.digest(algorithm, combined);
  return arrayBufferToHex(hashBuffer);
}

// ============================================
// KEY GENERATION
// ============================================
async function handleGenerateKey({ type = 'RSA', modulusLength = 2048 }) {
  if (type === 'RSA') {
    return generateRSAKey(modulusLength);
  }
  throw new Error(`Unsupported key type: ${type}`);
}

async function handleGenerateAESKey({ length = 256 }) {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length },
    true,
    ['encrypt', 'decrypt']
  );
  const exported = await crypto.subtle.exportKey('raw', key);
  return {
    key: arrayBufferToBase64(exported),
    type: 'AES-GCM',
    length
  };
}

async function handleGenerateHMACKey({ hash = 'SHA-256' }) {
  const key = await crypto.subtle.generateKey(
    { name: 'HMAC', hash },
    true,
    ['sign', 'verify']
  );
  const exported = await crypto.subtle.exportKey('raw', key);
  return {
    key: arrayBufferToBase64(exported),
    type: 'HMAC',
    hash
  };
}

async function handleGenerateECDSAKey({ namedCurve = 'P-256' }) {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve },
    true,
    ['sign', 'verify']
  );
  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  return {
    publicKey: arrayBufferToBase64(publicKey),
    privateKey: arrayBufferToBase64(privateKey),
    type: 'ECDSA',
    curve: namedCurve
  };
}

async function generateRSAKey(modulusLength) {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt']
  );
  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  return {
    publicKey: arrayBufferToBase64(publicKey),
    privateKey: arrayBufferToBase64(privateKey),
    type: 'RSA-OAEP',
    modulusLength
  };
}

async function handleDeriveKey({ password, salt, algorithm = 'AES-GCM', length = 256, iterations = 100000 }) {
  const key = await deriveAESKey(password, hexToUint8(salt || '00'.repeat(16)), iterations);
  const exported = await crypto.subtle.exportKey('raw', key);
  return {
    key: arrayBufferToBase64(exported),
    algorithm,
    length,
    iterations
  };
}

// ============================================
// SIGNING & VERIFICATION
// ============================================
async function handleSign({ message, secret, algorithm = 'SHA-256' }) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: algorithm },
    false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return {
    signature: arrayBufferToBase64(signature),
    algorithm: `HMAC-${algorithm}`
  };
}

async function handleSignECDSA({ message, privateKey, curve = 'P-256' }) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'pkcs8', base64ToArrayBuffer(privateKey),
    { name: 'ECDSA', namedCurve: curve },
    false, ['sign']
  );
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key, encoder.encode(message)
  );
  return { signature: arrayBufferToBase64(signature), algorithm: 'ECDSA-SHA256', curve };
}

async function handleVerify({ message, signature, secret, algorithm = 'SHA-256' }) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: algorithm },
    false, ['verify']
  );
  return crypto.subtle.verify(
    'HMAC', key,
    base64ToArrayBuffer(signature),
    encoder.encode(message)
  );
}

async function handleVerifyECDSA({ message, signature, publicKey, curve = 'P-256' }) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'spki', base64ToArrayBuffer(publicKey),
    { name: 'ECDSA', namedCurve: curve },
    false, ['verify']
  );
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    key, base64ToArrayBuffer(signature),
    encoder.encode(message)
  );
}

// ============================================
// JWT
// ============================================
async function handleCreateJWT({ payload, secret, expiresIn = 3600 }) {
  const encoder = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + expiresIn, jti: crypto.randomUUID() };

  const headerB64 = btoa(JSON.stringify(header)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(claims)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signatureInput));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

async function handleVerifyJWT({ token, secret }) {
  const encoder = new TextEncoder();
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const signatureInput = `${parts[0]}.${parts[1]}`;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);

  const signatureBytes = Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(signatureInput));

  if (!valid) throw new Error('Invalid signature');

  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');

  return { valid: true, payload };
}

// ============================================
// UTILITIES
// ============================================
function handleRandomBytes({ length = 32 }) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return {
    hex: uint8ToHex(bytes),
    base64: arrayBufferToBase64(bytes.buffer)
  };
}

function handleRandomUUID() {
  return crypto.randomUUID();
}

function handleBase64Encode({ data }) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));
  return arrayBufferToBase64(bytes.buffer);
}

function handleBase64Decode({ base64 }) {
  const bytes = new Uint8Array(base64ToArrayBuffer(base64));
  const decoder = new TextDecoder();
  const text = decoder.decode(bytes);
  try { return JSON.parse(text); } catch { return text; }
}

// ============================================
// CONVERSION HELPERS
// ============================================
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('');
}

function uint8ToHex(uint8) {
  return Array.from(uint8, b => b.toString(16).padStart(2, '0')).join('');
}

function hexToUint8(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  return bytes;
}

function estimateSize(value) {
  try { return JSON.stringify(value).length; } catch { return 0; }
}

console.log('✅ Encryption Worker v3 initialized');
