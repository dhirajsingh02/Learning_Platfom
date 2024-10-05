const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const port = 3019;

const app = express();
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/students');
const db = mongoose.connection;

db.once('open', () => {
    console.log("Mongodb connection successful");
});

const userSchema = new mongoose.Schema({
    student_id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    email_id: { type: String, required: true },
    employee_id: { type: String, required: true },
    aadhaar_no: { type: String, required: true },
    password: { type: String, required: true },
    mobile_no: { type: String, required: true },
    gender: { type: String, required: true }
});

const Users = mongoose.model("student_info", userSchema);





const counterSchema = new mongoose.Schema({
    id: { type: String },
    seq: { type: Number }
});

const Counter = mongoose.model("counter", counterSchema);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'next.html'));
});

app.post('/post', async (req, res) => {
    let seqId;

    try {
        const counterDoc = await Counter.findOneAndUpdate(
            { id: "autoval" },
            { "$inc": { "seq": 1 } },
            { new: true, upsert: true }
        );

        seqId = counterDoc.seq;

        const { name, email_id, employee_id, aadhaar_no, password, mobile_no, gender } = req.body;
        
        const user = new Users({
            name,
            email_id,
            employee_id,
            aadhaar_no,
            password,
            mobile_no,
            gender,
            student_id: seqId
        });

        await user.save();
        res.json({ message: 'Student registration successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await Users.findOne({ employee_id: username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username' });
        }
        
        if (password !== user.password) {
            return res.status(401).json({ error: 'Invalid password' });
        }  
        
        res.json({ message: 'Login successful', student_id: user.student_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Define the admin_table schema
const adminSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.String, ref: 'EmployeeInfo', required: true, unique: true },
    name:{type: String, required: true},
    subject: {type: String, enum: ['Physics', 'Chemistry', 'Biology', 'Maths']},
    password: { type: String, required: true },
    repassword:{ type: String, required: true }
    
});

const Admin = mongoose.model("admin_data", adminSchema); // Model for admin collection

app.get('/admin_register', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin_registration.html'));
});

app.post('/admin_register', async (req, res) => {
    const { employee_id,name,subject,password,repassword } = req.body;

    if (password !== repassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    const admin = new Admin({
        employee_id,
        name,
        subject,
        password,
        repassword
    });

    try {
        await admin.save();
        res.json({ message: 'Admin registration successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/logina', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ employee_id: username });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid username' });
        }
        
        if (password !== admin.password) {
            return res.status(401).json({ error: 'Invalid password' });
        } 
        
       res.json({ message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});





app.get('/employees/:subject', async (req, res) => {
    const { subject } = req.params;
    try {
        const employees = await Admin.find({ subject }).select('employee_id name'); 

        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const discussionSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.Number, ref: 'student_info', required: true },
    employee_id: { type: mongoose.Schema.Types.String, ref: 'employee_info', required: true },
    question: { type: String, required: true },
    asked_date: { type: Date, required: true },
    resolved_date: { type: Date, default: null },
    resolved: { type: Boolean, default: false }
});

const Discussion = mongoose.model("discussion", discussionSchema);

app.post('/discussions', async (req, res) => {
    const { student_id, employee_id, question, asked_date } = req.body;

    const discussion = new Discussion({
        student_id,
        employee_id,
        question,
        asked_date,
        resolved_date: null,
        resolved: false
    });

    try {
        await discussion.save();
        res.json({ message: 'Discussion saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
