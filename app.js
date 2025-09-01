/* BillTracker app.js
   - Multi-user (localStorage)
   - Login/Signup/Forgot (same screen)
   - Eye icons adjacent to password fields
   - Add bills (quick + full), edit, delete
   - Summary stats: total, avg, max, min per category
   - Highest/lowest month, % change vs previous month
   - Charts: monthly trend (line), category bar, pie distribution
   - Export CSV / JSON, Import JSON, Clear data
*/

/* -----------------------------
   Utility / storage helpers
   -----------------------------*/
const USERS_KEY = "bt_users_v2"; // object {username: {pwd, bills:[]}}
let currentUser = null;

function loadUsers(){
  return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
}
function saveUsers(users){
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function saveForCurrent(users){
  saveUsers(users);
}

/* -----------------------------
   DOM refs
   -----------------------------*/
const $ = id => document.getElementById(id);

// Auth UI
const authWrap = $("authWrap");
const tabLogin = $("tabLogin");
const tabSignup = $("tabSignup");
const formLogin = $("formLogin");
const formSignup = $("formSignup");
const formForgot = $("formForgot");
const loginUser = $("loginUser");
const loginPass = $("loginPass");
const signupUser = $("signupUser");
const signupPass = $("signupPass");
const forgotUser = $("forgotUser");
const forgotPass = $("forgotPass");
const btnLogin = $("loginBtn");
const btnSignup = $("signupBtn");
const btnForgot = $("forgotBtn");
const openForgot = $("openForgot");
const backToLogin1 = $("backToLogin1");
const backToLogin2 = $("backToLogin2");

// App UI
const appEl = $("app");
const signedUser = $("signedUser");
const navBtns = document.querySelectorAll(".nav-btn");
const views = document.querySelectorAll(".view");
const logoutBtn = $("logout");

// Summary elements
const totalMonthEl = $("totalMonth");
const totalYearEl = $("totalYear");
const highestBillEl = $("highestBill");

// Quick add
const quickType = $("quickType");
const quickAmount = $("quickAmount");
const quickDate = $("quickDate");
const quickPaid = $("quickPaid");
const quickAddBtn = $("quickAddBtn");

// Stat elements
const sumElectricityEl = $("sumElectricity");
const sumGasEl = $("sumGas");
const sumInternetEl = $("sumInternet");
const avgElecEl = $("avgElec");
const avgGasEl = $("avgGas");
const avgNetEl = $("avgNet");
const maxElecEl = $("maxElec");
const maxGasEl = $("maxGas");
const maxNetEl = $("maxNet");
const minElecEl = $("minElec");
const minGasEl = $("minGas");
const minNetEl = $("minNet");

// Charts & controls
const generateReportBtn = $("generateReport");
const hideReportBtn = $("hideReport");
const chartsArea = $("chartsArea");
let monthlyChart = null, categoryChart = null, pieChart = null;

// Add full form
const addType = $("addType");
const addAmount = $("addAmount");
const addDate = $("addDate");
const addStatus = $("addStatus");
const addSave = $("addSave");
const addClear = $("addClear");

// History
const filterType = $("filterType");
const filterFrom = $("filterFrom");
const filterTo = $("filterTo");
const applyFilter = $("applyFilter");
const resetFilter = $("resetFilter");
const billsTableBody = document.querySelector("#billsTable tbody");

// Export/import
const exportCSVBtn = $("exportCSV");
const exportJSONBtn = $("exportJSON");
const importJSONBtn = $("importJSON");
const importFile = $("importFile");
const clearAllBtn = $("clearAll");

// Insights
const insightHighestMonth = $("insightHighestMonth");
const insightLowestMonth = $("insightLowestMonth");
const insightPercent = $("insightPercent");

/* -----------------------------
   Init auth tab behaviors
   -----------------------------*/
function show(element){ element.classList.remove("hidden"); }
function hide(element){ element.classList.add("hidden"); }

tabLogin.addEventListener("click", ()=>{
  tabLogin.classList.add("active"); tabSignup.classList.remove("active");
  show(formLogin); hide(formSignup); hide(formForgot);
});
tabSignup.addEventListener("click", ()=>{
  tabSignup.classList.add("active"); tabLogin.classList.remove("active");
  show(formSignup); hide(formLogin); hide(formForgot);
});

openForgot.addEventListener("click", ()=>{ hide(formLogin); hide(formSignup); show(formForgot); });
backToLogin1.addEventListener("click", ()=>{ show(formLogin); hide(formSignup); hide(formForgot); tabLogin.click(); });
backToLogin2.addEventListener("click", ()=>{ show(formLogin); hide(formSignup); hide(formForgot); tabLogin.click(); });

/* Eye buttons adjacent to password inputs */
document.querySelectorAll(".eye-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const targetId = btn.getAttribute("data-target");
    const inp = document.getElementById(targetId);
    inp.type = inp.type === "password" ? "text" : "password";
    btn.textContent = inp.type === "password" ? "👁" : "🙈";
  });
});

