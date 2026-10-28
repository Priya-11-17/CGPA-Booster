// CGPA Booster - Academic Performance Tracker

const STORAGE_KEY = "cgpaBoosterSemesters";

let semesters = loadSemesters();
let performanceChart = null;

const subjectsContainer = document.getElementById("subjects");


// Load saved data
function loadSemesters() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (!Array.isArray(data)) {
            return [];
        }

        return data.filter(item =>
            item &&
            typeof item.name === "string" &&
            Number.isFinite(item.totalCredits) &&
            item.totalCredits > 0 &&
            Number.isFinite(item.totalPoints) &&
            item.totalPoints >= 0 &&
            item.totalPoints <= item.totalCredits * 10
        );
    } catch (error) {
        return [];
    }
}


// Save semester records
function saveSemesters() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(semesters));
}


// Add a subject input row
function addSubject() {
    const row = document.createElement("div");
    row.className = "subject-row";

    row.innerHTML = `
        <div class="subject-name">
            <label>Subject Name</label>
            <input type="text" class="name"
                   placeholder="Subject name">
        </div>

        <div>
            <label>Credits</label>
            <input type="number" class="credits"
                   min="1" step="1" placeholder="4">
        </div>

        <div>
            <label>Grade Point</label>
            <input type="number" class="grade"
                   min="0" max="10" step="0.01"
                   placeholder="9">
        </div>

        <button type="button" class="remove-btn">
            Remove
        </button>
    `;

    row.querySelector(".remove-btn").addEventListener("click", () => {
        row.remove();
    });

    subjectsContainer.appendChild(row);
}


// Calculate semester SGPA
function calculateSGPA() {
    const semesterName = document
        .getElementById("semesterName")
        .value.trim();

    if (!semesterName) {
        alert("Please enter a semester name.");
        return;
    }

    const rows = document.querySelectorAll(".subject-row");

    if (rows.length === 0) {
        alert("Please add at least one subject.");
        return;
    }

    let totalCredits = 0;
    let totalPoints = 0;

    for (const row of rows) {
        const name = row.querySelector(".name").value.trim();
        const creditInput = row.querySelector(".credits").value;
        const gradeInput = row.querySelector(".grade").value;

        const credits = Number(creditInput);
        const grade = Number(gradeInput);

        if (
            !name ||
            creditInput.trim() === "" ||
            gradeInput.trim() === "" ||
            !Number.isInteger(credits) ||
            credits <= 0 ||
            !Number.isFinite(grade) ||
            grade < 0 ||
            grade > 10
        ) {
            alert(
                "Enter valid subject names, positive whole-number " +
                "credits, and grade points between 0 and 10."
            );
            return;
        }

        totalCredits += credits;
        totalPoints += credits * grade;
    }

    const sgpa = totalPoints / totalCredits;

    document.getElementById("sgpaResult").textContent =
        sgpa.toFixed(2);

    const semester = {
        id: Date.now() + Math.random(),
        name: semesterName,
        sgpa: sgpa,
        totalCredits: totalCredits,
        totalPoints: totalPoints
    };

    semesters.push(semester);
    saveSemesters();
    updateDashboard();

    alert("Semester result saved successfully!");
}


// Calculate credit-weighted CGPA
function calculateCGPA() {
    let totalCredits = 0;
    let totalPoints = 0;

    semesters.forEach(semester => {
        totalCredits += semester.totalCredits;
        totalPoints += semester.totalPoints;
    });

    const cgpa = totalCredits > 0
        ? totalPoints / totalCredits
        : 0;

    return {
        cgpa,
        totalCredits
    };
}


// Update dashboard
function updateDashboard() {
    const { cgpa, totalCredits } = calculateCGPA();

    document.getElementById("currentCGPA").textContent =
        cgpa.toFixed(2);

    document.getElementById("totalSemesters").textContent =
        semesters.length;

    document.getElementById("totalCredits").textContent =
        totalCredits;

    updateHistory();
    updateChart();
}


