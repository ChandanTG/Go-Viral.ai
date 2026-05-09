const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/goviral_ai').then(async () => {
  const db = mongoose.connection.db;
  
  // Drop bad indexes
  try { await db.collection('users').dropIndex('googleId_1'); console.log('Dropped googleId_1'); } 
  catch(e) { console.log('googleId_1:', e.message); }
  
  try { await db.collection('users').dropIndex('appleId_1'); console.log('Dropped appleId_1'); } 
  catch(e) { console.log('appleId_1:', e.message); }
  
  // Remove null values so sparse index works
  await db.collection('users').updateMany({ googleId: null }, { $unset: { googleId: 1 } });
  await db.collection('users').updateMany({ appleId: null }, { $unset: { appleId: 1 } });
  console.log('Cleaned null OAuth fields from all users');
  
  process.exit();
});