/* -----------------------------
   Auth logic
   -----------------------------*/
formSignup.addEventListener("submit", (e)=>{
  e.preventDefault();
  const u = signupUser.value.trim();
  const p = signupPass.value;
  if(!u || !p){ alert("Enter username & password"); return; }
  const users = loadUsers();
  if(users[u]){ alert("Username exists"); return; }
  users[u] = { pwd: p, bills: [] };
  saveUsers(users);
  alert("Account created. Please login.");
  signupUser.value=""; signupPass.value="";
  tabLogin.click();
});

formLogin.addEventListener("submit", (e)=>{
  e.preventDefault();
  const u = loginUser.value.trim();
  const p = loginPass.value;
  const users = loadUsers();
  if(!users[u] || users[u].pwd !== p){ alert("Invalid credentials"); return; }
  currentUser = u;
  loginUser.value=""; loginPass.value="";
  enterApp();
});

formForgot.addEventListener("submit", (e)=>{
  e.preventDefault();
  const u = forgotUser.value.trim();
  const np = forgotPass.value;
  const users = loadUsers();
  if(!users[u]){ alert("User not found"); return; }
  users[u].pwd = np;
  saveUsers(users);
  alert("Password reset. Please login.");
  forgotUser.value=""; forgotPass.value="";
  tabLogin.click();
});

/* -----------------------------
   App entry / UI wiring
   -----------------------------*/
function enterApp(){
  hide(authWrap);
  show(appEl);
  signedUser.textContent = `Signed in: ${currentUser}`;
  // Show Reports view by default
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  const vbtn = [...document.querySelectorAll(".nav-btn")].find(x=>x.dataset.view==='reports');
  if(vbtn) vbtn.classList.add("active");
  views.forEach(v => v.id === "viewReports" ? show(v) : hide(v));
  refreshAll();
}

/* Navigation */
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    views.forEach(v => hide(v));
    show(document.getElementById("view" + capitalize(view)));
    // if switching to history, render table
    if(view === "history") renderTable();
  });
});
function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

/* Logout */
logoutBtn.addEventListener("click", ()=> {
  if(!confirm("Logout?")) return;
  currentUser = null;
  hide(appEl);
  show(authWrap);
  tabLogin.click();
});

/* -----------------------------
   Bills functions
   -----------------------------*/
function getBills(){ const users = loadUsers(); return (users[currentUser] && users[currentUser].bills) ? users[currentUser].bills : []; }
function setBills(arr){ const users = loadUsers(); users[currentUser].bills = arr; saveUsers(users); }

/* Quick add */
quickAddBtn.addEventListener("click", ()=>{
  const t = quickType.value;
  const amt = parseFloat(quickAmount.value);
  const m = quickDate.value;
  const paid = quickPaid.value === "true";
  if(!t || !amt || !m){ alert("Fill type, amount, and month"); return; }
  const bills = getBills();
  bills.push({ id: id(), type: t, amount: amt, month: m, paid });
  setBills(bills);
  quickAmount.value=""; quickDate.value="";
  refreshAll();
});

