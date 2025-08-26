import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

// Utilities
const storage = {
	get(key, fallback) {
		try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
	},
	set(key, value) {
		try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
	},
	remove(key) {
		try { localStorage.removeItem(key); } catch {}
	}
};

async function sha256(text) {
	const enc = new TextEncoder();
	const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
	return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const USERS_KEY = 'pb:users';
const CURRENT_KEY = 'pb:currentUser';

export function AuthProvider({ children }) {
	const [users, setUsers] = useState(() => storage.get(USERS_KEY, []));
	const [currentUser, setCurrentUser] = useState(() => storage.get(CURRENT_KEY, null));

	// Persist
	useEffect(() => { storage.set(USERS_KEY, users); }, [users]);
	useEffect(() => { if (currentUser) storage.set(CURRENT_KEY, currentUser); else storage.remove(CURRENT_KEY); }, [currentUser]);

		// Helper to seed from API
		const seedFromApi = async () => {
			try {
		const apiUrl = import.meta.env.VITE_API_URL || '';
		const res = await fetch(`${apiUrl}/api/users`);
				const data = await res.json();
				if (Array.isArray(data)) return data;
			} catch {}
			return [];
		};

		// Seed from API once (first load only)
		useEffect(() => {
			if (users && users.length) return;
			seedFromApi().then((list) => {
				if (list.length) setUsers(list);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const signup = async ({ email, password, name, plan }) => {
		const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
				// Attempt server-side signup first
				try {
					const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001';
					const res = await fetch(`${apiBase}/api/users`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ name, email, password, plan }),
					});
					if (!res.ok) {
						const err = await res.json().catch(() => ({}));
						throw new Error(err.error || 'Signup failed');
					}
					const data = await res.json();
					const { token, user, checkout } = data;
					// Store JWT in the same storage key the rest of the app expects
					storage.set('pb:token', token);
					setCurrentUser({ ...user, token });
					// If backend returned a Checkout session URL, redirect the browser to Stripe Checkout
					if (checkout && checkout.url) {
						window.location.href = checkout.url;
						// Returning here as the redirect will take the user away; caller shouldn't proceed.
						return { user, token, checkout };
					}
					return { user, token };
				} catch (err) {
					// Fallback to demo local signup if backend unavailable
					console.warn('Server signup failed, falling back to local demo signup:', err.message);
					const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
					const exists = users.find((u) => u.email === email);
					if (exists) throw new Error('Email already registered');
					const names = (name || '').split(' ');
					const first_name = names.shift() || null;
					const last_name = names.join(' ') || null;
					const newUser = { id: Date.now(), email, first_name, last_name, role: 'user' };
					users.push({ ...newUser, password });
					localStorage.setItem('demo_users', JSON.stringify(users));
					setCurrentUser(newUser);
					const fakeToken = btoa(JSON.stringify({ id: newUser.id, email: newUser.email }));
					storage.set('pb:token', fakeToken);
					return { user: newUser, token: fakeToken };
				}
	};

	const login = async ({ email, password }) => {
		try {
			const apiUrl = import.meta.env.VITE_API_URL || '';
			const res = await fetch(`${apiUrl}/api/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Login failed');
			// Store JWT in localStorage
			storage.set('pb:token', data.token);
			setCurrentUser({ ...data.user, token: data.token });
			return { ...data.user, token: data.token };
		} catch (err) {
			throw err;
		}
	};

	const logout = () => {
		setCurrentUser(null);
		storage.remove('pb:token');
	};
// Helper to get JWT from storage
function getToken() {
	return storage.get('pb:token', null);
}

// Validate JWT and fetch user info from backend (optional, for protected routes)
async function validateToken() {
	const token = getToken();
	if (!token) return null;
	try {
	const apiUrl = import.meta.env.VITE_API_URL || '';
	const res = await fetch(`${apiUrl}/api/validate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || 'Invalid token');
		setCurrentUser({ ...data.user, token });
		return { ...data.user, token };
	} catch {
		logout();
		return null;
	}
}

	// Dev utility: clear local data and re-seed from bundled JSON
	const resetDemo = async () => {
		storage.remove(USERS_KEY);
		storage.remove(CURRENT_KEY);
		const list = await seedFromJson();
		setUsers(list);
		setCurrentUser(null);
	};

	const value = useMemo(() => ({ currentUser, users, signup, login, logout, resetDemo, getToken, validateToken }), [currentUser, users]);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}
