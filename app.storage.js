const AppStorage = (function () {

function load() {
let raw = localStorage.getItem(AppConfig.storageKey)
if (!raw) return createDefault()
try {
let data = JSON.parse(raw)
return normalize(data)
} catch {
return createDefault()
}
}

function save(data) {
localStorage.setItem(AppConfig.storageKey, JSON.stringify(data))
}

function createDefault() {
return {
transactions: [],
categories: {
income: [...AppConfig.defaultCategories.income],
expense: [...AppConfig.defaultCategories.expense]
},
budgets: [],
goals: [],
bills: [],
settings: {
currency: AppConfig.defaultCurrency,
theme: "dark"
}
}
}

function normalize(data) {

if (!data.transactions) data.transactions = []

if (!data.categories) {
data.categories = {
income: [...AppConfig.defaultCategories.income],
expense: [...AppConfig.defaultCategories.expense]
}
}

if (!data.categories.income) data.categories.income = []
if (!data.categories.expense) data.categories.expense = []

if (!data.budgets) data.budgets = []
if (!data.goals) data.goals = []
if (!data.bills) data.bills = []

if (!data.settings) {
data.settings = {
currency: AppConfig.defaultCurrency,
theme: "dark"
}
}

if (!data.settings.currency) data.settings.currency = AppConfig.defaultCurrency
if (!data.settings.theme) data.settings.theme = "dark"

return data
}

function clear() {
localStorage.removeItem(AppConfig.storageKey)
}

return {
load,
save,
clear
}

})()
