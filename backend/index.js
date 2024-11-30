const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MySQL Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Your MySQL password
  database: 'careerdb', // Replace with your database name
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database.');
});

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rathoredipanshu21@gmail.com', // Your email
    pass: 'gxua qdzp oxdj sxsd', // Your App Password (Make sure this is correct)
  },
});

// API to handle form submission
app.post('/submit-career', upload.single('resume'), (req, res) => {
  const { name, email, contact } = req.body;
  const resume = req.file ? req.file.filename : null;

  // Check if file is uploaded
  if (!resume) {
    return res.status(400).send('Resume is required.');
  }

  // Insert data into MySQL
  const sql = 'INSERT INTO applications (name, email, contact, resume) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, email, contact, resume], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).send('Database error');
    }

    // Send email to user
    const userMailOptions = {
      from: 'rathoredipanshu21@gmail.com',
      to: email, // User's email
      subject: 'Career Application Submission Confirmation',
      text: `Dear ${name},\n\nThank you for submitting your application. We have received your resume and will contact you soon.\n\nBest regards,\nCareer Team`,
    };

    transporter.sendMail(userMailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email to user:', error);
      } else {
        console.log('Confirmation email sent to user:', info.response);
      }
    });

    // Send email to admin (the one receiving career applications)
    const adminMailOptions = {
      from: 'rathoredipanshu21@gmail.com',
      to: 'rathoredipanshu6@gmail.com', // Admin email
      subject: 'New Career Application Received',
      text: `A new application has been submitted:\n\nName: ${name}\nEmail: ${email}\nContact: ${contact}\nResume: Attached.`,
      attachments: [
        {
          filename: resume,
          path: `./uploads/${resume}`,
        },
      ],
    };

    transporter.sendMail(adminMailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email to admin:', error);
        return res.status(500).send('Error sending email to admin');
      }
      console.log('Email sent to admin:', info.response);

      // Send success response to frontend
      res.status(200).send('Thank you for submitting the form, we will get in touch with you.');
    });
  });
});

// Basic GET route to confirm server is running
app.get('/', (req, res) => {
  res.send('Server is up and running!');
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
