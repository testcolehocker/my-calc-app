const AppUtils = (function () {

function uuid() {
return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

function formatMoney(value, currency) {
let number = Number(value) || 0
return new Intl.NumberFormat("en-US", {
style: "currency",
currency: currency
}).format(number)
}

function formatDate(timestamp) {
let d = new Date(timestamp)
return d.toLocaleDateString("en-US", {
year: "numeric",
month: "short",
day: "numeric"
})
}

function today() {
return new Date().toISOString().split("T")[0]
}

function sum(list, field) {
let total = 0
for (let i = 0; i < list.length; i++) {
total += Number(list[i][field] || 0)
}
return total
}

function groupBy(list, field) {
let map = {}
for (let i = 0; i < list.length; i++) {
let key = list[i][field]
if (!map[key]) map[key] = []
map[key].push(list[i])
}
return map
}

function debounce(fn, delay) {
let t
return function () {
clearTimeout(t)
let args = arguments
t = setTimeout(() => fn.apply(this, args), delay)
}
}

function qs(selector) {
return document.querySelector(selector)
}

function qsa(selector) {
return document.querySelectorAll(selector)
}

function el(tag) {
return document.createElement(tag)
}

return {
uuid,
formatMoney,
formatDate,
today,
sum,
groupBy,
debounce,
qs,
qsa,
el
}

})()
