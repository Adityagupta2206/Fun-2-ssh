const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 2206;

app.use(cors());
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/bookingdata', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected successfully"))
    .catch(err => console.error(" MongoDB connection error:", err));

//Booking Schema
const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: Number, required: true },
    package: { type: String, required: true },
    date: { type: Date, required: true },
    guest: { type: Number, required: true },
    slot: { type: String, required: true }
});
const Booking = mongoose.model("Booking", bookingSchema);

//  Contact Schema
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    subject: { type: String, required: true },
    phone: { type: Number, required: true }
});
const Contact = mongoose.model("Contact", contactSchema);

//  Admin Schema
const adminSchema = new mongoose.Schema({
    username: String,
    password: String
});
const Admin = mongoose.model("Admin", adminSchema);

// Create Default Admins (Only Runs Once)
async function createAdmins() {
    const existingAdmins = await Admin.countDocuments();
    if (existingAdmins === 0) {
        const hashedPassword = await bcrypt.hash('rock1', 10);
        await Admin.create({ username: 'king', password: hashedPassword });
        console.log(" Admin created: king");
    }
}
//createAdmins();

// Serve HTML File
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'book.html'));
});


//





//  Handle Booking Submission
app.post('/post', async (req, res) => {
    try {
        const { name, email, phone, package, date, guest, slot } = req.body;

        if (!name || !email || !phone || !package || !date || !guest || !slot) {
            return res.status(400).json({ message: "All fields are required, including slot" });
        }

        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }
        parsedDate.setHours(0, 0, 0, 0); // normalize to midnight for comparison

        // Check if email or phone already has a booking for the date
        const alreadyBooked = await Booking.findOne({
            date: parsedDate,
            $or: [
                { email: email.toLowerCase() },
                { phone }
            ]
        });

        if (alreadyBooked) {
            return res.status(400).json({
                message: "Only one booking allowed per email or phone number for this date."
            });
        }

        // Check if the selected slot is full (2 bookings max)
        const existingBookingsCount = await Booking.countDocuments({
            date: parsedDate,
            slot
        });

        if (existingBookingsCount >= 2) {
               return res.status(400).send("Booking full. Please select another date or time slot.");
        }

        // Convert email
        const newBooking = new Booking({
            name,
            email: email.toLowerCase(), 
            phone,
            package,
            date: parsedDate,
            guest,
            slot
        });

        await newBooking.save();

        console.log(" Booking saved:", newBooking);
        res.status(201).json({ message: "Booking Done" });
    } catch (err) {
        console.error("❌ Error saving booking:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});




//  Handle Contact Form Submission
app.post('/contact', async (req, res) => {
    try {
        const { name, email, message, subject, phone } = req.body;

        if (!name || !email || !message || !subject || !phone) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newContact = new Contact({ name, email, message, subject, phone });
        await newContact.save();

        console.log("✅ Contact submission saved:", newContact);
        res.status(201).json({ message: "Contact submission successful" });
    } catch (err) {
        console.error("❌ Error saving contact submission:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

//  Admin Login Route
app.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });

        if (admin && await bcrypt.compare(password, admin.password)) {
            const token = jwt.sign({ username }, 'secret_key', { expiresIn: '1h' });
            return res.json({ token });
        }

        res.status(401).json({ message: 'Invalid credentials' });
    } catch (err) {
        console.error("❌ Admin login error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

//  Middleware for Authentication
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(403).json({ message: 'Unauthorized' });

    jwt.verify(token, 'secret_key', (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.admin = decoded;
        next();
    });
}

/////




// Get All Bookings (Admin Only)
app.get('/admin/bookings', authenticate, async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (err) {
        console.error("❌ Error fetching bookings:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Delete Booking (Admin Only)
// app.delete('/admin/bookings/:id', authenticate, async (req, res) => {
//     try {
//         await Booking.findByIdAndDelete(req.params.id);
//         res.json({ message: 'Booking deleted' });
//     } catch (err) {
//         console.error("❌ Error deleting booking:", err);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// });

// 
// Get fully booked slots for a selected date
app.get('/booked-slots', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Date is required' });

        const parsedDate = new Date(date);
        parsedDate.setHours(12, 0, 0, 0); // normalize date for accurate matching

        // Group bookings by slot and count how many per slot
        const bookings = await Booking.aggregate([
            { $match: { date: parsedDate } },
            { $group: { _id: "$slot", count: { $sum: 1 } } },
            { $match: { count: { $gte: 2 } } }  // slots booked 2 or more times
        ]);

        const fullyBookedSlots = bookings.map(b => b._id);  // extract slot names
        res.json(fullyBookedSlots);
    } catch (err) {
        console.error("❌ Error fetching booked slots:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
//
app.get('/analytics/package', authenticate, async (req, res) => {
  try {
    const data = await Booking.aggregate([
      {
        $group: {
          _id: "$package",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    res.json(data);
  } catch (err) {
    console.error('Error fetching package analytics:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

//




// 📊 Get Monthly Booking Count
app.get('/analytics/monthly', authenticate, async (req, res) => {
    try {
        const data = await Booking.aggregate([
            {
                $group: {
                    _id: { $month: "$date" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json(data);
    } catch (err) {
        console.error("❌ Error fetching monthly analytics:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 📆 Get Daily Booking Count
app.get('/analytics/daily', authenticate, async (req, res) => {
    try {
        const data = await Booking.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$date" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json(data);
    } catch (err) {
        console.error("❌ Error fetching daily analytics:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ⏰ Get Timeslot Booking Count
app.get('/analytics/timeslot', authenticate, async (req, res) => {
    try {
        const data = await Booking.aggregate([
            {
                $group: {
                    _id: "$slot",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        res.json(data);
    } catch (err) {
        console.error("❌ Error fetching timeslot analytics:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, 'analytics.html'));
});
app.get('/analytics/insights', async (req, res) => {
  try {
    const [packageData, timeslotData, dailyData, monthlyData] = await Promise.all([
      Booking.aggregate([
        { $group: { _id: "$package", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Booking.aggregate([
        { $group: { _id: "$timeslot", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const bestPackage = packageData[0] || { _id: null, count: 0 };
    const peakTimeslot = timeslotData[0] || { _id: null, count: 0 };
    const busiestDay = dailyData[0] || { _id: null, count: 0 };

    // Determine growth trend comparing last two months
    let growthTrend = "Not enough data";
    if (monthlyData.length >= 2) {
      const lastMonthCount = monthlyData[monthlyData.length - 1].count;
      const prevMonthCount = monthlyData[monthlyData.length - 2].count;
      growthTrend =
        lastMonthCount > prevMonthCount
          ? "Growing 📈"
          : lastMonthCount < prevMonthCount
          ? "Declining 📉"
          : "Stable ➖";
    }

    res.json({
      bestPackage,
      peakTimeslot,
      busiestDay,
      growthTrend,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});


//  Start Server
//app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
app.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`🚀 Server running at ${url}`);

    // Dynamically import 'open' to handle ESM
    import('open')
        .then(open => open.default(url))
        .catch(err => console.error('Failed to open browser:', err));
});