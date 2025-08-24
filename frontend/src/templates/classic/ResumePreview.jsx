import React from 'react';

const sampleData = {
  header: {
    name: 'Jane Doe',
    title: 'Software Engineer',
    location: 'San Francisco, CA',
    phone: '(555) 123-4567',
    email: 'jane.doe@email.com',
    linkedin: 'linkedin.com/in/janedoe'
  },
  summary: 'Experienced engineer with a passion for building scalable web applications and leading agile teams.',
  competencies: [
    { heading: 'Frontend', text: 'React, Vue, HTML, CSS, JavaScript' },
    { heading: 'Backend', text: 'Node.js, Express, PostgreSQL, MongoDB' }
  ],
  experience: [
    {
      company: 'TechCorp',
      title: 'Senior Developer',
      years: '2021–2025',
      description: 'Led a team building SaaS products.'
    },
    {
      company: 'WebWorks',
      title: 'Frontend Engineer',
      years: '2018–2021',
      description: 'Developed modern web applications.'
    }
  ],
  education: [
    {
      school: 'State University',
      degree: 'B.S. Computer Science',
      years: '2014–2018'
    }
  ]
};

export default function ResumePreview({ data }) {
  // Use sampleData if no real data is provided
  const { header, summary, competencies, experience, education } = data && data.header ? data : sampleData;
  return (
    <div className="w-full h-64 flex flex-col justify-start items-start p-4 text-left bg-white dark:bg-gray-900 rounded shadow overflow-y-auto">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{header.name}</h2>
        <div className="text-base font-semibold text-gray-700 dark:text-gray-300">{header.title}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {header.location && <span>{header.location}</span>}
          {header.phone && <span className="ml-2">{header.phone}</span>}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {header.email && <span>{header.email}</span>}
          {header.linkedin && <span className="ml-2">{header.linkedin.replace('https://','')}</span>}
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 w-full my-2" />
      <div className="mb-2">
        <div className="font-semibold text-gray-900 dark:text-gray-100">Professional Summary</div>
        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">{summary}</div>
      </div>
      <div>
        <div className="font-semibold text-gray-900 dark:text-gray-100">Core Competencies</div>
        <ul className="text-xs text-gray-700 dark:text-gray-300 mt-1 list-disc pl-4">
          {competencies?.slice(0,2).map((c, idx) => (
            <li key={idx}>{c.heading}: {c.text}</li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <div className="font-semibold text-gray-900 dark:text-gray-100">Experience</div>
        <ul className="text-xs text-gray-700 dark:text-gray-300 mt-1 list-disc pl-4">
          {experience?.map((exp, idx) => (
            <li key={idx} className="mb-2">
              <span className="font-bold">{exp.title}</span> at {exp.company} ({exp.years})<br />
              <span>{exp.description}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <div className="font-semibold text-gray-900 dark:text-gray-100">Education</div>
        <ul className="text-xs text-gray-700 dark:text-gray-300 mt-1 list-disc pl-4">
          {education?.map((edu, idx) => (
            <li key={idx}>
              <span className="font-bold">{edu.degree}</span> — {edu.school} ({edu.years})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
