const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser')

const port = 2206;
const app = express();
app.use(cors());
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/bookingdata', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("MongoDB connected successfully");
}).catch(err => {
  console.error("MongoDB connection error:", err);
});
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },  
  phone: { type: Number, required: true },
  package: { type: String, required: true },
  date: { type: Date, required: true },
  guest: { type: Number, required: true }
});

const Users = mongoose.model("Users", userSchema);

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  subject: { type: String, required: true },
  phone: { type: Number, required: true },
 
});

const Contacts = mongoose.model("Contacts", contactSchema);

// Serve HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'book.html'));
});

// Handle form submission
app.post('/post', async (req, res) => {
  try {
    const { name, email, phone, package, date, guest } = req.body;
    
    // Validate inputs
    if (!name || !email || !phone || !package || !date || !guest) {
      return res.status(400).send("All fields are required");
    }

    // Parse and validate date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).send("Invalid date format");
    }

    const user = new Users({
      name,
      email,
      phone,
      package,
      date: parsedDate,
      guest
    });

    await user.save();
    console.log(user);
    res.send("Booking Done");
  } catch (err) {
    console.error("Error saving booking:", err);
    res.status(500).send("Internal Server Error");
  }
});
app.post('/contact', async (req, res) => {
  try {
    const { name, email, message , subject , phone  } = req.body;
    
    // Validate inputs
    if (!name || !email || !message || !subject || !phone) {
      return res.status(400).send("All fields are required");
    }

    // Create a new contact submission
    const contact = new Contacts({
      name,
      email,
      message,
      subject,
      phone,
     
      
      
    });

    // Save the contact submission to the database
    await contact.save();
    console.log(contact);
    res.send("Contact submission successful");
  } catch (err) {
    console.error("Error saving contact submission:", err);
    res.status(500).send("Internal Server Error");
  }
});


app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
