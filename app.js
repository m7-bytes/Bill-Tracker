/* BillTracker app.js
   - Multiple local accounts
   - Show/hide password
   - Add/Edit/Delete bills
   - Color-coded: Electricity (orange), Gas (green), Internet (blue)
   - Generate Report button (charts update only when clicked)
   - Export/Import CSV or JSON, clear all data for the account
*/

/* ---------- Keys & state ---------- */
const USERS_KEY = "bt_users_v1";
const SESSION_USER = "bt_session_user";
const BILLS_PREFIX = "bt_bills_"; // full key: bt_bills_<username>

let currentUser = localStorage.getItem(SESSION_USER) || null;
let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
let bills = [];

/* ---------- DOM ---------- */
/* Login */
const loginOverlay = document.getElementById('loginOverlay');
const loginUser = document.getElementById('loginUser');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const showPwLogin = document.getElementById('showPwLogin');
const openCreate = document.getElementById('openCreate');
const loginView = document.getElementById('loginView');
const createView = document.getElementById('createView');
const newUser = document.getElementById('newUser');
const newPassword = document.getElementById('newPassword');
const newPassword2 = document.getElementById('newPassword2');
const createBtn = document.getElementById('createBtn');
const cancelCreate = document.getElementById('cancelCreate');
const showPwCreate = document.getElementById('showPwCreate');
const loginMsg = document.getElementById('loginMsg');
const createMsg = document.getElementById('createMsg');

/* App */
const appEl = document.getElementById('app');
const signedInAs = document.getElementById('signedInAs');
const navBtns = document.querySelectorAll('.navBtn');
const views = document.querySelectorAll('.view');
const logoutBtn = document.getElementById('logoutBtn');

/* Form / table */
const billForm = document.getElementById('billForm');
const billType = document.getElementById('billType');
const billAmount = document.getElementById('billAmount');
const billDate = document.getElementById('billDate');
const billPaid = document.getElementById('billPaid');
const clearFormBtn = document.getElementById('clearForm');
const billTableBody = document.querySelector('#billTable tbody');

/* Filters */
const filterType = document.getElementById('filterType');
const filterFrom = document.getElementById('filterFrom');
const filterTo = document.getElementById('filterTo');
const applyFilter = document.getElementById('applyFilter');
const resetFilter = document.getElementById('resetFilter');

/* Export / import */
const exportCSV = document.getElementById('exportCSV');
const downloadJSON = document.getElementById('downloadJSON');
const importJSON = document.getElementById('importJSON');
const importFile = document.getElementById('importFile');
const clearAllDataBtn = document.getElementById('clearAllData');

/* Reports */
const generateReport = document.getElementById('generateReport');
const reportArea = document.getElementById('reportArea');
let monthlyChart=null, annualChart=null;

/* Summary */
const totalMonthlyEl = document.getElementById('totalMonthly');
const totalYearlyEl = document.getElementById('totalYearly');
const mostExpensiveEl = document.getElementById('mostExpensive');

