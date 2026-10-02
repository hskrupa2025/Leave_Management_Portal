const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: false,
        },
        password: {
            type: String,
            select: false,
        },
        role: {
            type: String,
            enum: ['EMPLOYEE', 'ADMIN'],
            default: 'EMPLOYEE',
        },
        casualLeave: {
            type: Number,
            default: 12,
        },
        sickLeave: {
            type: Number,
            default: 10,
        },
        earnedLeave: {
            type: Number,
            default: 15,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
