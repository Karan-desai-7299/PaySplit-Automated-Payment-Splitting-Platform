import { User } from './models/User.js';
import { AuditLog } from './models/AuditLog.js';

export async function seedDatabase() {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123';

      console.log(`[Seed] Creating Administrator account: username="${adminUsername}"`);
      const admin = new User({
        username: adminUsername,
        password: adminPassword,
        role: 'admin',
        businessName: 'System Administration',
        email: 'admin@upimanager.internal',
        isActive: true,
      });
      await admin.save();
      console.log(`[Seed] ✅ Admin ready: ${adminUsername} / ${adminPassword}`);

      await AuditLog.create({
        action: 'SYSTEM_INITIALIZED',
        performedBy: 'system',
        role: 'system',
        details: { message: 'Admin account seeded on first startup' },
      });
    } else {
      console.log('[Seed] Admin account already exists, skipping seed.');
    }
  } catch (err) {
    console.error('[Seed] Database seed error:', err.message);
  }
}
