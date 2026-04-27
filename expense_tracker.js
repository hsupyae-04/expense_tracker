// STATE
let currentUser = localStorage.getItem("currentUser");
let transactions = [];
let filter="all", searchText="", selectedMonth="";
let editId=null;
let pieChart, barChart;

// DOM
const el = {
  form: document.getElementById("form"),
  list: document.getElementById("list"),
  income: document.getElementById("income"),
  expense: document.getElementById("expense"),
  profit: document.getElementById("profit"),
  type: document.getElementById("type"),
  name: document.getElementById("name"),
  amount: document.getElementById("amount"),
  qty: document.getElementById("qty"),
  date: document.getElementById("date"),
  search: document.getElementById("search"),
  month: document.getElementById("monthFilter"),
  loginPage: document.getElementById("loginPage"),
  app: document.getElementById("app"),
  username: document.getElementById("username"),
  password: document.getElementById("password"),
  pie: document.getElementById("pieChart"),
  bar: document.getElementById("barChart")
};


if (!localStorage.getItem("users")) {
  localStorage.setItem("users", JSON.stringify({
    hsu: "1234",
    admin: "admin123"
  }));
}

function login() {

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  let users = JSON.parse(localStorage.getItem("users")) || {};

  // auto register
  if (!users[username]) {
    users[username] = password;
    localStorage.setItem("users", JSON.stringify(users));
  }

  // login check
  if (users[username] === password) {
    localStorage.setItem("currentUser", username);

    document.getElementById("loginPage").style.display = "none";
    document.getElementById("app").style.display = "block";

  } else {
    alert("Wrong password");
  }
}




function logout(){
  localStorage.removeItem("currentUser");
  location.reload();
}

function showApp(){
  el.loginPage.style.display="none";
  el.app.style.display="block";
}

// DATA
function loadData(){
  transactions=JSON.parse(localStorage.getItem(currentUser))||[];
}

function save(){
  localStorage.setItem(currentUser,JSON.stringify(transactions));
}

// ADD
el.form.addEventListener("submit", e=>{
  e.preventDefault();

  let t={
    id:editId||Date.now(),
    type:el.type.value,
    name:el.name.value,
    amount:+el.amount.value,
    qty:+el.qty.value,
    date:el.date.value
  };

  if(editId){
    transactions=transactions.map(x=>x.id===editId?t:x);
    editId=null;
  } else transactions.push(t);

  save(); updateUI(); el.form.reset();
});

// UI
function updateUI(){
  el.list.innerHTML="";
  let income=0, expense=0;

  let filtered=transactions
    .filter(t=>filter==="all"||t.type===filter)
    .filter(t=>t.name.toLowerCase().includes(searchText))
    .filter(t=>!selectedMonth||t.date.startsWith(selectedMonth));

  if(filtered.length===0){
    el.list.innerHTML="<tr><td colspan='4'>No data</td></tr>";
  }

  filtered.forEach(t=>{
    let row=document.createElement("tr");
    row.innerHTML=`
      <td>${t.name}</td>
      <td>${t.qty}</td>
      <td>Rp ${t.amount}</td>
      <td>
        <button onclick="edit(${t.id})">✏️</button>
        <button onclick="del(${t.id})">❌</button>
      </td>`;
    el.list.appendChild(row);

    t.type==="income"?income+=t.amount:expense+=t.amount;
  });

  el.income.innerText=income;
  el.expense.innerText=expense;
  el.profit.innerText=income-expense;

  drawPie(income,expense);
  drawBar();
}

// FILTER
function setFilter(f){filter=f;updateUI();}
function searchTransaction(){searchText=el.search.value.toLowerCase();updateUI();}
function filterByMonth(){selectedMonth=el.month.value;updateUI();}

// EDIT / DELETE
function edit(id){
  let t=transactions.find(x=>x.id===id);
  el.type.value=t.type;
  el.name.value=t.name;
  el.amount.value=t.amount;
  el.qty.value=t.qty;
  el.date.value=t.date;
  editId=id;
}

function del(id){
  transactions=transactions.filter(x=>x.id!==id);
  save(); updateUI();
}

// CHARTS
function drawPie(income,expense){
  if(pieChart) pieChart.destroy();
  pieChart=new Chart(el.pie,{
    type:"doughnut",
    data:{labels:["Income","Expense"],datasets:[{data:[income,expense]}]}
  });
}

function drawBar(){
  let m={};
  transactions.forEach(t=>{
    let key=t.date.slice(0,7);
    if(!m[key]) m[key]={income:0,expense:0};
    t.type==="income"?m[key].income+=t.amount:m[key].expense+=t.amount;
  });

  let labels=Object.keys(m);
  let incomeData=labels.map(x=>m[x].income);
  let expenseData=labels.map(x=>m[x].expense);

  if(barChart) barChart.destroy();
  barChart=new Chart(el.bar,{
    type:"bar",
    data:{labels,
      datasets:[
        {label:"Income",data:incomeData},
        {label:"Expense",data:expenseData}
      ]}
  });
}

// EXPORT
function exportCSV(){
  let csv="Type,Name,Amount,Qty,Date\n";
  transactions.forEach(t=>{
    csv+=`${t.type},${t.name},${t.amount},${t.qty},${t.date}\n`;
  });
  let blob=new Blob([csv]);
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="report.csv";
  a.click();
}

// INIT
if(currentUser){
  loadData();
  showApp();
}
updateUI();