/* ---------- Helpers ---------- */
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function inr(amount){ return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(amount); }
function getBillsKey(user){ return `${BILLS_PREFIX}${user}`; }
function loadUsers(){ users = JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
function saveUsers(){ localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function loadBills(){ bills = JSON.parse(localStorage.getItem(getBillsKey(currentUser))) || []; }
function saveBills(){ localStorage.setItem(getBillsKey(currentUser), JSON.stringify(bills)); }

/* ---------- Auth UI ---------- */
showPwLogin.addEventListener('change', ()=> loginPassword.type = showPwLogin.checked ? 'text' : 'password');
showPwCreate.addEventListener('change', ()=> {
  newPassword.type = showPwCreate.checked ? 'text' : 'password';
  newPassword2.type = showPwCreate.checked ? 'text' : 'password';
});

openCreate.addEventListener('click', ()=> {
  loginView.classList.add('hidden');
  createView.classList.remove('hidden');
});
cancelCreate.addEventListener('click', ()=> {
  createView.classList.add('hidden');
  loginView.classList.remove('hidden');
  createMsg.textContent='';
});

/* Create user */
createBtn.addEventListener('click', ()=>{
  const u = (newUser.value || '').trim();
  const p = (newPassword.value || '');
  const p2 = (newPassword2.value || '');
  if(!u || !p){ createMsg.textContent = 'Username & password required'; return; }
  if(p !== p2){ createMsg.textContent = 'Passwords do not match'; return; }
  loadUsers();
  if(users.find(x=>x.username===u)){ createMsg.textContent = 'Username already exists'; return; }
  users.push({username:u, pwd:btoa(p)});
  saveUsers();
  // initialize empty bills
  localStorage.setItem(getBillsKey(u), JSON.stringify([]));
  createMsg.textContent='';
  alert('Account created. Now login with your new credentials.');
  newUser.value=''; newPassword.value=''; newPassword2.value='';
  createView.classList.add('hidden'); loginView.classList.remove('hidden');
});

/* Login */
loginBtn.addEventListener('click', ()=> {
  const u = (loginUser.value || '').trim();
  const p = (loginPassword.value || '');
  if(!u || !p){ loginMsg.textContent = 'Enter username & password'; return; }
  loadUsers();
  const found = users.find(x => x.username === u && x.pwd === btoa(p));
  if(!found){ loginMsg.textContent = 'Invalid credentials'; return; }
  loginMsg.textContent = '';
  currentUser = u;
  localStorage.setItem(SESSION_USER, currentUser);
  loadBills();
  unlockApp();
});

/* Logout */
logoutBtn.addEventListener('click', ()=> {
  if(confirm('Logout?')) {
    localStorage.removeItem(SESSION_USER);
    currentUser = null;
    bills = [];
    lockApp();
  }
});

/* Lock/unlock UI */
function lockApp(){
  appEl.classList.add('hidden');
  loginOverlay.style.display = 'flex';
  loginUser.value=''; loginPassword.value='';
  // ensure login view visible
  loginView.classList.remove('hidden');
  createView.classList.add('hidden');
}
function unlockApp(){
  loginOverlay.style.display = 'none';
  appEl.classList.remove('hidden');
  signedInAs.textContent = `Signed in: ${currentUser}`;
  // show Reports view by default (user requested)
  document.querySelectorAll('.navBtn').forEach(b=>b.classList.remove('active'));
  const reportsBtn = [...navBtns].find(b=>b.dataset.view==='reports');
  if(reportsBtn) { reportsBtn.classList.add('active'); }
  views.forEach(v => v.id === 'reports' ? v.classList.remove('hidden') : v.classList.add('hidden'));
  renderAll();
}

/* check session on load */
if(currentUser){
  loadBills();
  unlockApp();
} else {
  lockApp();
}

/* Enter on password */
loginPassword.addEventListener('keydown', e => { if(e.key === 'Enter') loginBtn.click(); });

/* ---------- Navigation ---------- */
navBtns.forEach(btn => {
  btn.addEventListener('click', ()=> {
    navBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    views.forEach(v => v.id === view ? v.classList.remove('hidden') : v.classList.add('hidden'));
  });
});

/* ---------- Add / Edit Bills ---------- */
billForm.addEventListener('submit', e => {
  e.preventDefault();
  const newBill = {
    id: uid(),
    type: billType.value,
    amount: parseFloat(billAmount.value) || 0,
    date: billDate.value,
    paid: billPaid.value === "true"
  };
  bills.push(newBill);
  saveBills();
  renderAll();
  billForm.reset();
  // switch to history view to quickly see it
  document.querySelector('[data-view="history"]').click();
});
clearFormBtn.addEventListener('click', ()=> billForm.reset());

/* ---------- Table rendering ---------- */
function renderTable(filtered = bills){
  billTableBody.innerHTML = '';
  if(filtered.length === 0){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="5" class="muted">No bills found</td>`;
    billTableBody.appendChild(tr); return;
  }
  filtered.sort((a,b) => new Date(b.date) - new Date(a.date));
  filtered.forEach(bill => {
    const tr = document.createElement('tr');
    let rowClass = '';
    if(bill.type === 'Electricity') rowClass = 'rowColorElectricity';
    if(bill.type === 'Gas') rowClass = 'rowColorGas';
    if(bill.type === 'Internet') rowClass = 'rowColorInternet';
    tr.className = rowClass;

    const statusLabel = bill.paid ? `<span class="statusPaid">Paid</span>` : `<span class="statusUnpaid">Unpaid</span>`;
    tr.innerHTML = `
      <td>${bill.type}</td>
      <td>${inr(bill.amount)}</td>
      <td>${bill.date}</td>
      <td>${statusLabel}</td>
      <td class="actions">
        <button class="btn" data-action="toggle" data-id="${bill.id}">${bill.paid ? 'Mark Unpaid' : 'Mark Paid'}</button>
        <button class="btn" data-action="edit" data-id="${bill.id}">Edit</button>
        <button class="btn" data-action="delete" data-id="${bill.id}">Delete</button>
      </td>
    `;
    billTableBody.appendChild(tr);
  });

  billTableBody.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id; const action = btn.dataset.action;
      if(action === 'toggle') togglePaid(id);
      if(action === 'delete') { if(confirm('Delete this bill?')) deleteBill(id); }
      if(action === 'edit') editBill(id);
    });
  });
}

function deleteBill(id){
  bills = bills.filter(b => b.id !== id);
  saveBills();
  renderAll();
}
function togglePaid(id){
  const idx = bills.findIndex(b => b.id === id);
  if(idx >= 0) { bills[idx].paid = !bills[idx].paid; saveBills(); renderAll(); }
}
function editBill(id){
  const b = bills.find(x => x.id === id);
  if(!b) return alert('Bill not found');
  billType.value = b.type;
  billAmount.value = b.amount;
  billDate.value = b.date;
  billPaid.value = b.paid ? "true" : "false";
  bills = bills.filter(x => x.id !== id);
  saveBills();
  document.querySelector('[data-view="add"]').click();
}

/* ---------- Filters ---------- */
applyFilter.addEventListener('click', ()=> {
  const type = filterType.value; const from = filterFrom.value; const to = filterTo.value;
  let filtered = bills.slice();
  if(type !== 'All') filtered = filtered.filter(b => b.type === type);
  if(from) filtered = filtered.filter(b => new Date(b.date) >= new Date(from));
  if(to) filtered = filtered.filter(b => new Date(b.date) <= new Date(to));
  renderTable(filtered);
});
resetFilter.addEventListener('click', ()=> {
  filterType.value = 'All'; filterFrom.value=''; filterTo.value=''; renderTable();
});

/* ---------- Export / Import / Clear ---------- */
function toCSV(rows){
  if(rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(',')];
  rows.forEach(r => {
    lines.push(keys.map(k => `"${(r[k] ?? '').toString().replace(/"/g,'""')}"`).join(','));
  });
  return lines.join('\n');
}
exportCSV.addEventListener('click', ()=> {
  const csv = toCSV(bills);
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = `bills_${currentUser}_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
});
downloadJSON.addEventListener('click', ()=> {
  const blob = new Blob([JSON.stringify(bills, null, 2)], {type:'application/json'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `bills_backup_${currentUser}_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
});
importJSON.addEventListener('click', ()=> importFile.click());
importFile.addEventListener('change', (e)=> {
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    try {
      const data = JSON.parse(ev.target.result);
      if(Array.isArray(data)){
        bills = data.map(d => ({ id: d.id || uid(), type: d.type || 'Electricity', amount: parseFloat(d.amount) || 0, date: d.date || new Date().toISOString().slice(0,10), paid: !!d.paid }));
        saveBills(); renderAll(); alert('Imported successfully');
      } else alert('Invalid JSON format (expected array)');
    } catch(err){ alert('Error parsing JSON'); }
  };
  reader.readAsText(file);
});
clearAllDataBtn.addEventListener('click', ()=> {
  if(!confirm('This will permanently delete all bills for this account. Continue?')) return;
  bills = []; saveBills(); renderAll(); alert('All data cleared for this account.');
});

