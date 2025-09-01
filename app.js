// =====================
// UI Elements
// =====================
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const backToLogin = document.getElementById("backToLogin");
const dashboard = document.getElementById("dashboard");
const authContainer = document.getElementById("authContainer");

const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const signupUsername = document.getElementById("signupUsername");
const signupPassword = document.getElementById("signupPassword");

const resetUsername = document.getElementById("resetUsername");
const newPassword = document.getElementById("newPassword");

const welcomeMessage = document.getElementById("welcomeMessage");
const billType = document.getElementById("billType");
const billAmount = document.getElementById("billAmount");
const billMonth = document.getElementById("billMonth");
const addBillBtn = document.getElementById("addBillBtn");
const generateReportBtn = document.getElementById("generateReportBtn");
const logoutBtn = document.getElementById("logoutBtn");

// =====================
// Tab Switching
// =====================
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

// =====================
// Forgot Password
// =====================
forgotPasswordLink.addEventListener("click", () => {
    loginForm.classList.add("hidden");
    forgotPasswordForm.classList.remove("hidden");
});

backToLogin.addEventListener("click", () => {
    forgotPasswordForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
});

// =====================
// Toggle Password Visibility
// =====================
document.querySelectorAll(".toggle-password").forEach(toggle => {
    toggle.addEventListener("click", () => {
        const target = document.getElementById(toggle.dataset.target);
        target.type = target.type === "password" ? "text" : "password";
    });
});

// =====================
// Local Storage Structure
// =====================
// users = {
//   username: { password: "pass", bills: [ {type, amount, month} ] }
// }

function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || {};
}

function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

// =====================
// Signup
// =====================
signupForm.addEventListener("submit", e => {
    e.preventDefault();
    const username = signupUsername.value.trim();
    const password = signupPassword.value.trim();
    let users = getUsers();

    if (users[username]) {
        alert("Username already exists!");
        return;
    }

    users[username] = { password, bills: [] };
    saveUsers(users);

    alert("Account created! Please log in.");
    signupUsername.value = "";
    signupPassword.value = "";
    loginTab.click();
});

// =====================
// Login
// =====================
loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    let users = getUsers();

    if (!users[username] || users[username].password !== password) {
        alert("Invalid username or password.");
        return;
    }

    localStorage.setItem("loggedInUser", username);
    showDashboard(username);
});

// =====================
// Forgot Password Reset
// =====================
forgotPasswordForm.addEventListener("submit", e => {
    e.preventDefault();
    const username = resetUsername.value.trim();
    const newPass = newPassword.value.trim();
    let users = getUsers();

    if (!users[username]) {
        alert("Username not found.");
        return;
    }

    users[username].password = newPass;
    saveUsers(users);
    alert("Password reset successful! Please log in.");
    backToLogin.click();
});

// =====================
// Show Dashboard
// =====================
function showDashboard(username) {
    authContainer.classList.add("hidden");
    dashboard.classList.remove("hidden");
    welcomeMessage.textContent = `Welcome, ${username}`;
    renderChart(username);
}

// =====================
// Add Bill
// =====================
addBillBtn.addEventListener("click", () => {
    const type = billType.value;
    const amount = parseFloat(billAmount.value);
    const month = billMonth.value;

    if (!amount || !month) {
        alert("Please enter all details.");
        return;
    }

    let users = getUsers();
    const username = localStorage.getItem("loggedInUser");
    users[username].bills.push({ type, amount, month });
    saveUsers(users);

    billAmount.value = "";
    billMonth.value = "";

    renderChart(username);
});

// =====================
// Render Chart
// =====================
function renderChart(username) {
    let users = getUsers();
    let bills = users[username].bills;

    let labels = [...new Set(bills.map(b => b.month))];
    let electricity = labels.map(m => sumBills(bills, "Electricity", m));
    let gas = labels.map(m => sumBills(bills, "Gas", m));
    let internet = labels.map(m => sumBills(bills, "Internet", m));

    const ctx = document.getElementById("billsChart").getContext("2d");
    if (window.billsChartInstance) {
        window.billsChartInstance.destroy();
    }
    window.billsChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                { label: "Electricity", data: electricity, backgroundColor: "gold" },
                { label: "Gas", data: gas, backgroundColor: "#ff6f61" },
                { label: "Internet", data: internet, backgroundColor: "#4da6ff" }
            ]
        },
        options: { responsive: true, plugins: { legend: { labels: { color: "#fff" } } }, scales: { x: { ticks: { color: "#fff" } }, y: { ticks: { color: "#fff" } } } }
    });
}

function sumBills(bills, type, month) {
    return bills.filter(b => b.type === type && b.month === month)
                .reduce((sum, b) => sum + b.amount, 0);
}

// =====================
// Generate Report
// =====================
generateReportBtn.addEventListener("click", () => {
    const username = localStorage.getItem("loggedInUser");
    let users = getUsers();
    let bills = users[username].bills;

    let report = `Bill Report for ${username}\n\n`;
    bills.forEach(b => {
        report += `${b.month} - ${b.type}: ₹${b.amount}\n`;
    });

    const blob = new Blob([report], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${username}_Bill_Report.txt`;
    link.click();
});

// =====================
// Logout
// =====================
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");
    dashboard.classList.add("hidden");
    authContainer.classList.remove("hidden");
});

// =====================
// Auto Login if Session Exists
// =====================
window.onload = () => {
    const username = localStorage.getItem("loggedInUser");
    if (username) showDashboard(username);
};
