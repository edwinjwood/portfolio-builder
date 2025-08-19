import React from 'react';

export default function ProjectsSimple({ data }) {
  const items = data?.items || [];
  return (
    <main className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Projects</h1>
        <div className="grid gap-4">
          {items.map((p, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{p.title}</h2>
              {p.summary && <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{p.summary}</p>}
              {(p.tech?.length) ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.tech.map((t) => (
                    <span key={t} className="bg-blue-600/10 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300 border border-blue-600/20 dark:border-blue-400/20 text-[10px] px-2 py-1 rounded">{t}</span>
                  ))}
                </div>
              ) : null}
              {(p.links?.length) ? (
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {p.links.map((l, i) => (
                    <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{l.label}</a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
