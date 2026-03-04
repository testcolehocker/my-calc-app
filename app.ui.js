const AppUI = (function () {

let modalRoot = null
let activeModal = null
let toastEl = null
let toastTimer = null

function init() {
modalRoot = AppUtils.qs("#modal-root")
ensureToast()
}

function ensureToast() {
if (toastEl) return
toastEl = AppUtils.el("div")
toastEl.style.position = "fixed"
toastEl.style.left = "12px"
toastEl.style.right = "12px"
toastEl.style.bottom = "12px"
toastEl.style.zIndex = "9999"
toastEl.style.display = "none"
modalRoot.appendChild(toastEl)
}

function toast(message) {
if (!toastEl) init()
toastEl.innerHTML = ""
let box = AppUtils.el("div")
box.style.background = "rgba(2,6,23,0.95)"
box.style.border = "1px solid rgba(148,163,184,0.25)"
box.style.borderRadius = "12px"
box.style.padding = "12px 14px"
box.style.color = "#e2e8f0"
box.style.fontWeight = "600"
box.style.textAlign = "center"
box.textContent = String(message || "")
toastEl.appendChild(box)
toastEl.style.display = "block"
clearTimeout(toastTimer)
toastTimer = setTimeout(function () {
toastEl.style.display = "none"
}, 2200)
}

function clear(node) {
if (!node) return
while (node.firstChild) node.removeChild(node.firstChild)
}

function setText(node, text) {
if (!node) return
node.textContent = text == null ? "" : String(text)
}

function setHTML(node, html) {
if (!node) return
node.innerHTML = html == null ? "" : String(html)
}

function card(titleText) {
let wrap = AppUtils.el("div")
wrap.className = "card"
if (titleText) {
let t = AppUtils.el("div")
t.style.fontSize = "14px"
t.style.fontWeight = "700"
t.style.marginBottom = "10px"
t.style.color = "#cbd5e1"
t.textContent = titleText
wrap.appendChild(t)
}
return wrap
}

function emptyState(text) {
let el = AppUtils.el("div")
el.className = "list-empty"
el.textContent = text || "No items yet."
return el
}

function rowLeftRight(leftText, rightText, rightClass) {
let r = AppUtils.el("div")
r.className = "item"
let left = AppUtils.el("div")
left.className = "item__left"
let note = AppUtils.el("div")
note.className = "item__note"
note.textContent = leftText || ""
left.appendChild(note)
r.appendChild(left)

let right = AppUtils.el("div")
right.className = "item__sum"
if (rightClass) right.className = "item__sum " + rightClass
right.textContent = rightText || ""
r.appendChild(right)
return r
}

function openModal(opts) {
if (!modalRoot) init()
closeModal()

let overlay = AppUtils.el("div")
overlay.className = "modal-overlay"

let modal = AppUtils.el("div")
modal.className = "modal"

let title = AppUtils.el("h3")
title.textContent = (opts && opts.title) ? String(opts.title) : ""
modal.appendChild(title)

let body = AppUtils.el("div")
if (opts && opts.bodyEl) body.appendChild(opts.bodyEl)
modal.appendChild(body)

let actions = AppUtils.el("div")
actions.className = "modal-actions"

let cancelBtn = AppUtils.el("button")
cancelBtn.textContent = (opts && opts.cancelText) ? String(opts.cancelText) : "Cancel"
cancelBtn.style.background = "rgba(148,163,184,0.18)"
cancelBtn.style.color = "#e2e8f0"
cancelBtn.addEventListener("click", function () {
if (opts && typeof opts.onCancel === "function") {
try { opts.onCancel() } catch {}
}
closeModal()
})

let okBtn = AppUtils.el("button")
okBtn.textContent = (opts && opts.okText) ? String(opts.okText) : "OK"
okBtn.addEventListener("click", function () {
let result = true
if (opts && typeof opts.onOk === "function") {
try { result = opts.onOk() } catch { result = false }
}
if (result !== false) closeModal()
})

actions.appendChild(cancelBtn)
actions.appendChild(okBtn)
modal.appendChild(actions)

overlay.appendChild(modal)

overlay.addEventListener("click", function (e) {
if (e.target === overlay) {
if (opts && typeof opts.onCancel === "function") {
try { opts.onCancel() } catch {}
}
closeModal()
}
})

modalRoot.appendChild(overlay)
activeModal = overlay
}

function closeModal() {
if (!activeModal) return
try { activeModal.remove() } catch {}
activeModal = null
}

function confirm(titleText, messageText, onYes) {
let body = AppUtils.el("div")
let p = AppUtils.el("div")
p.style.color = "#cbd5e1"
p.style.fontSize = "14px"
p.style.lineHeight = "1.35"
p.textContent = messageText || ""
body.appendChild(p)

openModal({
title: titleText || "Confirm",
bodyEl: body,
cancelText: "No",
okText: "Yes",
onOk: function () {
if (typeof onYes === "function") onYes()
return true
}
})
}

function buildFieldLabel(text) {
let l = AppUtils.el("label")
l.style.display = "block"
l.style.fontSize = "12px"
l.style.fontWeight = "700"
l.style.color = "#94a3b8"
l.style.marginBottom = "6px"
l.textContent = text || ""
return l
}

function buildInput(type, placeholder, value) {
let i = AppUtils.el("input")
i.type = type || "text"
i.placeholder = placeholder || ""
i.value = value == null ? "" : String(value)
return i
}

function buildSelect(options, value) {
let s = AppUtils.el("select")
for (let i = 0; i < options.length; i++) {
let o = AppUtils.el("option")
o.value = options[i].value
o.textContent = options[i].label
s.appendChild(o)
}
s.value = value == null ? "" : String(value)
return s
}

function formModal(opts) {
let body = AppUtils.el("div")

let fields = (opts && opts.fields) ? opts.fields : []
let refs = {}

for (let i = 0; i < fields.length; i++) {
let f = fields[i]
let wrap = AppUtils.el("div")
wrap.style.marginBottom = "10px"

let label = buildFieldLabel(f.label || "")
wrap.appendChild(label)

let input = null
if (f.kind === "select") {
input = buildSelect(f.options || [], f.value)
} else if (f.kind === "date") {
input = buildInput("date", "", f.value || "")
} else if (f.kind === "number") {
input = buildInput("text", f.placeholder || "", f.value)
input.inputMode = "decimal"
} else {
input = buildInput("text", f.placeholder || "", f.value)
}

if (f.id) refs[f.id] = input
wrap.appendChild(input)
body.appendChild(wrap)
}

openModal({
title: (opts && opts.title) ? opts.title : "Edit",
bodyEl: body,
cancelText: (opts && opts.cancelText) ? opts.cancelText : "Cancel",
okText: (opts && opts.okText) ? opts.okText : "Save",
onOk: function () {
if (opts && typeof opts.onSubmit === "function") {
let values = {}
for (let k in refs) values[k] = refs[k].value
return opts.onSubmit(values)
}
return true
}
})

setTimeout(function () {
let firstKey = fields.length ? fields[0].id : null
if (firstKey && refs[firstKey] && refs[firstKey].focus) refs[firstKey].focus()
}, 50)
}

return {
init,
toast,
clear,
setText,
setHTML,
card,
emptyState,
rowLeftRight,
openModal,
closeModal,
confirm,
formModal
}

})()