/* ---------- Reports (generate on click) ---------- */
generateReport.addEventListener('click', ()=> {
  reportArea.classList.remove('hidden');
  renderReportCharts();
});

/* Chart rendering (for reports) */
function renderReportCharts(){
  const thisYear = new Date().getFullYear();
  const months = Array.from({length:12}, (_,i) => `${thisYear}-${String(i+1).padStart(2,'0')}`);
  const monthlyTotals = months.map(()=>0);

  bills.forEach(b => {
    if(!b.date) return;
    const d = new Date(b.date);
    if(d.getFullYear() === thisYear){
      const idx = d.getMonth();
      monthlyTotals[idx] += Number(b.amount) || 0;
    }
  });

  // Monthly chart
  if(monthlyChart) monthlyChart.destroy();
  const ctxM = document.getElementById('monthlyChart').getContext('2d');
  monthlyChart = new Chart(ctxM, {
    type: 'line',
    data: { labels: months.map(m=>m.slice(5)), datasets:[{ label:`Monthly spend ${thisYear}`, data: monthlyTotals, borderColor:'#c9a84a', backgroundColor:'rgba(201,168,74,0.06)', tension:0.25, pointRadius:3, pointBackgroundColor:'#c9a84a' }]},
    options:{ plugins:{ legend:{display:false} }, scales:{ y:{ ticks:{ callback: v => inr(v) } } } }
  });

  // Category totals
  const categories = ['Electricity','Gas','Internet'];
  const catTotals = categories.map(cat => bills.reduce((s,b) => (new Date(b.date).getFullYear() === thisYear && b.type === cat ? s + Number(b.amount) : s), 0));

  if(annualChart) annualChart.destroy();
  const ctxA = document.getElementById('annualChart').getContext('2d');
  annualChart = new Chart(ctxA, {
    type: 'bar',
    data: { labels: categories, datasets: [{ label: `Category spend ${thisYear}`, data: catTotals, backgroundColor: ['rgba(255,154,60,0.95)','rgba(102,194,133,0.9)','rgba(95,183,255,0.9)'] }]},
    options:{ plugins:{ legend:{display:false} }, scales:{ y:{ ticks:{ callback: v => inr(v) } } } }
  });
}

