// ============================
// Elements
// ============================
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");

const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const backToLogin = document.getElementById("backToLogin");

const dashboard = document.getElementById("dashboard");
const welcomeMessage = document.getElementById("welcomeMessage");

const billType = document.getElementById("billType");
const billAmount = document.getElementById("billAmount");
const billMonth = document.getElementById("billMonth");
const addBillBtn = document.getElementById("addBillBtn");

const generateReportBtn = document.getElementById("generateReportBtn");
const logoutBtn = document.getElementById("logoutBtn");

// ============================
// State
// ============================
let currentUser = null;

// ============================
// Auth Tabs Switch
// ============================
loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    forgotPasswordForm.classList.add("hidden");
});

signupTab.addEventListener("click", () => {
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    forgotPasswordForm.classList.add("hidden");
});

// ============================
// Toggle Password Visibility
// ============================
document.querySelectorAll(".toggle-password").forEach(icon => {
    icon.addEventListener("click", () => {
        const targetId = icon.getAttribute("data-target");
        const input = document.getElementById(targetId);
        input.type = input.type === "password" ? "text" : "password";
    });
});

// ============================
// Sign Up
// ============================
signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value;

    if (!username || !password) return alert("Please fill in all fields");

    let users = JSON.parse(localStorage.getItem("billTrackerUsers")) || {};
    if (users[username]) {
        alert("Username already exists");
        return;
    }

    users[username] = { password, bills: [] };
    localStorage.setItem("billTrackerUsers", JSON.stringify(users));
    alert("Account created successfully! Please login.");
    signupForm.reset();
    loginTab.click();
});

// ============================
// Login
// ============================
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    let users = JSON.parse(localStorage.getItem("billTrackerUsers")) || {};
    if (!users[username] || users[username].password !== password) {
        alert("Invalid username or password");
        return;
    }

    currentUser = username;
    showDashboard();
});

// ============================
// Forgot Password
// ============================
forgotPasswordLink.addEventListener("click", () => {
    forgotPasswordForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    signupForm.classList.add("hidden");
});

backToLogin.addEventListener("click", () => {
    forgotPasswordForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
});

forgotPasswordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("resetUsername").value.trim();
    const newPassword = document.getElementById("newPassword").value;

    let users = JSON.parse(localStorage.getItem("billTrackerUsers")) || {};
    if (!users[username]) {
        alert("Username not found");
        return;
    }

    users[username].password = newPassword;
    localStorage.setItem("billTrackerUsers", JSON.stringify(users));
    alert("Password reset successful. Please login.");
    forgotPasswordForm.reset();
    backToLogin.click();
});

// ============================
// Dashboard
// ============================
function showDashboard() {
    document.getElementById("authContainer").classList.add("hidden");
    dashboard.classList.remove("hidden");
    welcomeMessage.textContent = `Welcome, ${currentUser}!`;
    renderChart();
}

// ============================
// Add Bill
// ============================
addBillBtn.addEventListener("click", () => {
    const type = billType.value;
    const amount = parseFloat(billAmount.value);
    const month = billMonth.value;

    if (!amount || !month) {
        alert("Please enter amount and month");
        return;
    }

    let users = JSON.parse(localStorage.getItem("billTrackerUsers")) || {};
    users[currentUser].bills.push({ type, amount, month });
    localStorage.setItem("billTrackerUsers", JSON.stringify(users));

    billAmount.value = "";
    billMonth.value = "";

    renderChart();
});

// ============================
// Chart.js Graph
// ============================
function renderChart() {
    let users = JSON.parse(localStorage.getItem("billTrackerUsers")) || {};
    const bills = users[currentUser]?.bills || [];

    const labels = [...new Set(bills.map(b => b.month))].sort();
    const types = ["Electricity", "Gas", "Internet"];

    const datasets = types.map(type => ({
        label: type,
        data: labels.map(month => {
            const monthBills = bills.filter(b => b.type === type && b.month === month);
            return monthBills.reduce((sum, b) => sum + b.amount, 0);
        }),
        backgroundColor:
            type === "Electricity" ? "gold" :
            type === "Gas" ? "teal" : "royalblue"
    }));

    const ctx = document.getElementById("billsChart").getContext("2d");
    if (window.billsChartInstance) {
        window.billsChartInstance.destroy();
    }
    window.billsChartInstance = new Chart(ctx, {
        type: "bar",
        data: { labels, datasets },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

// ============================
// Generate Report
// ============================
generateReportBtn.addEventListener("click", () => {
    let users = JSON.parse(localStorage.getItem("billTrackerUsers")) || {};
    const bills = users[currentUser]?.bills || [];

    let report = `Bill Report for ${currentUser}\n\n`;
    bills.forEach(b => {
        report += `${b.month} - ${b.type}: ₹${b.amount}\n`;
    });

    const blob = new Blob([report], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${currentUser}_bill_report.txt`;
    link.click();
});

// ============================
// Logout
// ============================
logoutBtn.addEventListener("click", () => {
    currentUser = null;
    dashboard.classList.add("hidden");
    document.getElementById("authContainer").classList.remove("hidden");
    loginTab.click();
});
