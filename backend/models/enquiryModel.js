const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: 'Not Provided' },
    company: { type: String, default: 'Not Provided' },
    message: { type: String, required: true },
    formType: { type: String, enum: ['contact', 'get-started'], default: 'contact' }, // Track source form
    status: { type: String, enum: ['pending', 'in-progress', 'resolved'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);