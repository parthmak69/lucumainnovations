const dns = require('dns');

// Configure DNS servers for MongoDB Atlas SRV resolution
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is missing from environment variables');
        }

        console.log('Connecting to MongoDB Atlas...');

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 1,
        });

        console.log('====================================');
        console.log('MongoDB Connected Successfully!');
        console.log(`Host: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
        console.log('====================================');

        // Monitor database connection events
        mongoose.connection.on('disconnected', () => {
            console.error('MongoDB disconnected!');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected successfully!');
        });

        mongoose.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error.message);
        });

    } catch (error) {
        console.error('====================================');
        console.error('MongoDB Connection Failed!');
        console.error('Error:', error.message);
        console.error('====================================');

        process.exit(1);
    }
};

module.exports = connectDB;