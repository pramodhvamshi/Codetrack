const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['video', 'playlist', 'article', 'course', 'documentation', 'official_docs', 'practice', 'github', 'book', 'pdf', 'website'], 
    default: 'website' 
  },
  isPremium: { type: Boolean, default: false }
}, { _id: false });

const DSAProblemSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'DSACategory', required: true },
    title: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    leetcodeUrl: { type: String },
    order: { type: Number, default: 0 },
    resources: { type: [ResourceSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DSAProblem', DSAProblemSchema);