/* Full add */
addSave.addEventListener("click", ()=>{
  const t = addType.value;
  const amt = parseFloat(addAmount.value);
  const m = addDate.value;
  const paid = addStatus.value === "true";
  if(!t || !amt || !m){ alert("Fill fields"); return; }
  const bills = getBills();
  bills.push({ id: id(), type: t, amount: amt, month: m, paid });
  setBills(bills);
  addAmount.value=""; addDate.value="";
  alert("Saved");
  refreshAll();
});
addClear.addEventListener("click", ()=>{ addType.selectedIndex=0; addAmount.value=""; addDate.value=""; addStatus.selectedIndex=0; });

/* Table render / actions */
function renderTable(filteredBills){
  const bills = filteredBills || getBills();
  billsTableBody.innerHTML = "";
  if(bills.length === 0){
    billsTableBody.innerHTML = `<tr><td colspan="5" class="muted">No bills</td></tr>`;
    return;
  }
  bills.slice().sort((a,b)=> new Date(b.month) - new Date(a.month)).forEach(b=>{
    const tr = document.createElement("tr");
    tr.className = b.type === "Electricity" ? "row-elec" : b.type === "Gas" ? "row-gas" : "row-net";
    tr.innerHTML = `<td>${b.type}</td><td>₹${Number(b.amount).toFixed(2)}</td><td>${b.month}</td><td>${b.paid? "Paid":"Unpaid"}</td>
      <td>
        <button class="btn" data-act="edit" data-id="${b.id}">Edit</button>
        <button class="btn" data-act="del" data-id="${b.id}">Delete</button>
      </td>`;
    billsTableBody.appendChild(tr);
  });
  // attach actions
  billsTableBody.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      const act = btn.getAttribute("data-act");
      const idv = btn.getAttribute("data-id");
      if(act === "del"){ if(confirm("Delete bill?")) deleteBill(idv); }
      if(act === "edit") editBill(idv);
    });
  });
}

function deleteBill(idv){
  let bills = getBills();
  bills = bills.filter(b => b.id !== idv);
  setBills(bills);
  refreshAll();
}
function editBill(idv){
  const bills = getBills();
  const b = bills.find(x=> x.id === idv);
  if(!b) return alert("Not found");
  // populate add form for editing (we remove item and wait for save)
  addType.value = b.type;
  addAmount.value = b.amount;
  addDate.value = b.month;
  addStatus.value = b.paid ? "true":"false";
  // remove original
  setBills(bills.filter(x=> x.id !== idv));
  // switch to add view
  document.querySelector('.nav-btn[data-view="add"]').click();
}

/* filters */
applyFilter.addEventListener("click", ()=>{
  let bills = getBills();
  const ft = filterType.value;
  const f = filterFrom.value;
  const t = filterTo.value;
  if(ft !== "All") bills = bills.filter(b=> b.type === ft);
  if(f) bills = bills.filter(b=> b.month >= f);
  if(t) bills = bills.filter(b=> b.month <= t);
  renderTable(bills);
});
resetFilter.addEventListener("click", ()=>{ filterType.value="All"; filterFrom.value=""; filterTo.value=""; renderTable(); });

/* -----------------------------
   Calculations & summaries
   -----------------------------*/
