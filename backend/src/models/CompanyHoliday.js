const mongoose = require('mongoose');

const companyHolidaySchema = new mongoose.Schema(
    {
        date: {
            type: String,
            required: true,
            unique: true,
            match: /^\d{4}-\d{2}-\d{2}$/,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('CompanyHoliday', companyHolidaySchema);