// Display semester history
function updateHistory() {
    const history = document.getElementById("semesterHistory");
    history.innerHTML = "";

    if (semesters.length === 0) {
        history.textContent = "No semester records added yet.";
        return;
    }

    semesters.forEach(semester => {
        const item = document.createElement("div");
        item.className = "history-item";

        const details = document.createElement("div");

        const title = document.createElement("strong");
        title.textContent = semester.name;

        const info = document.createElement("div");
        info.textContent =
            `SGPA: ${semester.sgpa.toFixed(2)} | ` +
            `Credits: ${semester.totalCredits}`;

        details.appendChild(title);
        details.appendChild(info);

        const deleteButton = document.createElement("button");
        deleteButton.className = "remove-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteSemester(semester.id);
        });

        item.appendChild(details);
        item.appendChild(deleteButton);

        history.appendChild(item);
    });
}


// Delete a semester
function deleteSemester(id) {
    if (!confirm("Delete this semester record?")) {
        return;
    }

    semesters = semesters.filter(semester => semester.id !== id);

    saveSemesters();
    updateDashboard();
}


// Display SGPA performance chart
function updateChart() {
    if (typeof Chart === "undefined") {
        return;
    }

    const canvas = document.getElementById("performanceChart");
    const context = canvas.getContext("2d");

    const labels = semesters.map(semester => semester.name);
    const values = semesters.map(semester => semester.sgpa);

    if (performanceChart) {
        performanceChart.destroy();
    }

    performanceChart = new Chart(context, {
        type: "line",

        data: {
            labels: labels,

            datasets: [{
                label: "Semester SGPA",
                data: values,
                borderColor: "#2563eb",
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                pointRadius: 5
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            scales: {
                y: {
                    min: 0,
                    max: 10,
                    title: {
                        display: true,
                        text: "SGPA"
                    }
                }
            }
        }
    });
}


// Predict required average grade point
function predictCGPA() {
    const targetInput = document.getElementById("targetCGPA").value;
    const remainingInput =
        document.getElementById("remainingCredits").value;

    const target = Number(targetInput);
    const remainingCredits = Number(remainingInput);

    const result = document.getElementById("predictionResult");

    const { cgpa, totalCredits } = calculateCGPA();

    if (totalCredits === 0) {
        result.textContent =
            "Please save at least one semester before predicting.";
        return;
    }

    if (
        targetInput.trim() === "" ||
        remainingInput.trim() === "" ||
        !Number.isFinite(target) ||
        target < 0 ||
        target > 10 ||
        !Number.isInteger(remainingCredits) ||
        remainingCredits <= 0
    ) {
        result.textContent =
            "Enter a target between 0 and 10 and valid remaining credits.";
        return;
    }

    // Target CGPA formula:
    // Required average =
    // (Target * Final Credits - Current Grade Points)
    // / Remaining Credits

    const currentPoints = cgpa * totalCredits;
    const finalCredits = totalCredits + remainingCredits;

    const requiredAverage =
        (target * finalCredits - currentPoints) / remainingCredits;

    if (requiredAverage > 10) {
        result.textContent =
            `Target CGPA ${target.toFixed(2)} is not achievable ` +
            `within the 10-point grading scale. ` +
            `Required average: ${requiredAverage.toFixed(2)}.`;

    } else if (requiredAverage <= 0) {
        result.textContent =
            `Your target CGPA of ${target.toFixed(2)} is already ` +
            `secured mathematically, even with zero grade points ` +
            `in the remaining credits.`;

    } else {
        result.textContent =
            `To achieve a CGPA of ${target.toFixed(2)}, ` +
            `you need an average grade point of ` +
            `${requiredAverage.toFixed(2)} across your ` +
            `${remainingCredits} remaining credits.`;
    }
}


// Clear all saved data
function clearAllData() {
    if (!confirm("Are you sure you want to delete all records?")) {
        return;
    }

    semesters = [];
    localStorage.removeItem(STORAGE_KEY);

    document.getElementById("sgpaResult").textContent = "0.00";
    document.getElementById("predictionResult").textContent =
        "Enter your target CGPA and remaining credits.";

    updateDashboard();
}


// Event listeners
document.getElementById("addSubject")
    .addEventListener("click", addSubject);

document.getElementById("calculateSGPA")
    .addEventListener("click", calculateSGPA);

document.getElementById("predictCGPA")
    .addEventListener("click", predictCGPA);

document.getElementById("clearData")
    .addEventListener("click", clearAllData);


// Initialize application
addSubject();
addSubject();
addSubject();

updateDashboard();