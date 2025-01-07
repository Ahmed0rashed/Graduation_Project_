console.log('MongoDB URI:', process.env.DATABASE); 

const mongoose = require('mongoose');
const dotenv = require('dotenv');


dotenv.config();

const connectDB = async () => {
  try {
   
    const DB_URI = process.env.DATABASE;

    if (!DB_URI) {
      console.error('MongoDB URI is undefined!');
      process.exit(1); 
    }

    
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB successfully!');

    mongoose.connection.once('open', () => {
      console.log('Connection to database established!');
    });
  } catch (err) {
    console.error(
      'Error connecting to MongoDB:',
      err.message,
    );
    process.exit(1);
  }
};

module.exports = connectDB;
