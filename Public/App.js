// Find our form on the webpage.
const form = document.getElementById("note-form");

// "async" allows us to use "await" inside this function.
form.addEventListener("submit", async (event) => {

    // Keep the page from reloading when the form is submitted.
    event.preventDefault();

    // Read the fields and remove spaces from their ends.
    const title = document.getElementById("title").value.trim();
    const text = document.getElementById("text").value.trim();

    if (!title || !text) {
        alert("Please enter both a title and a note.");
        return;
    }

    // Group the values into one object.
    const note = {
        title: title,
        text: text
    };

    // Try sending the note. If something fails, run "catch" below.
    try {
        // Send a request to /api/notes on the server hosting our page.
        // "await" pauses this function until a response is available.
        const response = await fetch("/api/notes", {
            method: "POST",

            // Tell the server that the request contains JSON.
            headers: {
                "Content-Type": "application/json"
            },

            // Convert our JavaScript object into JSON text to send.
            body: JSON.stringify(note)
        });

        // Check whether the server returned a successful status.
        if (!response.ok) {
            throw new Error("Server returned status " + response.status);
        }

        // Read the response's JSON and turn it into a JavaScript value.
        const result = await response.json();

        // This prints in the BROWSER CONSOLE.
        console.log("Server reply:", result.message);

        // The note was saved successfully, so clear the form's inputs.
        form.reset();

        // Fetch the saved notes again and update the displayed list.
        await loadNotes();

    } catch (error) {
        // Show any request or response-processing error.
        console.error("Could not send note:", error);
        alert("Could not send the note. Check the browser console.");
    }
});

// Fetch saved notes from our server and display them.
async function loadNotes() {
    // Find the "Saved notes" area in index.html.
    const notesArea = document.getElementById("notes");

    try {
        // fetch uses GET by default.
        // Our server receives this request and searches MongoDB.
        const response = await fetch("/api/notes");

        if (!response.ok) {
            throw new Error("Could not load notes.");
        }

        // Turn the JSON response into a JavaScript array.
        const notes = await response.json();
        // Clear the area before displaying the results.
        notesArea.textContent = "";

        if (notes.length === 0) {
            notesArea.textContent = "No notes yet.";
            return;
        }

        // Repeat these steps for each saved note.
        for (const note of notes) {
            // Create a container with Bootstrap styling.
            const card = document.createElement("div");
            card.className = "card card-body mb-3";

            // Create a heading containing this note's title.
            const heading = document.createElement("h3");
            heading.className = "h5";
            heading.textContent = note.title;

            // Create a paragraph containing this note's text.
            const paragraph = document.createElement("p");
            paragraph.textContent = note.text;

            // Ask the browser to create a new <button> element.
            const deleteButton = document.createElement("button");

            // Make it a regular button, rather than a form-submit button.
            deleteButton.type = "button";

            // Give it Bootstrap styling.
            deleteButton.className = "btn btn-outline-danger btn-sm align-self-start";

            // Set the words displayed on the button.
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", async () => {
                try {
                    // Send a DELETE request using this note's ID.
                    const response = await fetch(`/api/notes/${note._id}`, {
                        method: "DELETE"
                    });

                    // Check whether the server reported success.
                    if (!response.ok) {
                        throw new Error("Could not delete the note.");
                    }

                    // Read and print the server's confirmation.
                    const result = await response.json();
                    console.log("Server reply:", result.message);

                    // Display the remaining notes.
                    await loadNotes();

                } catch (error) {
                    console.error("Delete failed:", error);
                    alert("Could not delete the note. Please try again.");
                }
            });

            // Put the heading, paragraph, and button inside this note's card.
            card.append(heading, paragraph, deleteButton);

            // Put the completed card onto the webpage.
            notesArea.append(card);
        }
    } catch (error) {
        console.error("Could not load notes:", error);
        notesArea.textContent = "Could not load notes. Please refresh.";
    }
}

// Run this function when the browser loads this file.
loadNotes();