function summaryStats(){
  const bills = getBills();
  const thisYear = new Date().getFullYear();
  // totals per type for year
  const types = ["Electricity","Gas","Internet"];
  const totals = { Electricity:0, Gas:0, Internet:0 };
  const counts = { Electricity:0, Gas:0, Internet:0 };
  const maxs = { Electricity:0, Gas:0, Internet:0 };
  const mins = { Electricity: Infinity, Gas: Infinity, Internet: Infinity };

  let totalMonth = 0, totalYear = 0;
  bills.forEach(b=>{
    const y = new Date(b.month + "-01").getFullYear();
    if(y === thisYear){
      totals[b.type] += Number(b.amount);
      counts[b.type]++;
      maxs[b.type] = Math.max(maxs[b.type], Number(b.amount));
      mins[b.type] = Math.min(mins[b.type], Number(b.amount));
    }
    // total for selected current month:
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    if(b.month === currentKey) totalMonth += Number(b.amount);
  });
  totalYear = totals.Electricity + totals.Gas + totals.Internet;

  // fill UI (formatting)
  totalMonthEl.textContent = formatINR(totalMonth);
  totalYearEl.textContent = formatINR(totalYear);

  sumElectricityEl.textContent = formatINR(totals.Electricity);
  sumGasEl.textContent = formatINR(totals.Gas);
  sumInternetEl.textContent = formatINR(totals.Internet);

  avgElecEl.textContent = counts.Electricity ? formatINR(totals.Electricity / counts.Electricity) : formatINR(0);
  avgGasEl.textContent = counts.Gas ? formatINR(totals.Gas / counts.Gas) : formatINR(0);
  avgNetEl.textContent = counts.Internet ? formatINR(totals.Internet / counts.Internet) : formatINR(0);

  maxElecEl.textContent = maxs.Electricity ? formatINR(maxs.Electricity) : "—";
  maxGasEl.textContent = maxs.Gas ? formatINR(maxs.Gas) : "—";
  maxNetEl.textContent = maxs.Internet ? formatINR(maxs.Internet) : "—";

  minElecEl.textContent = isFinite(mins.Electricity) ? formatINR(mins.Electricity) : "—";
  minGasEl.textContent = isFinite(mins.Gas) ? formatINR(mins.Gas) : "—";
  minNetEl.textContent = isFinite(mins.Internet) ? formatINR(mins.Internet) : "—";

  // Highest individual bill this year:
  const yearBills = bills.filter(b => new Date(b.month+"-01").getFullYear() === thisYear);
  if(yearBills.length){
    const top = yearBills.reduce((p,c)=> c.amount > p.amount ? c : p, yearBills[0]);
    highestBillEl.textContent = `${top.type} • ${formatINR(top.amount)} (${top.month})`;
  } else highestBillEl.textContent = "—";

  // Insights: highest & lowest spending months (total by month)
  const monthTotals = {};
  bills.forEach(b=>{
    const y = new Date(b.month + "-01").getFullYear();
    if(y === thisYear){
      monthTotals[b.month] = (monthTotals[b.month] || 0) + Number(b.amount);
    }
  });
  const monthKeys = Object.keys(monthTotals);
  if(monthKeys.length){
    const sorted = monthKeys.sort((a,b)=> monthTotals[b] - monthTotals[a]);
    insightHighestMonth.textContent = `Highest spending month: ${sorted[0]} — ${formatINR(monthTotals[sorted[0]])}`;
    insightLowestMonth.textContent = `Lowest spending month: ${sorted[sorted.length-1]} — ${formatINR(monthTotals[sorted[sorted.length-1]])}`;

    // percent change vs previous month (compare most recent two months present)
    const ordered = monthKeys.sort();
    const last = ordered[ordered.length-1];
    const prev = ordered[ordered.length-2];
    if(prev){
      const change = ((monthTotals[last] - monthTotals[prev]) / (monthTotals[prev] || 1)) * 100;
      insightPercent.textContent = `Change vs ${prev}: ${change.toFixed(1)}%`;
    } else insightPercent.textContent = "Not enough months for percent change";
  } else {
    insightHighestMonth.textContent = "Highest spending month: —";
    insightLowestMonth.textContent = "Lowest spending month: —";
    insightPercent.textContent = "Change vs last month: —";
  }

  return { totals, monthTotals };
}

/* -----------------------------
   Charts (render on Generate)
   -----------------------------*/
