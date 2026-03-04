const FeatureBills = (function () {

let elList = null
let btnAdd = null

function init() {
elList = AppUtils.qs("#bills-list")
btnAdd = AppUtils.qs("#bill-add")

if (btnAdd) {
btnAdd.addEventListener("click", function () {
openAdd()
})
}

AppState.on("data", function () {
render()
})

AppState.on("screen", function (s) {
if (s === "bills") render()
})

render()
}

function ensureBills() {
let d = AppState.getData()
if (!Array.isArray(d.bills)) d.bills = []
}

function getCurrency() {
let d = AppState.getData()
return (d && d.settings && d.settings.currency) ? d.settings.currency : AppConfig.defaultCurrency
}

function parseAmount(v) {
if (v == null) return 0
let s = String(v).replace(",", ".").replace(/[^0-9.\-]/g, "")
let n = Number(s)
if (!isFinite(n)) return 0
return n
}

function todayStr() {
return AppUtils.today()
}

function dateToTime(ds) {
let t = Date.parse(ds)
if (!isFinite(t)) return 0
return t
}

function render() {
if (!elList) return
ensureBills()

AppUI.clear(elList)

let d = AppState.getData()
let bills = (d.bills || []).slice()
let currency = getCurrency()

bills.sort(function (a, b) {
return dateToTime(a.dueDate) - dateToTime(b.dueDate)
})

let card = AppUI.card("Bills")
if (bills.length === 0) {
card.appendChild(AppUI.emptyState("No bills yet."))
} else {
for (let i = 0; i < bills.length; i++) {
card.appendChild(buildRow(bills[i], currency))
}
}
elList.appendChild(card)
}

function buildRow(b, currency) {
let row = AppUtils.el("div")
row.className = "item"

let left = AppUtils.el("div")
left.className = "item__left"

let name = AppUtils.el("div")
name.className = "item__note"
name.textContent = String(b.name || "Bill")

let amount = Number(b.amount) || 0
let due = String(b.dueDate || "")
let status = b.paid ? "Paid" : "Due"

let sub = AppUtils.el("div")
sub.className = "item__date"
sub.textContent = status + " • " + due

left.appendChild(name)
left.appendChild(sub)

let right = AppUtils.el("div")
right.className = "item__sum"
right.textContent = AppUtils.formatMoney(amount, currency)
right.style.color = b.paid ? "#34d399" : "#e2e8f0"

row.appendChild(left)
row.appendChild(right)

row.addEventListener("click", function () {
openEdit(b.id)
})

return row
}

function openAdd() {
ensureBills()
let currency = getCurrency()

AppUI.formModal({
title: "Add Bill",
okText: "Save",
cancelText: "Cancel",
fields: [
{ id: "name", label: "Name", kind: "text", placeholder: "e.g., Rent", value: "" },
{ id: "amount", label: "Amount (" + currency + ")", kind: "number", placeholder: "0", value: "" },
{ id: "dueDate", label: "Due Date", kind: "date", value: todayStr() },
{
id: "paid",
label: "Status",
kind: "select",
value: "no",
options: [
{ value: "no", label: "Not paid" },
{ value: "yes", label: "Paid" }
]
}
],
onSubmit: function (values) {
let name = String(values.name || "").trim()
if (!name) {
AppUI.toast("Enter a bill name.")
return false
}
if (name.length > 40) name = name.slice(0, 40)

let amount = parseAmount(values.amount)
if (!(amount > 0)) {
AppUI.toast("Enter a valid amount.")
return false
}

let dueDate = String(values.dueDate || todayStr())
let paid = values.paid === "yes"

let d = AppState.getData()
d.bills.push({
id: AppUtils.uuid(),
name: name,
amount: amount,
dueDate: dueDate,
paid: paid,
createdAt: Date.now()
})
AppState.save()
AppUI.toast("Saved.")
return true
}
})
}

function openEdit(id) {
ensureBills()
let d = AppState.getData()
let bills = d.bills || []
let idx = indexById(bills, id)
if (idx < 0) return
let b = bills[idx]
let currency = getCurrency()

let body = AppUtils.el("div")

let btnRow = AppUtils.el("div")
btnRow.style.display = "flex"
btnRow.style.gap = "10px"
btnRow.style.marginBottom = "10px"

let delBtn = AppUtils.el("button")
delBtn.textContent = "Delete"
delBtn.style.background = "rgba(251,113,133,0.16)"
delBtn.style.color = "#fb7185"
delBtn.addEventListener("click", function () {
AppUI.confirm("Delete Bill", "Delete this bill?", function () {
removeById(id)
AppUI.closeModal()
AppUI.toast("Deleted.")
})
})

let toggleBtn = AppUtils.el("button")
toggleBtn.textContent = b.paid ? "Mark Unpaid" : "Mark Paid"
toggleBtn.style.background = "rgba(148,163,184,0.18)"
toggleBtn.style.color = "#e2e8f0"
toggleBtn.addEventListener("click", function () {
togglePaid(id)
AppUI.closeModal()
AppUI.toast("Updated.")
})

btnRow.appendChild(delBtn)
btnRow.appendChild(toggleBtn)
body.appendChild(btnRow)

let formWrap = AppUtils.el("div")
body.appendChild(formWrap)

AppUI.openModal({
title: "Edit Bill",
bodyEl: body,
cancelText: "Close",
okText: "Save",
onOk: function () {
let modal = document.querySelector(".modal")
if (!modal) return true
let inputs = modal.querySelectorAll("input, select")
if (!inputs || inputs.length < 4) return true

let name = String(inputs[0].value || "").trim()
let amount = parseAmount(inputs[1].value)
let dueDate = String(inputs[2].value || todayStr())
let paid = inputs[3].value === "yes"

if (!name) {
AppUI.toast("Enter a bill name.")
return false
}
if (!(amount > 0)) {
AppUI.toast("Enter a valid amount.")
return false
}

let d2 = AppState.getData()
let bills2 = d2.bills || []
let idx2 = indexById(bills2, id)
if (idx2 < 0) return true

bills2[idx2].name = name
bills2[idx2].amount = amount
bills2[idx2].dueDate = dueDate
bills2[idx2].paid = paid

AppState.save()
AppUI.toast("Saved.")
return true
}
})

setTimeout(function () {
let modal = document.querySelector(".modal")
if (!modal) return

formWrap.innerHTML = ""

let name = AppUtils.el("input")
name.type = "text"
name.value = String(b.name || "")
name.placeholder = "Name"

let amount = AppUtils.el("input")
amount.type = "text"
amount.inputMode = "decimal"
amount.value = String(b.amount || "")
amount.placeholder = "0"

let dueDate = AppUtils.el("input")
dueDate.type = "date"
dueDate.value = String(b.dueDate || todayStr())

let paid = AppUtils.el("select")
let o1 = AppUtils.el("option")
o1.value = "no"
o1.textContent = "Not paid"
let o2 = AppUtils.el("option")
o2.value = "yes"
o2.textContent = "Paid"
paid.appendChild(o1)
paid.appendChild(o2)
paid.value = b.paid ? "yes" : "no"

appendField(formWrap, "Name", name)
appendField(formWrap, "Amount (" + currency + ")", amount)
appendField(formWrap, "Due Date", dueDate)
appendField(formWrap, "Status", paid)
}, 0)
}

function togglePaid(id) {
let d = AppState.getData()
let bills = d.bills || []
let idx = indexById(bills, id)
if (idx < 0) return
bills[idx].paid = !bills[idx].paid
AppState.save()
}

function appendField(root, labelText, inputEl) {
let wrap = AppUtils.el("div")
wrap.style.marginBottom = "10px"
let lab = AppUtils.el("label")
lab.style.display = "block"
lab.style.fontSize = "12px"
lab.style.fontWeight = "700"
lab.style.color = "#94a3b8"
lab.style.marginBottom = "6px"
lab.textContent = labelText
wrap.appendChild(lab)
wrap.appendChild(inputEl)
root.appendChild(wrap)
}

function indexById(list, id) {
for (let i = 0; i < list.length; i++) {
if (list[i].id === id) return i
}
return -1
}

function removeById(id) {
let d = AppState.getData()
let bills = d.bills || []
let next = []
for (let i = 0; i < bills.length; i++) {
if (bills[i].id !== id) next.push(bills[i])
}
d.bills = next
AppState.save()
}

return {
init,
openAdd
}

})()
