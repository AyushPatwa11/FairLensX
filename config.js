// Detect local development and prefer local backend when running on localhost.
// For production, set `window.FAIRLENS_API_BASE` to your deployed backend URL.
// Example production override (uncomment and edit):
// window.FAIRLENS_API_BASE = "https://fairlens-api.onrender.com";
if (typeof window !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '')) {
	// For local development, use the same hostname as the frontend but port 8001
	const port = '8001';
	const protocol = location.protocol === 'https:' ? 'https:' : 'http:';
	const hostname = location.hostname || '127.0.0.1';
	window.FAIRLENS_API_BASE = window.FAIRLENS_API_BASE || `${protocol}//${hostname}:${port}`;
} else {
	window.FAIRLENS_API_BASE = window.FAIRLENS_API_BASE || "https://fairlens-api-489l.onrender.com";
}