generateReportBtn.addEventListener("click", ()=>{
  const { totals, monthTotals } = summaryStats();
  renderCharts(totals, monthTotals);
  show(chartsArea);
});
hideReportBtn.addEventListener("click", ()=>{ hide(chartsArea); });

function renderCharts(totals, monthTotals){
  // Monthly trend: use sorted months
  const months = Object.keys(monthTotals).sort();
  const monthlyValues = months.map(m => monthTotals[m]);

  // Destroy previous charts
  if(monthlyChart) monthlyChart.destroy();
  if(categoryChart) categoryChart.destroy();
  if(pieChart) pieChart.destroy();

  // Monthly line
  const ctxM = document.getElementById("monthlyChart").getContext("2d");
  monthlyChart = new Chart(ctxM, {
    type: 'line',
    data: { labels: months, datasets: [{ label: 'Total', data: monthlyValues, borderColor: '#c9a84a', backgroundColor:'rgba(201,168,74,0.06)', tension:0.3 }] },
    options: { responsive:true, plugins:{ legend:{display:false} } }
  });

  // Category bar (this year totals)
  const ctxC = document.getElementById("categoryChart").getContext("2d");
  categoryChart = new Chart(ctxC, {
    type:'bar',
    data: { labels: ['Electricity','Gas','Internet'], datasets:[{ data:[totals.Electricity, totals.Gas, totals.Internet], backgroundColor:['rgba(201,168,74,0.95)','rgba(102,194,133,0.9)','rgba(95,183,255,0.9)'] }]},
    options:{ responsive:true, plugins:{ legend:{display:false} } }
  });

  // Pie distribution (percentage)
  const ctxP = document.getElementById("pieChart").getContext("2d");
  pieChart = new Chart(ctxP, {
    type:'pie',
    data:{ labels:['Electricity','Gas','Internet'], datasets:[{ data:[totals.Electricity, totals.Gas, totals.Internet], backgroundColor:['#c9a84a','#66c285','#5fb7ff'] }]},
    options:{ responsive:true, plugins:{ legend:{position:'bottom'} } }
  });
}

/* -----------------------------
   Refresh UI: table, stats
   -----------------------------*/
function refreshAll(){
  // update table & stats
  renderTable();
  summaryStats();
}

/* -----------------------------
   Table render wrapper
   -----------------------------*/
function renderTable(){
  renderTable(); // avoid recursion? We'll implement below differently
}
// Re-define to avoid name clash
(function defineRender(){
  const body = billsTableBody;
  window.renderTable = function(filtered){
    const bills = filtered || getBills();
    body.innerHTML = "";
    if(bills.length === 0){
      body.innerHTML = `<tr><td colspan="5" class="muted">No bills found</td></tr>`; return;
    }
    bills.slice().sort((a,b)=> new Date(b.month) - new Date(a.month)).forEach(b=>{
      const tr = document.createElement("tr");
      tr.className = b.type === "Electricity" ? "row-elec" : b.type === "Gas" ? "row-gas" : "row-net";
      tr.innerHTML = `<td>${b.type}</td><td>₹${Number(b.amount).toFixed(2)}</td><td>${b.month}</td><td>${b.paid? "Paid":"Unpaid"}</td>
        <td>
          <button class="btn" data-act="edit" data-id="${b.id}">Edit</button>
          <button class="btn" data-act="del" data-id="${b.id}">Delete</button>
        </td>`;
      body.appendChild(tr);
    });
    // actions
    body.querySelectorAll("button").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const act = btn.getAttribute("data-act");
        const idv = btn.getAttribute("data-id");
        if(act === "del"){ if(confirm("Delete?")) { deleteBill(idv); } }
        if(act === "edit"){ editBill(idv); }
      });
    });
  };
})();

/* -----------------------------
   Filters apply/reset
   -----------------------------*/
