const minimal = {
  id: 'minimal',
  name: 'Minimal Resume',
  tagline: 'Simple resume-focused template',
  description: 'A streamlined template for those who want a clean, single-page resume with minimal distractions.',
  previewPath: '/preview/minimal',
  includes: ['Resume'],
  defaults: {
    landing: {
      title: 'Minimal Resume',
      subtitle: 'Your Role',
      description: 'Contact info here',
      links: []
    },
    resume: {},
    projects: {}
  }
};

export default minimal;
