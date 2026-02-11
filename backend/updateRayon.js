const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await mongoose.connection.db.collection('meetings').updateMany(
    {},
    { $set: { rayonPointage: 1000 } }
  );
  console.log('Updated rayon to 1000m:', result.modifiedCount, 'meetings');
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
