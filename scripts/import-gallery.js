require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
(async () => {
  const [source, ...title] = process.argv.slice(2);
  const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm' };
  const type = types[path.extname(source || '').toLowerCase()];
  const key = Buffer.from(process.env.GALLERY_ENCRYPTION_KEY || (await fs.readFile(path.join(__dirname, '../private-gallery/encryption.key'), 'utf8')).trim(), 'hex');
  if (!source || !type || key.length !== 32) throw Error('Usage: node scripts/import-gallery.js <file> <title>. Set GALLERY_ENCRYPTION_KEY to 64 hexadecimal characters.');
  const dir = path.join(__dirname, '../private-gallery');
  await fs.mkdir(dir, { recursive: true });
  const id = crypto.randomUUID(), iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(await fs.readFile(source)), cipher.final()]);
  await fs.writeFile(path.join(dir, id + '.enc'), Buffer.concat([iv, cipher.getAuthTag(), data]));
  let items = [];
  try { items = JSON.parse(await fs.readFile(path.join(dir, 'manifest.json'), 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  items.push({ id, title: title.join(' ') || 'Lagos Sistema', type });
  await fs.writeFile(path.join(dir, 'manifest.json'), JSON.stringify(items, null, 2));
  console.log('Encrypted gallery item added. Remove any public copy if it must be private.');
})().catch(e => { console.error(e.message); process.exitCode = 1; });
