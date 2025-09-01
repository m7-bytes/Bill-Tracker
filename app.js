// ====== Global Variables ======
let currentUser = null;
let billsData = {};

// ====== DOM Elements ======
const loginScreen = document.getElementById("login-screen");
const dashboard = document.getElementById("dashboard");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.getElementById("togglePassword");
const loginBtn = document.getElementById("login-btn");
const createAccountLink = document.getElementById("create-account");
const logoutBtn = document.getElementById("logout-btn");

const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".section");

const billForm = document.getElementById("bill-form");
const billsTableBody = document.querySelector("#bills-table tbody");
const quickAddForm = document.getElementById("quick-add-form");

const totalMonthEl = document.getElementById("total-month");
const totalAnnualEl = document.getElementById("total-annual");
const highestBillEl = document.getElementById("highest-bill");

const monthlyChartCanvas = document.getElementById("monthlyChart");
const annualChartCanvas = document.getElementById("annualChart");

const generateReportBtn = document.getElementById("generate-report");

// ====== Password Toggle ======
togglePasswordBtn.addEventListener("click", () => {
    passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});

// ====== Load Data from Local Storage ======
function loadData() {
    const savedUsers = localStorage.getItem("billTrackerUsers");
    if (savedUsers) {
        billsData = JSON.parse(savedUsers);
    }
}

// ====== Save Data ======
function saveData() {
    localStorage.setItem("billTrackerUsers", JSON.stringify(billsData));
}

// ====== Login ======
loginBtn.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        alert("Please enter username and password");
        return;
    }

    if (!billsData[username]) {
        alert("User not found! Please create an account.");
        return;
    }

    if (billsData[username].password !== password) {
        alert("Incorrect password!");
        return;
    }

    currentUser = username;
    showDashboard();
});

// ====== Create Account ======
createAccountLink.addEventListener("click", () => {
    const username = prompt("Enter new username:");
    const password = prompt("Enter password:");

    if (!username || !password) return;

    if (billsData[username]) {
        alert("Username already exists!");
        return;
    }

    billsData[username] = { password: password, bills: [] };
    saveData();
    alert("Account created! You can now log in.");
});

// ====== Logout ======
logoutBtn.addEventListener("click", () => {
    currentUser = null;
    dashboard.classList.add("hidden");
    loginScreen.style.display = "flex";
});

// ====== Show Dashboard ======
function showDashboard() {
    loginScreen.style.display = "none";
    dashboard.classList.remove("hidden");
    updateTables();
    updateReports();
}

// ====== Navigation ======
navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        sections.forEach(sec => sec.classList.add("hidden"));
        document.getElementById(`${btn.dataset.section}-section`).classList.remove("hidden");

        if (btn.dataset.section === "reports") {
            updateReports();
        }
    });
});

// ====== Add Bill ======
billForm.addEventListener("submit", e => {
    e.preventDefault();
    const type = document.getElementById("bill-type").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const date = document.getElementById("bill-date").value;
    const status = document.getElementById("status").value;

    if (!type || !amount || !date) {
        alert("Please fill all fields");
        return;
    }

    billsData[currentUser].bills.push({ type, amount, date, status });
    saveData();
    billForm.reset();
    updateTables();
    alert("Bill added successfully!");
});

// ====== Quick Add ======
quickAddForm.addEventListener("submit", e => {
    e.preventDefault();
    const type = document.getElementById("quick-bill-type").value;
    const amount = parseFloat(document.getElementById("quick-amount").value);
    const date = document.getElementById("quick-date").value;
    const status = document.getElementById("quick-status").value;

    if (!type || !amount || !date) {
        alert("Please fill all fields");
        return;
    }

    billsData[currentUser].bills.push({ type, amount, date, status });
    saveData();
    quickAddForm.reset();
    updateTables();
    updateReports();
});

// ====== Update Tables ======
function updateTables() {
    const bills = billsData[currentUser].bills;
    billsTableBody.innerHTML = "";

    bills.forEach((bill, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="bill-${bill.type}">${bill.type}</td>
            <td>₹${bill.amount}</td>
            <td>${bill.date}</td>
            <td>${bill.status}</td>
            <td><button onclick="deleteBill(${index})">Delete</button></td>
        `;
        billsTableBody.appendChild(row);
    });
}

// ====== Delete Bill ======
function deleteBill(index) {
    billsData[currentUser].bills.splice(index, 1);
    saveData();
    updateTables();
    updateReports();
}

// ====== Update Reports ======
function updateReports() {
    const bills = billsData[currentUser].bills;
    let monthlyTotal = 0;
    let annualTotal = 0;
    let highest = 0;

    const monthlyTotals = { electricity: 0, gas: 0, internet: 0 };
    const annualTotals = { electricity: 0, gas: 0, internet: 0 };

    bills.forEach(bill => {
        const billYear = new Date(bill.date).getFullYear();
        const billMonth = new Date(bill.date).getMonth();

        if (billMonth === new Date().getMonth() && billYear === new Date().getFullYear()) {
            monthlyTotal += bill.amount;
            monthlyTotals[bill.type] += bill.amount;
        }

        if (billYear === new Date().getFullYear()) {
            annualTotal += bill.amount;
            annualTotals[bill.type] += bill.amount;
        }

        if (bill.amount > highest) highest = bill.amount;
    });

    totalMonthEl.textContent = monthlyTotal.toFixed(2);
    totalAnnualEl.textContent = annualTotal.toFixed(2);
    highestBillEl.textContent = highest.toFixed(2);

    renderChart(monthlyChartCanvas, monthlyTotals, "Monthly Expenses");
    renderChart(annualChartCanvas, annualTotals, "Annual Expenses");
}

// ====== Render Chart ======
function renderChart(canvas, data, label) {
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ["Electricity", "Gas", "Internet"],
            datasets: [{
                label: label,
                data: [data.electricity, data.gas, data.internet],
                backgroundColor: ["#ffd700", "#ff6347", "#00ced1"]
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}

// ====== Generate Report ======
generateReportBtn.addEventListener("click", () => {
    const bills = billsData[currentUser].bills;
    let csv = "Type,Amount,Date,Status\n";
    bills.forEach(bill => {
        csv += `${bill.type},${bill.amount},${bill.date},${bill.status}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "bill_report.csv";
    link.click();
});

// ====== Init ======
loadData();