applyFilter.addEventListener("click", ()=>{
  let bills = getBills();
  const ft = filterType.value;
  const from = filterFrom.value;
  const to = filterTo.value;
  if(ft !== "All") bills = bills.filter(b => b.type === ft);
  if(from) bills = bills.filter(b => b.month >= from);
  if(to) bills = bills.filter(b => b.month <= to);
  renderTable(bills);
});
resetFilter.addEventListener("click", ()=>{ filterType.value = "All"; filterFrom.value=""; filterTo.value=""; renderTable(); });

/* -----------------------------
   Export / Import / Clear
   -----------------------------*/
exportCSVBtn.addEventListener("click", ()=>{
  const bills = getBills();
  if(bills.length === 0){ alert("No data"); return; }
  const keys = ['id','type','amount','month','paid'];
  const lines = [keys.join(',')];
  bills.forEach(b => lines.push(`${b.id},${b.type},${b.amount},${b.month},${b.paid}`));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${currentUser}_bills.csv`; a.click();
});
exportJSONBtn.addEventListener("click", ()=>{
  const users = loadUsers();
  const userData = users[currentUser];
  const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${currentUser}_bills.json`; a.click();
});
importJSONBtn.addEventListener("click", ()=> importFile.click());
importFile.addEventListener("change", (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    try{
      const data = JSON.parse(ev.target.result);
      // expecting {pwd, bills:[]}
      const users = loadUsers();
      users[currentUser].bills = Array.isArray(data.bills) ? data.bills : users[currentUser].bills;
      saveUsers(users);
      alert("Imported.");
      refreshAll();
    }catch(err){ alert("Invalid JSON"); }
  };
  reader.readAsText(f);
});
clearAllBtn.addEventListener("click", ()=>{
  if(!confirm("Clear all bills for this account?")) return;
  const users = loadUsers();
  users[currentUser].bills = [];
  saveUsers(users);
  refreshAll();
});

/* -----------------------------
   Helpers, id, format
   -----------------------------*/
function id(){ return Date.now().toString(36) + Math.random().toString(36,7).slice(2,8); }
function formatINR(n){ return "₹" + Number(n).toLocaleString('en-IN', { maximumFractionDigits:2 }); }

/* -----------------------------
   delete/edit implementation
   -----------------------------*/
function deleteBill(idv){ let bills = getBills(); bills = bills.filter(b=> b.id !== idv); setBills(bills); refreshAll(); }
function editBill(idv){
  const bills = getBills();
  const item = bills.find(b=> b.id === idv);
  if(!item) return alert("Not found");
  // populate add form and remove original
  addType.value = item.type; addAmount.value = item.amount; addDate.value = item.month; addStatus.value = item.paid ? "true":"false";
  setBills(bills.filter(b=> b.id !== idv));
  // switch to Add view
  document.querySelector('.nav-btn[data-view="add"]').click();
}

/* -----------------------------
   get/set bills wrapper
   -----------------------------*/
function getBills(){
  const users = loadUsers();
  if(!users[currentUser]) return [];
  return users[currentUser].bills || [];
}
function setBills(arr){
  const users = loadUsers();
  users[currentUser].bills = arr;
  saveUsers(users);
}

/* -----------------------------
   Refresh whole UI
   -----------------------------*/
function refreshAll(){
  renderTable();
  summaryStats();
}

/* -----------------------------
   On load: auto-login if single user exists? keep user logged-out
   -----------------------------*/
window.addEventListener("load", ()=>{
  // nothing auto: show auth
  tabLogin.click();
});

/* -----------------------------
   Utility: capital to element IDs mapping used in nav show/hide
   -----------------------------*/
Array.from(document.querySelectorAll(".nav-btn")).forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    // hide all views then show match
    views.forEach(v => v.classList.add("hidden"));
    const viewName = btn.getAttribute("data-view");
    const id = "view" + viewName.charAt(0).toUpperCase() + viewName.slice(1);
    document.getElementById(id).classList.remove("hidden");
    if(viewName === "history") renderTable();
  });
});
