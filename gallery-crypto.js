const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

function decodeKey(value) {
  const hex = String(value || '').trim();
  if (!/^[a-f0-9]{64}$/i.test(hex)) {
    const error = new Error('Gallery encryption key must be exactly 32 bytes of hexadecimal data.');
    error.code = 'GALLERY_KEY_INVALID';
    throw error;
  }
  return Buffer.from(hex, 'hex');
}

module.exports = async function getEncryptionKey(storage) {
  const configured = String(process.env.GALLERY_ENCRYPTION_KEY || '').trim();
  if (configured) return decodeKey(configured);

  await fs.mkdir(storage, { recursive: true });
  const file = path.join(storage, 'encryption.key');
  try {
    return decodeKey(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const key = crypto.randomBytes(32);
  let handle;
  try {
    handle = await fs.open(file, 'wx', 0o600);
    await handle.writeFile(key.toString('hex'));
    await handle.sync();
    return key;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    return decodeKey(await fs.readFile(file, 'utf8'));
  } finally {
    if (handle) await handle.close();
  }
};
