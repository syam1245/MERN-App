const express = require('express');
const helmet = require("helmet");
const path = require("path");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const RegisterModel = require('./models/Register');
const ProfileModel = require('./models/Profile');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, "client", "build")));

// Content Security Policy for Helmet
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                connectSrc: ["http://localhost:5000",
                    "https://mern-app-2fe1.onrender.com"],
            },
        },
    })
);

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://ameenaharis:adminaccess1234@cluster0.7ulzjqe.mongodb.net/CRUD?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("MongoDB connected");
}).catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the application if unable to connect to the database
});


// Profile Creation Endpoint
app.post('/api/profile', async (req, res) => {
    try {
        const profileData = req.body;
        const profile = await ProfileModel.create(profileData);
        res.json(profile);
    } catch (error) {
        console.error('Error creating profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get Profile Data Endpoint
app.get('/api/profile', async (req, res) => {
    try {
        const profile = await ProfileModel.findOne({});
        res.json(profile || {});
    } catch (error) {
        console.error('Error fetching profile data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update Profile Data Endpoint
app.put('/api/profile', async (req, res) => {
    try {
        const updatedData = req.body;
        const updatedProfile = await ProfileModel.findOneAndUpdate({}, updatedData, { new: true });
        res.json(updatedProfile || {});
    } catch (error) {
        console.error('Error updating profile data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete Profile Data Endpoint
app.delete('/api/profile', async (req, res) => {
    try {
        await ProfileModel.deleteOne({});
        res.json({ deleted: true });
    } catch (error) {
        console.error('Error deleting profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// User Login Endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await RegisterModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET || 'jwtkeycrud', { expiresIn: '1h' });
        res.json({ token, message: 'Login successful' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// User Registration Endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { childName, email, password } = req.body;
        const existingUser = await RegisterModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await RegisterModel.create({ childName, email, password: hashedPassword });
        res.json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Serve the React app
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"), (err) => {
        if (err) {
            console.error("Error sending file:", err);
            res.status(500).send("An error occurred while trying to serve the page.");
        }
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
