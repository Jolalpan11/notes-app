// Read .env and make its settings available through process.env.
require("dotenv").config();

// Load Mongoose so our server can communicate with MongoDB.
const mongoose = require("mongoose");

// Load the Express package we installed with npm.
// Express helps us create a server and respond to requests.
const express = require("express");

// Call express() to create our application.
// We use "app" below to set up how our server behaves.
const app = express();

// Choose the port our server will listen on.
// This is why our address ends with :3000.
const PORT = 3000;

// Add middleware: code that processes requests before our routes handle them.
// express.json() reads incoming JSON and makes it available as req.body.
// Later, we'll use this to read a note sent from our webpage.
app.use(express.json());

// Make the files in "public" available to the browser.
// Visiting "/" will display public/index.html.
app.use(express.static("public"));

// Define the fields and rules for each note.
const noteSchema = new mongoose.Schema({
    title: {
        type: String,       // Store the title as text.
        required: true,     // A title is required.
        trim: true,         // Remove spaces from the beginning and end.
        maxLength: 100      // Allow up to 100 characters.
    },

    text: {
        type: String,       // Store the note's contents as text.
        required: true,     // Note text is required.
        trim: true,         // Remove spaces from the beginning and end.
        maxLength: 2000     // Allow up to 2,000 characters.
    }
});

// Create a model named "Note" using those rules.
// We'll use Note to save, retrieve, and delete notes in MongoDB.
const Note = mongoose.model("Note", noteSchema);

// Receive a note and save it to MongoDB.
app.post("/api/notes", async (req, res) => {
    try {
        // Get the data sent by the browser or curl.
        const body = req.body || {};

        // THIS is the operation that saves the note.
        // Wait until MongoDB finishes saving before continuing.
        const savedNote = await Note.create({
            title: body.title,
            text: body.text
        });

        // Display the saved note in the server's terminal.
        console.log("Note saved:", savedNote);

        // Reply only after the note has been saved.
        // 201 means we successfully created a new record.
        res.status(201).json({
            message: "Note saved!",
            note: savedNote
        });

    } catch (error) {
        console.error("Could not save note:", error.message);

        // Handle data that fails our schema rules.
        if (error.name === "ValidationError") {
            return res.status(400).json({
                error: "Check the note's title and text."
            });
        }

        res.status(500).json({
            error: "Could not save the note."
        });
    }
});

// Handle requests to retrieve saved notes.
app.get("/api/notes", async (req, res) => {
    try {
        // Find all notes in MongoDB.
        // {} means no filter, so every note matches.
        // await waits for the database results.
        const notes = await Note.find({});

        // Send the array of notes back to the browser as JSON.
        res.json(notes);

    } catch (error) {
        // Show the error in the VS Code terminal.
        console.error("Could not load notes:", error.message);

        // Tell the browser that something went wrong.
        res.status(500).json({
            error: "Could not load notes."
        });
    }
});

// Define a function that connects to MongoDB and starts our server.
async function startServer() {
    try {
        // Read the address from .env and wait for MongoDB to connect.
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Connected to MongoDB: NotesApp");

        // Start Express after the database connection succeeds.
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

    } catch (error) {
        // Show the reason if the database connection fails.
        console.error("MongoDB connection failed:", error.message);
    }
}

// Delete one note using its database ID.
app.delete("/api/notes/:id", async (req, res) => {
    try {
        // Get the note's ID from the URL.
        const id = req.params.id;

        // Find and delete that note in MongoDB.
        const deletedNote = await Note.findByIdAndDelete(id);

        // If there was no matching note, send a 404 response.
        if (!deletedNote) {
            return res.status(404).json({
                error: "Note not found."
            });
        }

        // Print confirmation in the server terminal.
        console.log("Note deleted:", deletedNote.title);

        // Reply to the browser or curl.
        res.json({
            message: "Note deleted!"
        });

    } catch (error) {
        // Handle an ID that has an invalid format.
        if (error.name === "CastError") {
            return res.status(400).json({
                error: "Invalid note ID."
            });
        }

        console.error("Could not delete note:", error.message);

        res.status(500).json({
            error: "Could not delete note."
        });
    }
});

// Run the function we just defined.
startServer();