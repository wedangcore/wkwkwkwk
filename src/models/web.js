// src/models/web.js
import mongoose from 'mongoose';

const webSchema = new mongoose.Schema({
  name: { type: String, default: 'WBK PayGateway' },
  iconUrl: { type: String, default: 'https://avatars.githubusercontent.com/u/99401498?v=4' },
  total_user: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Web || mongoose.model('Web', webSchema);
