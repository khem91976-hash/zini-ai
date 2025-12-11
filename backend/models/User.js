
import mongoose from 'mongoose';

const ziniUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Encrypted or 'social_login'
  
  // Subscription Fields
  plan: { type: String, enum: ['free', 'pro', 'elite'], default: 'free' },
  credits: { type: Number, default: 100 },
  lastResetDate: { type: Date, default: Date.now },
  
  // Auth Provider
  provider: { type: String, default: 'local' }, // local, google, github

  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  joinedAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', ziniUserSchema);
