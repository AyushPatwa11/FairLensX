// Detect local development and prefer local backend when running on localhost.
// For production, set `window.FAIRLENS_API_BASE` to your deployed backend URL.
// Example production override (uncomment and edit):
// window.FAIRLENS_API_BASE = "https://fairlens-api.onrender.com";
<<<<<<< HEAD
window.FAIRLENS_API_BASE = "http://127.0.0.1:8001";
=======

if (typeof window !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
	window.FAIRLENS_API_BASE = window.FAIRLENS_API_BASE || 'http://127.0.0.1:8001';
} else {
	window.FAIRLENS_API_BASE = window.FAIRLENS_API_BASE || "https://fairlens-api-489l.onrender.com";
}
>>>>>>> c6dbba4322f81e2b4b3962a7c9222169d5e57982
