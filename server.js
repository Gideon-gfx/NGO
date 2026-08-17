const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Define the site's links/routes
const links = [
	{ path: '/', name: 'Home', method: 'GET' },
	{ path: '/about', name: 'About', method: 'GET' },
	{ path: '/projects', name: 'Projects', method: 'GET' },
	{ path: '/events', name: 'Events', method: 'GET' },
	{ path: '/volunteer', name: 'Volunteer', method: 'GET' },
	{ path: '/donate', name: 'Donate', method: 'GET/POST' },
	{ path: '/contact', name: 'Contact', method: 'GET/POST' },
	{ path: '/blog', name: 'Blog', method: 'GET' },
	{ path: '/login', name: 'Login', method: 'GET/POST' },
	{ path: '/signup', name: 'Sign Up', method: 'GET/POST' },
	{ path: '/links', name: 'Links (json)', method: 'GET' }
];

// Root: show simple HTML with all links
app.get('/', (req, res) => {
	const items = links
		.filter(l => l.path !== '/')
		.map(l => `<li><a href="${l.path}">${l.name}</a> (${l.method})</li>`)
		.join('');
	res.send(`<!doctype html><html><head><meta charset="utf-8"><title>NGO</title></head><body><h1>Welcome</h1><ul>${items}</ul></body></html>`);
});

['/slum2school', '/projects', '/events', '/volunteer', '/blog'].forEach(p => {
	app.get(p, (req, res) => {
		res.send(`<!doctype html><html><head><meta charset="utf-8"><title>${p}</title></head><body><h1>${p.replace('/', '') || 'home'}</h1><p>Content for ${p}</p></body></html>`);
	});
});
// Generic GET handlers for simple pages
['/about', '/projects', '/events', '/volunteer', '/blog'].forEach(p => {
	app.get(p, (req, res) => {
		res.send(`<!doctype html><html><head><meta charset="utf-8"><title>${p}</title></head><body><h1>${p.replace('/', '') || 'home'}</h1><p>Content for ${p}</p></body></html>`);
	});
});

// Contact routes
app.get('/contact', (req, res) => {
	res.send('<form method="post" action="/contact"><input name="name" placeholder="Name"/><input name="email" placeholder="Email"/><textarea name="message" placeholder="Message"></textarea><button type="submit">Send</button></form>');
});
app.post('/contact', (req, res) => {
	// In a real app you'd validate and process the message
	res.json({ status: 'ok', received: req.body });
});

// Donate routes
app.get('/donate', (req, res) => {
	res.send('<h1>Donate</h1><form method="post" action="/donate"><input name="amount" placeholder="Amount"/><button type="submit">Donate</button></form>');
});
app.post('/donate', (req, res) => {
	res.json({ status: 'ok', donation: req.body });
});

// Apply routes
app.post('/apply', (req, res) => {
	res.json({ status: 'ok', application: req.body });
});

// Auth routes
app.get('/login', (req, res) => {
	res.send('<form method="post" action="/login"><input name="email" placeholder="Email"/><input name="password" type="password" placeholder="Password"/><button type="submit">Log in</button></form>');
});
app.post('/login', (req, res) => {
	res.json({ status: 'ok', auth: false, received: { email: req.body.email } });
});

app.get('/signup', (req, res) => {
	res.send('<form method="post" action="/signup"><input name="name" placeholder="Name"/><input name="email" placeholder="Email"/><input name="password" type="password" placeholder="Password"/><button type="submit">Sign up</button></form>');
});
app.post('/signup', (req, res) => {
	res.json({ status: 'ok', user: { email: req.body.email, name: req.body.name } });
});

// Links JSON endpoint
app.get('/links', (req, res) => res.json(links));

// 404 fallback
app.use((req, res) => res.status(404).send('Not found'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
