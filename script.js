function login() {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;
    const message = document.getElementById("loginMessage");

    if (username === "" || password === "") {
        message.innerText = "Please enter username and password.";
        return;
    }

    if (role === "admin") {
        window.location.href = "admin.html";
    } else {
        window.location.href = "dashboard.html";
    }
}


function logout() {
    window.location.href = "index.html";
}


async function submitComplaint(event) {

    event.preventDefault();

    const student_name = document.getElementById("student_name").value;
    const category = document.getElementById("category").value;
    const location = document.getElementById("location").value;
    const description = document.getElementById("description").value;

    if (student_name === "" || category === "" || location === "" || description === "") {
        alert("Please fill all required fields.");
        return;
    }

    try {

        const response = await fetch("http://127.0.0.1:5000/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                student_name: student_name,
                category: category,
                location: location,
                description: description
            })
        });

        const result = await response.json();

        alert(
            "AI Analysis Complete!\n\n" +
            "Category: " + result.category + "\n" +
            "Priority: " + result.priority + "\n" +
            "Department: " + result.department
        );

    } catch (error) {

        console.error(error);

        alert("Backend connection failed. Please make sure Flask is running.");
    }
}


/* IMAGE PREVIEW */

const imageInput = document.getElementById("image");

if (imageInput) {

    imageInput.addEventListener("change", function () {

        const preview = document.getElementById("imagePreview");
        const file = this.files[0];

        if (file) {

            const reader = new FileReader();

            reader.onload = function (e) {

                preview.innerHTML =
                    `<img src="${e.target.result}" alt="Uploaded image">`;

            };

            reader.readAsDataURL(file);
        }
    });
}
/* ADMIN DASHBOARD */

/* ADMIN DASHBOARD */

async function loadComplaints() {
    const tableBody = document.getElementById("complaintsTableBody");

    if (!tableBody) return;

    try {
        const response = await fetch("http://127.0.0.1:5000/complaints");

        if (!response.ok) {
            throw new Error("Failed to fetch complaints");
        }

        const complaints = await response.json();

        // Update dashboard counts
        document.getElementById("totalComplaints").innerText =
            complaints.length;

        document.getElementById("submittedcomplaints").innerText =
            complaints.filter(c => c.status === "Submitted").length;

        document.getElementById("inProgressComplaints").innerText =
            complaints.filter(c =>
                c.status === "In Progress" || c.status === "Assigned"
            ).length;

        document.getElementById("resolvedComplaints").innerText =
            complaints.filter(c => c.status === "Resolved").length;

        // Display complaints
        tableBody.innerHTML = "";

        if (complaints.length === 0) {
            tableBody.innerHTML =
                '<tr><td colspan="6">No complaints found.</td></tr>';
            return;
        }

        complaints.forEach(complaint => {
            const row = document.createElement("tr");

            const values = [
                "CF" + String(complaint.complaint_id).padStart(3, "0"),
                complaint.category,
                complaint.location,
                complaint.status,
                complaint.department
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            const actionCell = document.createElement("td");
            const viewButton = document.createElement("button");

            viewButton.className = "view-btn";
            viewButton.textContent = "View";

            viewButton.onclick = () => {
                alert(
                    "Complaint: CF" +
                    String(complaint.complaint_id).padStart(3, "0") +
                    "\nStudent: " + (complaint.student_name || "Student") +
                    "\nDescription: " + (complaint.description || "") +
                    "\nPriority: " + (complaint.priority || "Not set")
                );
            };

            actionCell.appendChild(viewButton);
            row.appendChild(actionCell);
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading complaints:", error);
        tableBody.innerHTML =
            '<tr><td colspan="6">Could not load complaints. Check Flask.</td></tr>';
    }
}

// Load immediately and refresh every 5 seconds
if (document.getElementById("complaintsTableBody")) {
    loadComplaints();
    setInterval(loadComplaints, 5000);
}
/* STUDENT DASHBOARD COUNTS */

async function loadStudentStats() {
    const total = document.getElementById("totalComplaints");

    if (!total) return;

    try {
        const response = await fetch(
            "http://127.0.0.1:5000/complaints"
        );

        if (!response.ok) {
            throw new Error("Failed to load complaints");
        }

        const complaints = await response.json();

        document.getElementById("totalComplaints").textContent =
            complaints.length;

        document.getElementById("submittedComplaints").textContent =
            complaints.filter(c => c.status === "Submitted").length;

        document.getElementById("inProgressComplaints").textContent =
            complaints.filter(c =>
                c.status === "In Progress" || c.status === "Assigned"
            ).length;

        document.getElementById("resolvedComplaints").textContent =
            complaints.filter(c => c.status === "Resolved").length;

    } catch (error) {
        console.error("Student dashboard error:", error);
    }
}

if (document.getElementById("totalComplaints")) {
    loadStudentStats();
    setInterval(loadStudentStats, 5000);
}