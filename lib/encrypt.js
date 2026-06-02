const crypto = require('crypto');

function getKey() {
  const secret = process.env.ENCRYPTION_SECRET || 'metaflow-default-secret-key-32ch';
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(ciphertext) {
  const [ivHex, encrypted] = ciphertext.split(':');
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
