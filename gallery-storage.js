const fs = require('fs/promises');
const nodeFs = require('fs');
const os = require('os');
const path = require('path');

const storage = path.resolve(process.env.GALLERY_STORAGE_DIR || path.join(os.homedir(), '.lagos-sistema', 'private-gallery'));
const legacyStorage = path.resolve(__dirname, 'private-gallery');
let initialization;

async function copyMissing(source, destination) {
  let entries;
  try { entries = await fs.readdir(source, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const from = path.join(source, entry.name), to = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await fs.mkdir(to, { recursive: true, mode: 0o700 });
      await copyMissing(from, to);
    } else if (entry.isFile()) {
      try { await fs.copyFile(from, to, nodeFs.constants.COPYFILE_EXCL); }
      catch (error) { if (error.code !== 'EEXIST') throw error; }
    }
  }
}

async function getGalleryStorage() {
  if (!initialization) initialization = (async () => {
    await fs.mkdir(storage, { recursive: true, mode: 0o700 });
    const samePath = process.platform === 'win32'
      ? storage.toLowerCase() === legacyStorage.toLowerCase()
      : storage === legacyStorage;
    if (!samePath) await copyMissing(legacyStorage, storage);
    return storage;
  })();
  return initialization;
}

getGalleryStorage.path = storage;
module.exports = getGalleryStorage;
