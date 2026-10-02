const mongoose = require('mongoose');
const dns = require('node:dns');

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not set. Add your Atlas connection string to backend/.env.');
    }

    try {
        const dnsServers = process.env.MONGO_DNS_SERVERS
            ?.split(',')
            .map((server) => server.trim())
            .filter(Boolean);
        if (dnsServers?.length) {
            dns.setServers(dnsServers);
        }

        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        throw new Error(`MongoDB connection failed: ${error.message}`, { cause: error });
    }
};

module.exports = connectDB;
