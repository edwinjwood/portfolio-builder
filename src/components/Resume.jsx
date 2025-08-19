import React from 'react';
import defaultResume from '../data/resume.json';

export default function Resume({ data }) {
  const r = data || defaultResume;
  const { header, summary, competencies, experience, education } = r;
  return (
    <main id="content" className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-3xl mx-auto py-12 px-4">
        {/* Header */}
        <header className="mb-8 border-b pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">{header.name}</h1>
          <h2 className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 font-medium mb-2">{header.title}</h2>
          <div className="flex flex-col sm:flex-row sm:items-center text-gray-500 text-sm gap-1">
            {header.location && <span>{header.location}</span>}
            {(header.location && (header.phone || header.email || header.linkedin)) && <span className="hidden sm:inline mx-2">•</span>}
            {header.phone && <span>{header.phone}</span>}
            {(header.phone && (header.email || header.linkedin)) && <span className="hidden sm:inline mx-2">•</span>}
            {header.email && <a href={`mailto:${header.email}`} className="hover:underline">{header.email}</a>}
            {(header.email && header.linkedin) && <span className="hidden sm:inline mx-2">•</span>}
            {header.linkedin && <a href={header.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">{header.linkedin.replace('https://','')}</a>}
          </div>
        </header>

        {/* Professional Summary */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Professional Summary</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">{summary}</p>
        </section>

        {/* Core Competencies & Leadership Skills */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Core Competencies & Leadership Skills</h3>
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            {competencies?.map((item, idx) => (
              <div key={idx}>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{item.heading}</p>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Professional Experience */}
        <section className="mb-10">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Professional Experience</h3>
          {experience?.map((exp, idx) => (
            <div key={idx} className="mb-6">
              <div className="mb-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="font-bold text-gray-800 dark:text-gray-100 tracking-tight">{exp.company}{exp.location ? ` — ${exp.location}` : ''}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{exp.period}</span>
                </div>
                {exp.roles?.map((r, i) => (
                  <div key={i} className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">{r.title}{r.period ? ` | ${r.period}` : ''}</div>
                ))}
              </div>
              <ul className="list-disc pl-5 marker:text-gray-400 dark:marker:text-gray-500 space-y-1.5 text-[13px] sm:text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                {exp.bullets?.map((b, i) => (<li key={i}>{b}</li>))}
              </ul>
            </div>
          ))}
        </section>

        {/* Education */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Education</h3>
          {education?.map((ed, idx) => (
            <div key={idx} className="mb-3">
              <span className="font-bold text-gray-800 dark:text-gray-100">{ed.institution}{ed.location ? ` — ${ed.location}` : ''}</span>
              {ed.degree && <div className="text-gray-600 dark:text-gray-400 text-sm">{ed.degree}</div>}
              {ed.details && <div className="text-gray-700 dark:text-gray-300 text-sm">{ed.details}</div>}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
