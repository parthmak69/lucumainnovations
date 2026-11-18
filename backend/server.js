const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const otpRoutes = require('./routes/otpRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');

dotenv.config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'online',
        message: 'Lucuma Innovations API Gateway Active'
    });
});

// API Routes
app.use('/api', otpRoutes);
app.use('/api', enquiryRoutes);

// Start server only after MongoDB connects
const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Lucuma Innovations API running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Server startup failed:', error.message);
        process.exit(1);
    }
};

startServer();