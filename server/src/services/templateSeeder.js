const ResumeTemplate = require('../models/ResumeTemplate');

const defaultTemplates = [
  {
    name: 'Template A: Single Column ATS Friendly',
    key: 'template_a',
    fileType: 'built-in',
    structure: {
      atsScore: 95,
      recommendedUseCase: 'SDE, Placement, ATS-focused',
      description: 'A clean, single-column design optimized for ATS parsing, utilizing high readability layouts and linear content flows.'
    },
    isActive: true
  },
  {
    name: 'Template B: Two Column Professional',
    key: 'template_b',
    fileType: 'built-in',
    structure: {
      atsScore: 90,
      recommendedUseCase: 'SDE, Research, Management',
      description: 'A balanced two-column design that positions personal details and core technical skills to the side, highlighting primary projects and work experience in the main section.'
    },
    isActive: true
  },
  {
    name: 'Template C: Modern Placement Resume',
    key: 'template_c',
    fileType: 'built-in',
    structure: {
      atsScore: 92,
      recommendedUseCase: 'Product, Internship, Modern',
      description: 'An elegant template using sophisticated serif fonts, fine-line layout sections, and a signature violet accent color.'
    },
    isActive: true
  },
  {
    name: 'Template D: Software Engineer Focused',
    key: 'template_d',
    fileType: 'built-in',
    structure: {
      atsScore: 93,
      recommendedUseCase: 'SDE, Full Stack, Research',
      description: 'A dense, developer-oriented layout focusing extensively on programming language proficiency, framework details, and project highlights.'
    },
    isActive: true
  },
  {
    name: 'Template E: AI/ML Engineer Focused',
    key: 'template_e',
    fileType: 'built-in',
    structure: {
      atsScore: 91,
      recommendedUseCase: 'AI/ML, Data Science, Research',
      description: 'Optimized for machine learning and research roles, highlighting analytical projects, core models/libraries, and academic publications.'
    },
    isActive: true
  },
  {
    name: 'Template F: Internship Focused',
    key: 'template_f',
    fileType: 'built-in',
    structure: {
      atsScore: 89,
      recommendedUseCase: 'Internship, Academic, Entry-level',
      description: 'Tailored for students seeking internships or co-ops, expanding education details, coursework, hackathons, and certifications.'
    },
    isActive: true
  }
];

async function seedTemplates() {
  try {
    for (const t of defaultTemplates) {
      await ResumeTemplate.findOneAndUpdate(
        { key: t.key },
        { $set: t },
        { upsert: true, new: true }
      );
    }
    // eslint-disable-next-line no-console
    console.log('Resume templates seeded/updated successfully.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error seeding resume templates:', err.message);
  }
}

module.exports = { seedTemplates };
