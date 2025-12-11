import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const seedDefaultAdmin = async () => {
    try {
        const adminExists = await User.findOne({ email: 'admin' });
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('zinikhem', 10);
            await User.create({
                name: 'System Administrator',
                email: 'admin',
                password: hashedPassword,
                role: 'admin',
                credits: 999999
            });
            console.log('✅ [Zini Core] Default Admin initialized successfully.');
        }
    } catch (error) {
        console.error('❌ [Zini Core] Admin Seeding Failed:', error);
    }
};