require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const updateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(' MongoDB connected.');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@goviral.ai';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    let admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('Admin user not found. Creating one...');
      admin = new User({
        name: 'Super Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isActive: true,
      });
    } else {
      admin.email = adminEmail;
      admin.password = adminPassword; // password will be hashed by pre-save hook
      console.log('Updating existing admin user...');
    }

    await admin.save();
    console.log(`✅ Admin user updated successfully. Email: ${admin.email}`);
  } catch (err) {
    console.error('❌ Error updating admin:', err);
  } finally {
    mongoose.connection.close();
  }
};

updateAdmin();
