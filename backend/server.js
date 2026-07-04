const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const otpRoutes = require('./routes/otpRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({ status: "online", message: "Lucuma Innovations API Gateway Active" });
});

app.use('/api', otpRoutes);
app.use('/api', enquiryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server executing deployment on port ${PORT}`));