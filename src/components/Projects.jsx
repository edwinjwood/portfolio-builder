import React, { useState, useEffect } from "react";
import projectsData from '../data/projects.json';

export default function Projects() {
	const CATEGORY_ORDER = [
		"Operating Model",
		"M&A Integration",
		"Product",
		"Automation",
		"Integration",
		"Migration & Modernization",
		"Analytics",
		"Leadership",
		"Strategy",
	];
	const [activeCategory, setActiveCategory] = useState("All");
	const projects = projectsData.items;
	const summary = projectsData.summary;

	const counts = React.useMemo(() => {
		const map = {};
		projects.forEach((p) => {
			p.categories.forEach((c) => (map[c] = (map[c] || 0) + 1));
		});
		return map;
	}, [projects]);

	const categories = React.useMemo(
		() => ["All", ...CATEGORY_ORDER.filter((c) => counts[c])],
		[counts]
	);

	// URL hash sync supporting HashRouter (#/path?cat=Category) and legacy (#cat=Category)
	useEffect(() => {
		const hash = window.location.hash; // e.g., #/projects?cat=Automation or #cat=Automation
		if (!hash) return;
		if (hash.startsWith('#cat=')) {
			const raw = decodeURIComponent(hash.substring(5));
			if (raw && raw !== 'All') setActiveCategory(raw);
			return;
		}
		// HashRouter style: #/projects?cat=Automation
		const qIndex = hash.indexOf('?');
		if (qIndex !== -1) {
			const query = hash.substring(qIndex + 1); // cat=Automation
			const params = new URLSearchParams(query);
			const cat = params.get('cat');
			if (cat && cat !== 'All') setActiveCategory(decodeURIComponent(cat));
		}
	}, []);

	useEffect(() => {
		const current = window.location.hash; // preserve route segment if present
		const qIndex = current.indexOf('?');
		const routePart = current.startsWith('#/') ? (qIndex === -1 ? current : current.substring(0, qIndex)) : '';
		if (activeCategory === 'All') {
			// Remove cat param while preserving route
			if (routePart) {
				window.history.replaceState(null, '', window.location.pathname + window.location.search + routePart);
			} else if (current.startsWith('#cat=')) {
				window.history.replaceState(null, '', window.location.pathname + window.location.search + '#');
			}
		} else {
			const catFrag = `cat=${encodeURIComponent(activeCategory)}`;
			if (routePart) {
				window.history.replaceState(null, '', window.location.pathname + window.location.search + `${routePart}?${catFrag}`);
			} else {
				window.location.hash = catFrag; // legacy fallback
			}
		}
	}, [activeCategory]);

	const filtered = React.useMemo(() => {
		const base = activeCategory === "All" ? projects : projects.filter((p) => p.categories.includes(activeCategory));
		return [...base].sort((a, b) => b.weight - a.weight);
	}, [activeCategory]);

	return (
		<main className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans text-gray-900 dark:text-gray-100 transition-colors">
			<div className="max-w-3xl mx-auto py-12 px-4">
				<h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Major Projects</h1>
				   {/* Projects summary section */}
				   <section className="mb-8">
					   <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center min-h-[120px]">
						   <span className="text-gray-700 dark:text-gray-300 text-sm text-center">{summary}</span>
					   </div>
				   </section>
	{/* Category Filter */}
				<div className="mb-8">
					<div className="flex flex-wrap gap-2">
		{categories.map((cat) => {
						const active = cat === activeCategory;
						return (
							<button
								key={cat}
								type="button"
								onClick={() => setActiveCategory(cat)}
								aria-pressed={active}
								className={
									`text-xs tracking-wide px-3 py-1 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-500 ` +
									(active
										? "bg-brand-600 text-white border-brand-600 dark:border-brand-500 shadow"
										: "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700")
								}
							>
			{cat}{cat !== "All" && counts[cat] ? ` (${counts[cat]})` : cat === "All" ? ` (${projects.length})` : ""}
							</button>
						);
					})}
					</div>
				</div>
				<div className="grid gap-6">
					{filtered.map((project, idx) => (
						<div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
							<div className="flex flex-wrap items-center gap-2 mb-2">
								<h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100">{project.title}</h2>
								<div className="flex flex-wrap gap-1">
									{project.categories.map((cat) => (
										<span key={cat} className="text-[10px] uppercase tracking-wide bg-brand-600 text-white px-2 py-0.5 rounded">
											{cat}
										</span>
									))}
								</div>
							</div>
							{project.impact && (
								<p className="text-[11px] font-medium text-brand-600 dark:text-brand-400 mb-1 tracking-wide">{project.impact}</p>
							)}
							<p className="text-gray-600 dark:text-gray-300 mb-2 text-sm leading-relaxed">{project.description}</p>
							{/* Impact line removed to simplify presentation */}
							<div className="flex flex-wrap gap-2 mb-1">
								{project.tech.length > 0 && project.tech.map((t) => (
									<span key={t} className="bg-blue-600/10 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300 border border-blue-600/20 dark:border-blue-400/20 text-[10px] px-2 py-1 rounded">{t}</span>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
