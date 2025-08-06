const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json()); 

// Connect to MongoDB
mongoose.connect("mongodb+srv://spiceschain:12345@cluster0.0lbyq9u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Database connection error:", err));

// Import routes
const farmerRoutes = require('./routes/farmer');
const buyerRoutes = require('./routes/buyer');
const loginRoutes = require('./routes/login');

// Use routes
app.use('/api/auth/farmer', farmerRoutes);
app.use('/api/auth/buyer', buyerRoutes);
app.use('/api/auth', loginRoutes);

// Start server
app.listen(PORT, () => {
    console.log(` Server running at http://localhost:${PORT}`);
});