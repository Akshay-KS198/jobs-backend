const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB URI and Database
const uri = 'mongodb+srv://aksheay:aksheay*12345@jobs-feed.rypomxy.mongodb.net/jobs?retryWrites=true&w=majority';
let client;
let applicationsCollection;

// Initialize MongoDB connection
const initializeDBAndServer = async () => {
    try {
        client = new MongoClient(uri);
        await client.connect();
        console.log('Connected to MongoDB.....');
        applicationsCollection = client.db().collection('applications');  // Set collection

        // Start the server after DB is connected
        app.listen(3000, () => {
            console.log('Server running on port: 3000');
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

initializeDBAndServer();

// 1. Add Job Application (POST)
app.post("/api/jobs", async (req, res) => {
    const jobData = req.body; // Expecting a single job application object
    
    try {
        // Insert a single job application using insertOne
        const result = await client.db("jobs").collection("applications").insertOne(jobData);
        
        // Send success response
        res.status(200).send({ message: "Job application added successfully", insertedCount: 1 });
        
    } catch (err) {
        // Log error and send error response
        console.error("Error adding job application:", err);
        res.status(500).send({ message: "Error adding job application", error: err });
    }
});

// 2. List All Applications (GET)
app.get('/api/jobs', async (req, res) => {
    try {
        const applications = await applicationsCollection.find({}).toArray();
        res.status(200).json(applications);
    } catch (error) {
        console.error('Error fetching job applications:', error);
        res.status(500).json({ message: 'Failed to fetch job applications' });
    }
});

// 3. Filter Applications by Status (GET)
app.get('/api/jobs/status', async (req, res) => {
    const { status } = req.query;

    if (!status) {
        return res.status(400).json({ message: 'Status is required as a query parameter' });
    }

    try {
        const applications = await applicationsCollection.find({ status }).toArray();
        res.status(200).json(applications);
    } catch (error) {
        console.error('Error fetching job applications by status:', error);
        res.status(500).json({ message: 'Failed to fetch job applications by status' });
    }
});

// 4. Update Job Application Status (PUT)
app.put('/api/jobs/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is required to update the application' });
    }

    try {
        const result = await applicationsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Application not found or status not updated' });
        }

        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating job application status:', error);
        res.status(500).json({ message: 'Failed to update job application status' });
    }
});

// 5. Delete Job Application (DELETE)
app.delete('/api/jobs/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Ensure the provided id is a valid ObjectId
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid job application ID' });
        }

        // Ensure you are accessing the correct collection
        const result = await client.db("jobs").collection("applications").deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Application not found' });
        }

        res.status(200).json({ message: 'Application deleted successfully' });
    } catch (error) {
        console.error('Error deleting job application:', error);
        res.status(500).json({ message: 'Failed to delete job application' });
    }
});
