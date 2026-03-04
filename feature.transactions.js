const FeatureTransactions = (function () {

let elFilters = null
let elList = null
let elDashBalance = null
let elDashSummary = null
let elDashRecent = null
let btnDashAdd = null

function init() {
elFilters = AppUtils.qs("#transactions-filters")
elList = AppUtils.qs("#transactions-list")
elDashBalance = AppUtils.qs("#dashboard-balance")
elDashSummary = AppUtils.qs("#dashboard-summary")
elDashRecent = AppUtils.qs("#dashboard-recent")
btnDashAdd = AppUtils.qs("#dashboard-add")

if (btnDashAdd) {
btnDashAdd.addEventListener("click", function () {
openAdd()
})
}

AppState.on("data", function () {
renderAll()
})
AppState.on("transactionsFilters", function () {
renderTransactions()
})
AppState.on("screen", function (s) {
if (s === "dashboard") renderDashboard()
if (s === "transactions") renderTransactions()
})

renderAll()
}

function renderAll() {
renderDashboard()
renderTransactions()
}

function getCurrency() {
let d = AppState.getData()
return (d && d.settings && d.settings.currency) ? d.settings.currency : AppConfig.defaultCurrency
}

function getCategoriesMap() {
let d = AppState.getData()
let map = {}
let inc = (d && d.categories && d.categories.income) ? d.categories.income : []
let exp = (d && d.categories && d.categories.expense) ? d.categories.expense : []
for (let i = 0; i < inc.length; i++) map[inc[i].id] = inc[i].name
for (let i = 0; i < exp.length; i++) map[exp[i].id] = exp[i].name
return map
}

function parseAmount(v) {
if (v == null) return 0
let s = String(v).replace(",", ".").replace(/[^0-9.\-]/g, "")
let n = Number(s)
if (!isFinite(n)) return 0
return n
}

function dateToTime(dateStr) {
if (!dateStr) return 0
let t = Date.parse(dateStr)
if (!isFinite(t)) return 0
return t
}

function nowMonthKey() {
let d = new Date()
let y = d.getFullYear()
let m = String(d.getMonth() + 1).padStart(2, "0")
return y + "-" + m
}

function txnMonthKey(txn) {
let ds = txn && txn.date ? String(txn.date) : ""
if (ds.length >= 7) return ds.substring(0, 7)
return ""
}

function calcTotals(transactions, monthKey) {
let income = 0
let expense = 0
for (let i = 0; i < transactions.length; i++) {
let t = transactions[i]
if (monthKey && txnMonthKey(t) !== monthKey) continue
let a = Number(t.amount) || 0
if (t.type === "income") income += a
else expense += a
}
return {
income,
expense,
balance: income - expense
}
}

function renderDashboard() {
if (!elDashBalance || !elDashSummary || !elDashRecent) return

let d = AppState.getData()
let txns = (d && d.transactions) ? d.transactions : []
let currency = getCurrency()
let monthKey = nowMonthKey()
let totals = calcTotals(txns, monthKey)

AppUI.clear(elDashBalance)
AppUI.clear(elDashSummary)
AppUI.clear(elDashRecent)

let cardBalance = AppUI.card("This Month")
let bal = AppUtils.el("div")
bal.className = "balance"
bal.textContent = AppUtils.formatMoney(totals.balance, currency)
cardBalance.appendChild(bal)

let summary = AppUtils.el("div")
summary.className = "summary"

let inc = AppUtils.el("div")
let incV = AppUtils.el("div")
incV.style.fontWeight = "800"
incV.textContent = AppUtils.formatMoney(totals.income, currency)
let incL = AppUtils.el("div")
incL.style.color = "#94a3b8"
incL.style.fontSize = "12px"
incL.textContent = "Income"
inc.appendChild(incV)
inc.appendChild(incL)

let exp = AppUtils.el("div")
let expV = AppUtils.el("div")
expV.style.fontWeight = "800"
expV.textContent = AppUtils.formatMoney(totals.expense, currency)
let expL = AppUtils.el("div")
expL.style.color = "#94a3b8"
expL.style.fontSize = "12px"
expL.textContent = "Expenses"
exp.appendChild(expV)
exp.appendChild(expL)

summary.appendChild(inc)
summary.appendChild(exp)
cardBalance.appendChild(summary)

elDashBalance.appendChild(cardBalance)

let recentCard = AppUI.card("Recent")
let recent = getSorted(txns, "date_desc").slice(0, 5)
if (recent.length === 0) {
recentCard.appendChild(AppUI.emptyState("No transactions yet."))
} else {
let catMap = getCategoriesMap()
for (let i = 0; i < recent.length; i++) {
let t = recent[i]
let left = buildTxnLeftText(t, catMap)
let right = buildTxnRightText(t, currency)
let cls = t.type === "income" ? "item__sum--income" : "item__sum--expense"
let row = AppUI.rowLeftRight(left, right, cls)
row.addEventListener("click", (function (id) {
return function () { openEdit(id) }
})(t.id))
recentCard.appendChild(row)
}
}
elDashRecent.appendChild(recentCard)

let hintCard = AppUI.card("Tip")
let hint = AppUtils.el("div")
hint.style.color = "#94a3b8"
hint.style.fontSize = "13px"
hint.style.lineHeight = "1.35"
hint.textContent = "Add transactions daily to keep your budget and stats accurate."
hintCard.appendChild(hint)
elDashSummary.appendChild(hintCard)
}

function buildTxnLeftText(t, catMap) {
let note = (t && t.note) ? String(t.note).trim() : ""
let cat = (t && t.categoryId && catMap[t.categoryId]) ? catMap[t.categoryId] : "Uncategorized"
let d = (t && t.date) ? String(t.date) : ""
let line1 = note ? note : cat
let line2 = ""
if (note) line2 = cat + " • " + d
else line2 = d
return line1 + "\n" + line2
}

function buildTxnRightText(t, currency) {
let a = Number(t.amount) || 0
let s = AppUtils.formatMoney(a, currency)
if (t.type === "expense" && a > 0) s = "-" + s
if (t.type === "income" && a > 0) s = "+" + s
return s
}

function getSorted(list, sort) {
let arr = list.slice()
arr.sort(function (a, b) {
let ta = dateToTime(a.date)
let tb = dateToTime(b.date)
if (sort === "date_asc") return ta - tb
if (sort === "amount_desc") return (Number(b.amount) || 0) - (Number(a.amount) || 0)
if (sort === "amount_asc") return (Number(a.amount) || 0) - (Number(b.amount) || 0)
return tb - ta
})
return arr
}

function renderTransactions() {
if (!elFilters || !elList) return

renderFilters()
renderList()
}

function renderFilters() {
AppUI.clear(elFilters)

let d = AppState.getData()
let ui = AppState.getUI()
let f = ui.transactionsFilters || {}
let catIncome = (d && d.categories && d.categories.income) ? d.categories.income : []
let catExpense = (d && d.categories && d.categories.expense) ? d.categories.expense : []

let wrap = AppUtils.el("div")
wrap.className = "card"

let row = AppUtils.el("div")
row.style.display = "grid"
row.style.gridTemplateColumns = "1fr 1fr"
row.style.gap = "10px"

let typeLabel = AppUtils.el("div")
typeLabel.style.fontSize = "12px"
typeLabel.style.fontWeight = "700"
typeLabel.style.color = "#94a3b8"
typeLabel.textContent = "Type"

let typeSel = AppUtils.el("select")
addOpt(typeSel, "all", "All")
addOpt(typeSel, "income", "Income")
addOpt(typeSel, "expense", "Expenses")
typeSel.value = f.type || "all"
typeSel.addEventListener("change", function () {
AppState.setTransactionsFilter({ type: typeSel.value, categoryId: "all" })
})

let catLabel = AppUtils.el("div")
catLabel.style.fontSize = "12px"
catLabel.style.fontWeight = "700"
catLabel.style.color = "#94a3b8"
catLabel.textContent = "Category"

let catSel = AppUtils.el("select")
addOpt(catSel, "all", "All")
let cats = []
if (typeSel.value === "income") cats = catIncome
else if (typeSel.value === "expense") cats = catExpense
else cats = catIncome.concat(catExpense)

for (let i = 0; i < cats.length; i++) {
addOpt(catSel, cats[i].id, cats[i].name)
}
catSel.value = f.categoryId || "all"
catSel.addEventListener("change", function () {
AppState.setTransactionsFilter({ categoryId: catSel.value })
})

let block1 = AppUtils.el("div")
block1.appendChild(typeLabel)
block1.appendChild(typeSel)

let block2 = AppUtils.el("div")
block2.appendChild(catLabel)
block2.appendChild(catSel)

row.appendChild(block1)
row.appendChild(block2)

let searchLabel = AppUtils.el("div")
searchLabel.style.fontSize = "12px"
searchLabel.style.fontWeight = "700"
searchLabel.style.color = "#94a3b8"
searchLabel.textContent = "Search"

let search = AppUtils.el("input")
search.type = "text"
search.placeholder = "Search by note..."
search.value = f.query || ""
search.addEventListener("input", AppUtils.debounce(function () {
AppState.setTransactionsFilter({ query: search.value })
}, 150))

let sortLabel = AppUtils.el("div")
sortLabel.style.fontSize = "12px"
sortLabel.style.fontWeight = "700"
sortLabel.style.color = "#94a3b8"
sortLabel.textContent = "Sort"

let sortSel = AppUtils.el("select")
addOpt(sortSel, "date_desc", "Date (newest)")
addOpt(sortSel, "date_asc", "Date (oldest)")
addOpt(sortSel, "amount_desc", "Amount (high)")
addOpt(sortSel, "amount_asc", "Amount (low)")
sortSel.value = f.sort || "date_desc"
sortSel.addEventListener("change", function () {
AppState.setTransactionsFilter({ sort: sortSel.value })
})

let actions = AppUtils.el("div")
actions.style.display = "flex"
actions.style.gap = "10px"
actions.style.marginTop = "6px"

let addBtn = AppUtils.el("button")
addBtn.textContent = "➕ Add"
addBtn.addEventListener("click", function () {
openAdd()
})

let clearBtn = AppUtils.el("button")
clearBtn.textContent = "Clear"
clearBtn.style.background = "rgba(148,163,184,0.18)"
clearBtn.style.color = "#e2e8f0"
clearBtn.addEventListener("click", function () {
AppState.setTransactionsFilter({ type: "all", categoryId: "all", query: "", sort: "date_desc" })
})

actions.appendChild(addBtn)
actions.appendChild(clearBtn)

wrap.appendChild(row)
wrap.appendChild(searchLabel)
wrap.appendChild(search)
wrap.appendChild(sortLabel)
wrap.appendChild(sortSel)
wrap.appendChild(actions)

elFilters.appendChild(wrap)
}

function addOpt(sel, value, label) {
let o = AppUtils.el("option")
o.value = value
o.textContent = label
sel.appendChild(o)
}

function renderList() {
AppUI.clear(elList)

let d = AppState.getData()
let ui = AppState.getUI()
let f = ui.transactionsFilters || {}
let currency = getCurrency()
let catMap = getCategoriesMap()

let txns = (d && d.transactions) ? d.transactions : []
let filtered = []

let q = (f.query || "").trim().toLowerCase()
for (let i = 0; i < txns.length; i++) {
let t = txns[i]
if (f.type && f.type !== "all" && t.type !== f.type) continue
if (f.categoryId && f.categoryId !== "all" && t.categoryId !== f.categoryId) continue
if (q) {
let note = (t.note || "").toLowerCase()
let cat = (t.categoryId && catMap[t.categoryId]) ? catMap[t.categoryId].toLowerCase() : ""
if (note.indexOf(q) < 0 && cat.indexOf(q) < 0) continue
}
filtered.push(t)
}

let sorted = getSorted(filtered, f.sort || "date_desc")

let card = AppUI.card("History")
if (sorted.length === 0) {
card.appendChild(AppUI.emptyState("No matching transactions."))
} else {
for (let i = 0; i < sorted.length; i++) {
let t = sorted[i]
let left = buildTxnLeftText(t, catMap)
let right = buildTxnRightText(t, currency)
let cls = t.type === "income" ? "item__sum--income" : "item__sum--expense"
let row = AppUI.rowLeftRight(left, right, cls)
row.addEventListener("click", (function (id) {
return function () { openEdit(id) }
})(t.id))
card.appendChild(row)
}
}
elList.appendChild(card)
}

function openAdd() {
let d = AppState.getData()
let currency = getCurrency()
let catsIncome = (d && d.categories && d.categories.income) ? d.categories.income : []
let catsExpense = (d && d.categories && d.categories.expense) ? d.categories.expense : []

let typeDefault = "expense"
let cats = typeDefault === "income" ? catsIncome : catsExpense
let firstCat = cats.length ? cats[0].id : "all"

AppUI.formModal({
title: "Add Transaction",
okText: "Save",
cancelText: "Cancel",
fields: [
{ id: "type", label: "Type", kind: "select", value: typeDefault, options: [
{ value: "income", label: "Income" },
{ value: "expense", label: "Expenses" }
]},
{ id: "amount", label: "Amount (" + currency + ")", kind: "number", placeholder: "0", value: "" },
{ id: "categoryId", label: "Category", kind: "select", value: firstCat, options: buildCategoryOptions(typeDefault, catsIncome, catsExpense) },
{ id: "note", label: "Note", kind: "text", placeholder: "Optional", value: "" },
{ id: "date", label: "Date", kind: "date", value: AppUtils.today() }
],
onSubmit: function (values) {
let type = values.type === "income" ? "income" : "expense"
let amount = parseAmount(values.amount)
if (!(amount > 0)) {
AppUI.toast("Enter a valid amount.")
return false
}
let categoryId = String(values.categoryId || "all")
let note = String(values.note || "").trim()
let date = String(values.date || AppUtils.today())
let txn = {
id: AppUtils.uuid(),
type: type,
amount: amount,
categoryId: categoryId,
note: note,
date: date
}
addTransaction(txn)
AppUI.toast("Saved.")
return true
}
})

setTimeout(function () {
let typeSel = document.querySelector(".modal select")
if (!typeSel) return
typeSel.addEventListener("change", function () {
let t = typeSel.value === "income" ? "income" : "expense"
let modal = document.querySelector(".modal")
if (!modal) return
let selects = modal.querySelectorAll("select")
if (!selects || selects.length < 2) return
let catSel = selects[1]
let opts = buildCategoryOptions(t, catsIncome, catsExpense)
catSel.innerHTML = ""
for (let i = 0; i < opts.length; i++) {
let o = AppUtils.el("option")
o.value = opts[i].value
o.textContent = opts[i].label
catSel.appendChild(o)
}
catSel.value = opts.length ? opts[0].value : "all"
})
}, 0)
}

function buildCategoryOptions(type, inc, exp) {
let list = type === "income" ? (inc || []) : (exp || [])
let opts = []
if (list.length === 0) {
opts.push({ value: "all", label: "Uncategorized" })
return opts
}
for (let i = 0; i < list.length; i++) {
opts.push({ value: list[i].id, label: list[i].name })
}
return opts
}

function addTransaction(txn) {
let d = AppState.getData()
d.transactions.push(txn)
AppState.save()
}

function openEdit(id) {
let d = AppState.getData()
let txns = d.transactions || []
let idx = -1
for (let i = 0; i < txns.length; i++) {
if (txns[i].id === id) { idx = i; break }
}
if (idx < 0) return
let t0 = txns[idx]

let currency = getCurrency()
let catsIncome = (d && d.categories && d.categories.income) ? d.categories.income : []
let catsExpense = (d && d.categories && d.categories.expense) ? d.categories.expense : []

let type0 = t0.type === "income" ? "income" : "expense"
let opts0 = buildCategoryOptions(type0, catsIncome, catsExpense)
let cat0 = t0.categoryId || (opts0.length ? opts0[0].value : "all")

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
AppUI.confirm("Delete Transaction", "Are you sure you want to delete this transaction?", function () {
removeById(id)
AppUI.closeModal()
AppUI.toast("Deleted.")
})
})

let duplicateBtn = AppUtils.el("button")
duplicateBtn.textContent = "Duplicate"
duplicateBtn.style.background = "rgba(148,163,184,0.18)"
duplicateBtn.style.color = "#e2e8f0"
duplicateBtn.addEventListener("click", function () {
let copy = Object.assign({}, t0)
copy.id = AppUtils.uuid()
addTransaction(copy)
AppUI.toast("Duplicated.")
})

btnRow.appendChild(delBtn)
btnRow.appendChild(duplicateBtn)
body.appendChild(btnRow)

let formWrap = AppUtils.el("div")
body.appendChild(formWrap)

AppUI.openModal({
title: "Edit Transaction",
bodyEl: body,
cancelText: "Close",
okText: "Save",
onOk: function () {
let modal = document.querySelector(".modal")
if (!modal) return true
let inputs = modal.querySelectorAll("input, select")
if (!inputs || inputs.length < 5) return true
let type = inputs[0].value === "income" ? "income" : "expense"
let amount = parseAmount(inputs[1].value)
let categoryId = String(inputs[2].value || "all")
let note = String(inputs[3].value || "").trim()
let date = String(inputs[4].value || AppUtils.today())

if (!(amount > 0)) {
AppUI.toast("Enter a valid amount.")
return false
}

let txns2 = AppState.getData().transactions || []
let idx2 = -1
for (let i = 0; i < txns2.length; i++) {
if (txns2[i].id === id) { idx2 = i; break }
}
if (idx2 < 0) return true

txns2[idx2].type = type
txns2[idx2].amount = amount
txns2[idx2].categoryId = categoryId
txns2[idx2].note = note
txns2[idx2].date = date

AppState.save()
AppUI.toast("Saved.")
return true
}
})

setTimeout(function () {
let modal = document.querySelector(".modal")
if (!modal) return
let fields = []

let typeSel = AppUtils.el("select")
addOpt(typeSel, "income", "Income")
addOpt(typeSel, "expense", "Expenses")
typeSel.value = type0

let amount = AppUtils.el("input")
amount.type = "text"
amount.inputMode = "decimal"
amount.value = String(t0.amount || "")
amount.placeholder = "0"

let catSel = AppUtils.el("select")
for (let i = 0; i < opts0.length; i++) addOpt(catSel, opts0[i].value, opts0[i].label)
catSel.value = cat0

let note = AppUtils.el("input")
note.type = "text"
note.value = String(t0.note || "")
note.placeholder = "Optional"

let date = AppUtils.el("input")
date.type = "date"
date.value = String(t0.date || AppUtils.today())

fields.push({ label: "Type", el: typeSel })
fields.push({ label: "Amount (" + currency + ")", el: amount })
fields.push({ label: "Category", el: catSel })
fields.push({ label: "Note", el: note })
fields.push({ label: "Date", el: date })

formWrap.innerHTML = ""
for (let i = 0; i < fields.length; i++) {
let wrap = AppUtils.el("div")
wrap.style.marginBottom = "10px"
let lab = AppUtils.el("label")
lab.style.display = "block"
lab.style.fontSize = "12px"
lab.style.fontWeight = "700"
lab.style.color = "#94a3b8"
lab.style.marginBottom = "6px"
lab.textContent = fields[i].label
wrap.appendChild(lab)
wrap.appendChild(fields[i].el)
formWrap.appendChild(wrap)
}

typeSel.addEventListener("change", function () {
let t = typeSel.value === "income" ? "income" : "expense"
let opts = buildCategoryOptions(t, catsIncome, catsExpense)
catSel.innerHTML = ""
for (let i = 0; i < opts.length; i++) addOpt(catSel, opts[i].value, opts[i].label)
catSel.value = opts.length ? opts[0].value : "all"
})
}, 0)
}

function removeById(id) {
let d = AppState.getData()
let txns = d.transactions || []
let next = []
for (let i = 0; i < txns.length; i++) {
if (txns[i].id !== id) next.push(txns[i])
}
d.transactions = next
AppState.save()
}

return {
init,
openAdd
}

})()
