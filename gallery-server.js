const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const getEncryptionKey = require('./gallery-crypto');
const storage = path.join(__dirname, 'private-gallery');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');

module.exports = function installGallery(app, mailer) {
  const challenges = new Map(), sessions = new Map(), limits = new Map();
  const siteUrl = (process.env.SITE_URL || 'https://lagossistema.com').replace(/\/$/, '');
  const logoPath = path.join(__dirname, 'public/images/logo.png');
  async function sendBrandedMail({ to, subject, heading, intro, body, code, buttonLabel, buttonUrl }) {
    const logo = await fs.readFile(logoPath);
    const button = buttonLabel && buttonUrl ? '<tr><td align="center" style="padding:24px 0"><a href="' + buttonUrl + '" style="background:#174c38;color:#fff;text-decoration:none;padding:13px 24px;border-radius:6px;display:inline-block;font-weight:bold">' + buttonLabel + '</a></td></tr>' : '';
    const codeRow = code ? '<tr><td align="center" style="padding:18px;background:#f4f6f1;border-radius:8px"><span style="font-size:30px;letter-spacing:9px;font-weight:bold;color:#174c38">' + code + '</span></td></tr>' : '';
    const legal = '<tr><td style="padding-top:24px;border-top:1px solid #e4e9e3;color:#607269;font-size:12px;line-height:1.7">Please view our community gallery respectfully. Do not copy, record or share media without permission.<br><a href="' + siteUrl + '/privacy-policy" style="color:#174c38">Privacy Policy</a> &nbsp;·&nbsp; <a href="' + siteUrl + '/terms-of-use" style="color:#174c38">Terms of Use</a></td></tr>';
    const html = '<!doctype html><html><body style="margin:0;background:#f4f6f1;font-family:Arial,Helvetica,sans-serif;color:#263b32"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f1;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden"><tr><td align="center" style="padding:26px 28px 20px;border-bottom:1px solid #edf0eb"><img src="cid:lagos-sistema-logo" alt="Lagos Sistema" width="150" style="display:block;width:150px;height:auto;border:0"></td></tr><tr><td style="padding:30px 32px 34px"><p style="margin:0 0 8px;color:#98713c;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">LAGOS SISTEMA · COMMUNITY GALLERY</p><h1 style="margin:0 0 16px;color:#174c38;font-size:25px;line-height:1.3">' + heading + '</h1><p style="margin:0 0 20px;font-size:15px;line-height:1.7">' + intro + '</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0">' + codeRow + button + '<tr><td style="padding-top:18px;font-size:14px;line-height:1.7">' + body + '</td></tr>' + legal + '</table></td></tr><tr><td align="center" style="background:#174c38;color:#fff;padding:17px;font-size:12px">Lagos Sistema · Music, opportunity and stronger communities</td></tr></table></td></tr></table></body></html>';
    const plain = heading + '\n\n' + intro + (code ? '\n\nYour one-time code: ' + code + '\nIt expires in 10 minutes.' : '') + '\n\n' + body.replace(/<[^>]*>/g, '') + '\n\nPrivacy Policy: ' + siteUrl + '/privacy-policy\nTerms of Use: ' + siteUrl + '/terms-of-use\n\nLagos Sistema';
    return mailer.sendMail({ from: { name: 'Lagos Sistema', address: process.env.GMAIL_USER }, to, subject, text: plain, html, attachments: [{ filename: 'lagos-sistema-logo.png', content: logo, contentType: 'image/png', cid: 'lagos-sistema-logo', contentDisposition: 'inline' }] });
  }

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
    challenges.set(id, { hash: digest(id + code), email, attempts: 0, expires: Date.now() + ttl });
    try {
      await sendBrandedMail({ to: email, subject: 'Your Lagos Sistema gallery verification code', heading: 'Your gallery access code', intro: 'Use this one-time code to verify your email and view the Lagos Sistema community gallery.', code, body: 'This code expires in 10 minutes. If you did not request it, you can ignore this email. Gallery verification does not subscribe you to mailing list updates.' });
      res.json({ challenge: id });
    } catch (error) { console.error('Gallery mail failure:', error.code || 'MAIL_ERROR', error.responseCode || ''); challenges.delete(id); res.status(503).json({ error: 'We could not send your code. Please try again later.' }); }
  });
  app.post('/api/gallery/verify', async (req, res) => {
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
    try { await sendBrandedMail({ to: entry.email, subject: 'Thank you for visiting the Lagos Sistema gallery', heading: 'Thank you for being here', intro: 'Your email is verified and your gallery access is ready.', body: 'Thank you for taking a moment to respect the privacy of our students, families and community. We hope these moments of music and connection bring a smile to your day.', buttonLabel: 'View the gallery', buttonUrl: siteUrl + '/gallery' }); } catch (mailError) { console.error('Gallery thank-you email failure:', mailError.code || 'MAIL_ERROR', mailError.responseCode || ''); }
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
      const key = await getEncryptionKey(storage);
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
      await sendBrandedMail({ to: process.env.GMAIL_USER, subject: 'Lagos Sistema mailing-list subscription', heading: 'Thank you for subscribing', intro: 'A new reader has joined the Lagos Sistema mailing list.', body: 'Subscriber: ' + email + '<br>Consent recorded: yes<br>Date: ' + new Date().toISOString() });
      res.json({ success: true });
    } catch { res.status(503).json({ error: 'Subscription could not be delivered. Please try again later.' }); }
  });
};
