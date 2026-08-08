const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // Null for top-level comments, ObjectId for nested replies
    content: { type: String, required: true, trim: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

CommentSchema.index({ post: 1, createdAt: 1 });
CommentSchema.index({ parentComment: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', CommentSchema);
