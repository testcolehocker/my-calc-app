const FeatureBudget = (function () {

let elOverview = null
let elCategories = null

function init() {
elOverview = AppUtils.qs("#budget-overview")
elCategories = AppUtils.qs("#budget-categories")

AppState.on("data", function () {
render()
})

AppState.on("screen", function (s) {
if (s === "budget") render()
})

render()
}

function render() {
if (!elOverview || !elCategories) return
ensureBudgets()

renderOverview()
renderCategories()
}

function ensureBudgets() {
let d = AppState.getData()
if (!Array.isArray(d.budgets)) d.budgets = []
}

function getCurrency() {
let d = AppState.getData()
return (d && d.settings && d.settings.currency) ? d.settings.currency : AppConfig.defaultCurrency
}

function nowMonthKey() {
let d = new Date()
let y = d.getFullYear()
let m = String(d.getMonth() + 1).padStart(2, "0")
return y + "-" + m
}

function parseAmount(v) {
if (v == null) return 0
let s = String(v).replace(",", ".").replace(/[^0-9.\-]/g, "")
let n = Number(s)
if (!isFinite(n)) return 0
return n
}

function monthKeyFromDateStr(ds) {
if (!ds) return ""
ds = String(ds)
if (ds.length >= 7) return ds.slice(0, 7)
return ""
}

function getMonthBudget(monthKey) {
let d = AppState.getData()
let list = d.budgets || []
for (let i = 0; i < list.length; i++) {
if (list[i] && list[i].month === monthKey) return list[i]
}
let b = { month: monthKey, total: 0, categories: {} }
list.push(b)
d.budgets = list
AppState.save()
return b
}

function getExpenseTransactionsForMonth(monthKey) {
let d = AppState.getData()
let txns = d.transactions || []
let out = []
for (let i = 0; i < txns.length; i++) {
let t = txns[i]
if (!t || t.type !== "expense") continue
if (monthKeyFromDateStr(t.date) !== monthKey) continue
out.push(t)
}
return out
}

function sumAmounts(list) {
let total = 0
for (let i = 0; i < list.length; i++) total += Number(list[i].amount) || 0
return total
}

function sumByCategory(list) {
let map = {}
for (let i = 0; i < list.length; i++) {
let t = list[i]
let id = t.categoryId || "all"
if (!map[id]) map[id] = 0
map[id] += Number(t.amount) || 0
}
return map
}

function expenseCategories() {
let d = AppState.getData()
let exp = (d && d.categories && Array.isArray(d.categories.expense)) ? d.categories.expense : []
let list = exp.slice()
let hasAll = false
for (let i = 0; i < list.length; i++) if (list[i].id === "all") hasAll = true
if (!hasAll) list.unshift({ id: "all", name: "Uncategorized" })
return list
}

function getCategoryNameMap() {
let cats = expenseCategories()
let map = {}
for (let i = 0; i < cats.length; i++) map[cats[i].id] = cats[i].name
return map
}

function renderOverview() {
AppUI.clear(elOverview)

let currency = getCurrency()
let monthKey = nowMonthKey()
let b = getMonthBudget(monthKey)

let expenses = getExpenseTransactionsForMonth(monthKey)
let spent = sumAmounts(expenses)
let total = Number(b.total) || 0
let remaining = total - spent

let card = AppUI.card("This Month Budget")

let balanceRow = AppUtils.el("div")
balanceRow.style.display = "grid"
balanceRow.style.gridTemplateColumns = "1fr 1fr"
balanceRow.style.gap = "10px"

let a = metricBox("Budget", AppUtils.formatMoney(total, currency))
let c = metricBox("Spent", AppUtils.formatMoney(spent, currency))
balanceRow.appendChild(a)
balanceRow.appendChild(c)

let rem = AppUtils.el("div")
rem.style.marginTop = "10px"
rem.style.padding = "12px"
rem.style.borderRadius = "12px"
rem.style.border = "1px solid rgba(255,255,255,0.08)"
rem.style.background = "rgba(255,255,255,0.03)"
let remLabel = AppUtils.el("div")
remLabel.style.fontSize = "12px"
remLabel.style.fontWeight = "700"
remLabel.style.color = "#94a3b8"
remLabel.textContent = "Remaining"
let remValue = AppUtils.el("div")
remValue.style.marginTop = "4px"
remValue.style.fontSize = "20px"
remValue.style.fontWeight = "900"
remValue.textContent = AppUtils.formatMoney(remaining, currency)
rem.appendChild(remLabel)
rem.appendChild(remValue)

let actions = AppUtils.el("div")
actions.style.display = "flex"
actions.style.gap = "10px"
actions.style.marginTop = "12px"

let setTotalBtn = AppUtils.el("button")
setTotalBtn.textContent = "Set Monthly Budget"
setTotalBtn.addEventListener("click", function () {
openSetTotal(monthKey)
})

let clearBtn = AppUtils.el("button")
clearBtn.textContent = "Clear Month"
clearBtn.style.background = "rgba(148,163,184,0.18)"
clearBtn.style.color = "#e2e8f0"
clearBtn.addEventListener("click", function () {
AppUI.confirm("Clear Budget", "Clear this month budget and all category limits?", function () {
clearMonthBudget(monthKey)
AppUI.toast("Cleared.")
})
})

actions.appendChild(setTotalBtn)
actions.appendChild(clearBtn)

card.appendChild(balanceRow)
card.appendChild(rem)
card.appendChild(actions)

elOverview.appendChild(card)
}

function metricBox(label, value) {
let box = AppUtils.el("div")
box.style.padding = "12px"
box.style.borderRadius = "12px"
box.style.border = "1px solid rgba(255,255,255,0.08)"
box.style.background = "rgba(255,255,255,0.03)"

let l = AppUtils.el("div")
l.style.fontSize = "12px"
l.style.fontWeight = "700"
l.style.color = "#94a3b8"
l.textContent = label

let v = AppUtils.el("div")
v.style.marginTop = "4px"
v.style.fontSize = "18px"
v.style.fontWeight = "900"
v.textContent = value

box.appendChild(l)
box.appendChild(v)
return box
}

function clearMonthBudget(monthKey) {
let d = AppState.getData()
let list = d.budgets || []
let next = []
for (let i = 0; i < list.length; i++) {
if (!list[i] || list[i].month !== monthKey) next.push(list[i])
}
d.budgets = next
AppState.save()
}

function openSetTotal(monthKey) {
let currency = getCurrency()
let b = getMonthBudget(monthKey)
let current = Number(b.total) || 0

AppUI.formModal({
title: "Monthly Budget",
okText: "Save",
cancelText: "Cancel",
fields: [
{ id: "total", label: "Amount (" + currency + ")", kind: "number", placeholder: "0", value: current ? String(current) : "" }
],
onSubmit: function (values) {
let total = parseAmount(values.total)
if (total < 0) total = 0
let b2 = getMonthBudget(monthKey)
b2.total = total
AppState.save()
AppUI.toast("Saved.")
return true
}
})
}

function renderCategories() {
AppUI.clear(elCategories)

let currency = getCurrency()
let monthKey = nowMonthKey()
let b = getMonthBudget(monthKey)
let expenses = getExpenseTransactionsForMonth(monthKey)
let spentByCat = sumByCategory(expenses)
let cats = expenseCategories()
let nameMap = getCategoryNameMap()

let card = AppUI.card("Category Budgets")

let info = AppUtils.el("div")
info.style.color = "#94a3b8"
info.style.fontSize = "13px"
info.style.lineHeight = "1.35"
info.style.marginBottom = "10px"
info.textContent = "Tap a category to set its limit."
card.appendChild(info)

if (!b.categories) b.categories = {}

for (let i = 0; i < cats.length; i++) {
let cat = cats[i]
let id = cat.id
let limit = Number(b.categories[id]) || 0
let spent = Number(spentByCat[id]) || 0
let remaining = limit - spent

let pct = 0
if (limit > 0) pct = Math.max(0, Math.min(100, Math.round((spent / limit) * 100)))

let row = AppUtils.el("div")
row.className = "budget-row"

let left = AppUtils.el("div")
left.className = "budget-left"

let title = AppUtils.el("div")
title.className = "budget-title"
title.textContent = (nameMap[id] || "Category")

let sub = AppUtils.el("div")
sub.className = "budget-sub"
if (limit > 0) {
sub.textContent = "Spent " + AppUtils.formatMoney(spent, currency) + " of " + AppUtils.formatMoney(limit, currency)
} else {
sub.textContent = "No limit • Spent " + AppUtils.formatMoney(spent, currency)
}

let progress = AppUtils.el("div")
progress.className = "budget-progress"
let bar = AppUtils.el("div")
bar.style.width = (limit > 0 ? pct : 0) + "%"
bar.style.background = (limit > 0 && spent > limit) ? "rgba(251,113,133,0.85)" : "rgba(56,189,248,0.85)"
progress.appendChild(bar)

left.appendChild(title)
left.appendChild(sub)
left.appendChild(progress)

let right = AppUtils.el("div")
right.className = "budget-right"
right.textContent = AppUtils.formatMoney(remaining, currency)
right.style.color = (limit > 0 && remaining < 0) ? "#fb7185" : "#34d399"

row.appendChild(left)
row.appendChild(right)

row.addEventListener("click", (function (catId, catName) {
return function () {
openSetCategoryLimit(monthKey, catId, catName)
}
})(id, nameMap[id] || "Category"))

card.appendChild(row)
}

let actions = AppUtils.el("div")
actions.style.display = "flex"
actions.style.gap = "10px"
actions.style.marginTop = "12px"

let bulkBtn = AppUtils.el("button")
bulkBtn.textContent = "Set Multiple"
bulkBtn.style.background = "rgba(148,163,184,0.18)"
bulkBtn.style.color = "#e2e8f0"
bulkBtn.addEventListener("click", function () {
openBulkSet(monthKey)
})

let resetBtn = AppUtils.el("button")
resetBtn.textContent = "Reset Limits"
resetBtn.style.background = "rgba(251,113,133,0.16)"
resetBtn.style.color = "#fb7185"
resetBtn.addEventListener("click", function () {
AppUI.confirm("Reset Limits", "Reset all category limits for this month?", function () {
resetCategoryLimits(monthKey)
AppUI.toast("Reset.")
})
})

actions.appendChild(bulkBtn)
actions.appendChild(resetBtn)

card.appendChild(actions)
elCategories.appendChild(card)
}

function resetCategoryLimits(monthKey) {
let b = getMonthBudget(monthKey)
b.categories = {}
AppState.save()
}

function openSetCategoryLimit(monthKey, categoryId, categoryName) {
let currency = getCurrency()
let b = getMonthBudget(monthKey)
if (!b.categories) b.categories = {}
let current = Number(b.categories[categoryId]) || 0

AppUI.formModal({
title: "Set Limit",
okText: "Save",
cancelText: "Cancel",
fields: [
{ id: "amount", label: (categoryName || "Category") + " (" + currency + ")", kind: "number", placeholder: "0", value: current ? String(current) : "" }
],
onSubmit: function (values) {
let v = parseAmount(values.amount)
if (v < 0) v = 0
let b2 = getMonthBudget(monthKey)
if (!b2.categories) b2.categories = {}
b2.categories[categoryId] = v
AppState.save()
AppUI.toast("Saved.")
return true
}
})
}

function openBulkSet(monthKey) {
let currency = getCurrency()
let b = getMonthBudget(monthKey)
if (!b.categories) b.categories = {}
let cats = expenseCategories()
let nameMap = getCategoryNameMap()

let fields = []
for (let i = 0; i < cats.length; i++) {
let id = cats[i].id
let name = nameMap[id] || "Category"
let current = Number(b.categories[id]) || 0
fields.push({
id: "c_" + id,
label: name + " (" + currency + ")",
kind: "number",
placeholder: "0",
value: current ? String(current) : ""
})
}

AppUI.formModal({
title: "Set Multiple Limits",
okText: "Save",
cancelText: "Cancel",
fields: fields,
onSubmit: function (values) {
let b2 = getMonthBudget(monthKey)
if (!b2.categories) b2.categories = {}

for (let k in values) {
if (!values.hasOwnProperty(k)) continue
if (k.indexOf("c_") !== 0) continue
let id = k.slice(2)
let v = parseAmount(values[k])
if (v <= 0) {
if (b2.categories[id] != null) delete b2.categories[id]
} else {
b2.categories[id] = v
}
}

AppState.save()
AppUI.toast("Saved.")
return true
}
})
}

return {
init
}

})()
