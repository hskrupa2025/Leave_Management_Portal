const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
    {
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        leaveType: { type: String, enum: ['Casual Leave', 'Sick Leave', 'Earned Leave'], required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        numberOfDays: { type: Number, required: true, min: 1 },
        reason: { type: String, required: true, trim: true },
        status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.models.Leave || mongoose.model('Leave', leaveSchema);
