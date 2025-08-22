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

	const signup = async ({ email, password, name }) => {
		const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
		if (exists) throw new Error('Email already registered');
		const id = crypto.randomUUID();
		const passwordHash = await sha256(password);
		const user = { id, email, name: name || '', passwordHash, createdAt: new Date().toISOString() };
		setUsers(prev => [...prev, user]);
		setCurrentUser({ id, email, name: user.name });
		return { id, email, name: user.name };
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
			setCurrentUser(data.user);
			return data.user;
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
		setCurrentUser(data.user);
		return data.user;
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
