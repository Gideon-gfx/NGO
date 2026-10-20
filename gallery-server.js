const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const storage = path.join(__dirname, 'private-gallery');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');

module.exports = function installGallery(app, mailer) {
  const challenges = new Map(), sessions = new Map(), limits = new Map();
  const ttl = 10 * 60 * 1000;
  const timer = setInterval(() => {
    for (const map of [challenges, sessions, limits]) for (const [key, value] of map) if (value.expires < Date.now()) map.delete(key);
  }, 60000);
  timer.unref();
  app.use('/api/gallery', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  function limited(req, key, max) {
    const id = key + ':' + req.ip;
    let entry = limits.get(id);
    if (!entry || entry.expires < Date.now()) limits.set(id, entry = { count: 0, expires: Date.now() + ttl });
    return ++entry.count > max;
  }
  function allowed(req, res, next) {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    const session = sessions.get(digest(token));
    if (!session || session.expires < Date.now()) return res.status(401).json({ error: 'Please verify your email again.' });
    next();
  }
  app.get('/gallery', (req, res) => res.sendFile(path.join(__dirname, 'public/gallery.html')));
  app.post('/api/gallery/otp', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (req.body.agreed !== true || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/.test(email) || email.length > 254)
      return res.status(400).json({ error: 'Agree to the privacy terms and enter a valid Gmail address.' });
    if (limited(req, 'otp', 5) || limited({ ip: email }, 'email', 3)) return res.status(429).json({ error: 'Too many requests. Please try again in 10 minutes.' });
    const id = crypto.randomBytes(24).toString('hex'), code = String(crypto.randomInt(100000, 1000000));
    challenges.set(id, { hash: digest(id + code), attempts: 0, expires: Date.now() + ttl });
    try {
      await mailer.sendMail({ from: process.env.GMAIL_USER, to: email, subject: 'Your Lagos Sistema gallery code', text: `Your verification code is ${code}. It expires in 10 minutes. Do not share this code. This does not subscribe you to our mailing list.` });
      res.json({ challenge: id });
    } catch (error) { console.error('Gallery mail failure:', error.code || 'MAIL_ERROR', error.responseCode || ''); challenges.delete(id); res.status(503).json({ error: 'We could not send your code. Please try again later.' }); }
  });
  app.post('/api/gallery/verify', (req, res) => {
    const { challenge, code } = req.body;
    const entry = challenges.get(challenge);
    if (limited(req, 'verify', 30)) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    if (!entry || entry.expires < Date.now() || ++entry.attempts > 5 || !/^\d{6}$/.test(String(code)) || entry.hash !== digest(challenge + code)) {
      if (entry && entry.attempts >= 5) challenges.delete(challenge);
      return res.status(400).json({ error: 'Invalid or expired code. Request a new code if needed.' });
    }
    challenges.delete(challenge);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(digest(token), { expires: Date.now() + ttl });
    res.json({ token, expiresIn: ttl });
  });
  app.post('/api/gallery/logout', allowed, (req, res) => { sessions.delete(digest(req.headers.authorization.slice(7))); res.sendStatus(204); });
  app.get('/api/gallery/media', allowed, async (req, res) => {
    try { const items = JSON.parse(await fs.readFile(path.join(storage, 'manifest.json'), 'utf8')); res.json(items.map(({ id, title, caption, type }) => ({ id, title, caption, type }))); }
    catch (e) { if (e.code === 'ENOENT') return res.json([]); res.status(500).json({ error: 'Gallery unavailable.' }); }
  });
  app.get('/api/gallery/media/:id', allowed, async (req, res) => {
    try {
      const items = JSON.parse(await fs.readFile(path.join(storage, 'manifest.json'), 'utf8'));
      const item = items.find(x => x.id === req.params.id);
      if (!item) return res.sendStatus(404);
      const key = Buffer.from(process.env.GALLERY_ENCRYPTION_KEY || (await fs.readFile(path.join(storage, 'encryption.key'), 'utf8')).trim(), 'hex');
      if (key.length !== 32) return res.sendStatus(503);
      const encrypted = await fs.readFile(path.join(storage, item.id + '.enc'));
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, encrypted.subarray(0, 12));
      decipher.setAuthTag(encrypted.subarray(12, 28));
      const data = Buffer.concat([decipher.update(encrypted.subarray(28)), decipher.final()]);
      res.set({ 'Content-Type': item.type, 'Content-Disposition': 'inline', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin' });
      res.send(data);
    } catch { res.status(503).json({ error: 'Media unavailable.' }); }
  });
  app.post('/api/subscribe', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || req.body.consent !== true) return res.status(400).json({ error: 'Enter your email and agree to receive updates.' });
    if (limited(req, 'subscribe', 5)) return res.status(429).json({ error: 'Please try again in 10 minutes.' });
    try {
      await mailer.sendMail({ from: process.env.GMAIL_USER, to: process.env.GMAIL_USER, subject: 'Lagos Sistema mailing-list subscription', text: `Email: ${email}\nConsented to receive Lagos Sistema updates: yes\nDate: ${new Date().toISOString()}` });
      res.json({ success: true });
    } catch { res.status(503).json({ error: 'Subscription could not be delivered. Please try again later.' }); }
  });
};
