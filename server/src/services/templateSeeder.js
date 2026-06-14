const ResumeTemplate = require('../models/ResumeTemplate');

const defaultTemplates = [
  {
    name: 'Single Column – ATS Professional',
    key: 'single_column',
    fileType: 'built-in',
    structure: {
      atsScore: 96,
      recommendedUseCase: 'SDE, Placement, All Industries',
      description: 'A clean, single-column ATS-optimized layout with white background, dark text, and corporate styling. Perfect for all placement and job applications.'
    },
    isActive: true
  },
  {
    name: 'Double Column – Professional',
    key: 'double_column',
    fileType: 'built-in',
    structure: {
      atsScore: 91,
      recommendedUseCase: 'SDE, Research, Management, Senior Roles',
      description: 'A balanced two-column professional layout that organizes key skills and education on the left with experience and projects on the right. Corporate-grade, no colors.'
    },
    isActive: true
  }
];

// Deprecated template keys to deactivate (in case they exist from previous seeding)
const deprecatedKeys = ['template_a', 'template_b', 'template_c', 'template_d', 'template_e', 'template_f'];

async function seedTemplates() {
  try {
    // Deactivate all deprecated templates
    await ResumeTemplate.updateMany(
      { key: { $in: deprecatedKeys } },
      { $set: { isActive: false } }
    );

    // Seed/update the two canonical templates
    for (const t of defaultTemplates) {
      await ResumeTemplate.findOneAndUpdate(
        { key: t.key },
        { $set: t },
        { upsert: true, new: true }
      );
    }
    // eslint-disable-next-line no-console
    console.log('Resume templates seeded/updated successfully (single_column, double_column).');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error seeding resume templates:', err.message);
  }
}

module.exports = { seedTemplates };
