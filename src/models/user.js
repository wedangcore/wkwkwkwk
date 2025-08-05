// src/models/user.js
import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  no_telp: { type: String, required: true },
  password: { type: String, required: true },
  apiKey: { type: String, unique: true },
  isAdmin: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  store: {
    name: { type: String, default: null },
    logoUrl: { type: String, default: null },
  },
}, { timestamps: true });

userSchema.pre('save', function(next) {
  if (this.isNew && !this.apiKey) {
    this.apiKey = crypto.randomBytes(24).toString('hex');
  }
  next();
});

export default mongoose.models.User || mongoose.model('User ', userSchema);
