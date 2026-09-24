import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // custom article slug/id
  title: { type: String, required: true, trim: true },
  excerpt: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  category: { type: String, required: true, trim: true },
  tags: { type: [String], default: [] },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true, trim: true },
  status: { 
    type: String, 
    enum: ['Draft', 'Pending', 'Approved', 'Published', 'Rejected', 'Changes Requested'], 
    default: 'Draft' 
  },
  coverImage: { type: String },
  readMinutes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0, min: 0 },
  publishedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  moderation: {
    riskScore: { type: Number, default: null, min: 0, max: 100 },
    decision: { 
      type: String, 
      enum: ['AUTO_APPROVE', 'ADMIN_REVIEW', 'AUTO_BLOCK', null], 
      default: null 
    },
    status: { 
      type: String, 
      enum: ['pending_score', 'pending_review', 'published', 'blocked'], 
      default: 'pending_score' 
    },
    decidedBy: { 
      type: String, 
      enum: ['system', 'admin', null], 
      default: null 
    },
    decidedAt: { type: Date },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, trim: true }
  }
}, { 
  timestamps: true, 
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Map virtual id to string _id
articleSchema.virtual('id').get(function() {
  return this._id;
});

// Text index for full-text search and moderation queue indexes
articleSchema.index({ title: 'text', excerpt: 'text' });
articleSchema.index({ 'moderation.status': 1, 'moderation.riskScore': -1, createdAt: -1 });

export default mongoose.model('Article', articleSchema);