/* ---------- Summary & dashboard (auto) ---------- */
function renderSummary(){
  const now = new Date();
  const year = now.getFullYear();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalMonthly = bills.reduce((s,b) => { const d = new Date(b.date); return s + ((d >= monthStart && d.getFullYear()===year) ? Number(b.amount) : 0); }, 0);
  const totalYearly = bills.reduce((s,b) => s + ((new Date(b.date).getFullYear() === year) ? Number(b.amount) : 0), 0);
  const thisYearBills = bills.filter(b => new Date(b.date).getFullYear() === year);
  const mostExp = thisYearBills.length ? thisYearBills.reduce((p,c) => c.amount > (p.amount||0) ? c : p, thisYearBills[0]) : null;

  totalMonthlyEl.textContent = inr(totalMonthly);
  totalYearlyEl.textContent = inr(totalYearly);
  mostExpensiveEl.textContent = mostExp ? `${mostExp.type} • ${inr(mostExp.amount)} (${mostExp.date})` : '—';
}

/* ---------- Render all ---------- */
function renderAll(){
  renderTable();
  renderSummary();
}

/* ---------- Initial setup: default view is Reports after login ---------- */
document.addEventListener('DOMContentLoaded', ()=> {
  // set Reports as default nav active (on app unlock we explicitly set)
  // ensure inputs behave nicely
  document.querySelectorAll('.navBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.navBtn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});
