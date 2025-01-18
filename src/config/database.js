const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
    });
    console.log(`MongoDB Connected successfully`);
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error('MongoDB connection error:');
    console.error(`Error name: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
