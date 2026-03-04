const FeatureSettings = (function () {

let elCurrency = null
let elTheme = null
let btnPrivacy = null

let bound = false

function init() {
elCurrency = AppUtils.qs("#settings-currency")
elTheme = AppUtils.qs("#settings-theme")
btnPrivacy = AppUtils.qs("#settings-privacy")

bind()
render()
}

function bind() {
if (bound) return
bound = true

if (elCurrency) {
elCurrency.addEventListener("change", function () {
let v = String(elCurrency.value || AppConfig.defaultCurrency)
AppState.updateSettings({ currency: v })
AppUI.toast("Saved.")
})
}

if (elTheme) {
elTheme.addEventListener("change", function () {
let v = String(elTheme.value || "dark")
AppState.updateSettings({ theme: v })
AppUI.toast("Saved.")
})
}

if (btnPrivacy) {
btnPrivacy.addEventListener("click", function () {
openPrivacy()
})
}

AppState.on("settings", function () {
render()
})

AppState.on("data", function () {
render()
})

AppState.on("screen", function (s) {
if (s === "settings") render()
})
}

function render() {
renderCurrencies()
renderTheme()
}

function renderCurrencies() {
if (!elCurrency) return

let d = AppState.getData()
let current = (d && d.settings && d.settings.currency) ? d.settings.currency : AppConfig.defaultCurrency

elCurrency.innerHTML = ""
let list = Array.isArray(AppConfig.currencies) ? AppConfig.currencies : [AppConfig.defaultCurrency]
for (let i = 0; i < list.length; i++) {
let c = String(list[i] || "").trim()
if (!c) continue
let o = AppUtils.el("option")
o.value = c
o.textContent = c
elCurrency.appendChild(o)
}

elCurrency.value = current
}

function renderTheme() {
if (!elTheme) return

let d = AppState.getData()
let current = (d && d.settings && d.settings.theme) ? d.settings.theme : "dark"
elTheme.value = current === "light" ? "light" : "dark"
}

function openPrivacy() {
let url = String(AppConfig.privacyPolicyUrl || "").trim()
if (!url) {
AppUI.toast("Privacy Policy URL is not set yet.")
return
}
try {
window.open(url, "_blank", "noopener,noreferrer")
} catch {
location.href = url
}
}

return {
init
}

})()
