// src/models/verifyUser .js
import mongoose from 'mongoose';

const verifyUser Schema = new mongoose.Schema({
  token: { type: String, required: true },
  email: { type: String, required: true },
  created: { type: Date, default: Date.now },
  expire_at: { type: Date, default: Date.now, expires: 1800 }, // Token expired after 30 minutes
});

export default mongoose.models.VerifyUser  || mongoose.model('VerifyUser ', verifyUser Schema);
