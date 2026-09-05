// ---------- CONSTANTS ---------- //

import { parsePathData, serializePathData, splitDestination, buildDestination, segmentContext, isTailLegal, applyToken } from "../../lib/location.js"
import { deriveCandidates, hasFacet, hasValue, matchLinkText } from "../../lib/candidates.js"
import { resolve } from "../../lib/resolve.js"
import { runAsserts } from "../../lib/asserts.js"

const navBridge = JSON.parse(document.getElementById("nav-bridge").textContent)

// Make sure these classes all exist in the HTML
const navElements = {
    listHolder: document.querySelector(".nav-list"),
    input: document.getElementById("nav-input"),
    tokenHolder: document.querySelector(".nav-tokens"),
    beforeCursor: document.querySelector(".nav-before-cursor"),
    textCursor: document.querySelector(".nav-text-cursor"),
    afterCursor: document.querySelector(".nav-after-cursor"),
    pathReal: document.querySelector(".nav-path-text-real"),
    pathPreview: document.querySelector(".nav-path-text-preview"),
    error: document.querySelector(".nav-error")
}

const navData = {
    inputText: "",
    committedTokens: [],
    tokenLoaded: false,
    illegalInput: false,
    listEligible: [],
    selectedIndex: 0,
    errorMessage: null,
    errorTimer: null,
    actualLocation: "",
}

// ---------- INPUT FUNCTIONS ---------- //

function inputHandler(e) {
    if (e?.isComposing) {
        return
    }
    removeError()
    const inputText = getInputText()
    if (isTailLegal(inputText)) {
        navData.illegalInput = false
        navData.inputText = inputText
        navData.selectedIndex = 0
        navElements.textCursor.getAnimations().forEach(a => a.currentTime = 0)
    }
    else {
        navData.illegalInput = true
        revertInput()
    }
    updateEligible()
    render()
}

function getInputText() {
    return navElements.input.value
}

function revertInput() {
    navElements.input.value = navData.inputText
}

function updateEligible() {
    const candidates = deriveCandidates(navBridge, segmentContext(getLevel()))
    navData.listEligible = candidates.filter((candidate) => matchLinkText(candidate.name, navData.inputText))
}

// ---------- KEYDOWN FUNCTIONS ---------- //

function keydownHandler(e) {
    if (e.isComposing) {
        return
    }
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
        return
    }
    if (navData.errorMessage != null) {
        removeError();
        render();
    }
    if (e.key !== "Backspace") {
        navData.tokenLoaded = false
    }
    switch (e.key) {
        case " ":
            e.preventDefault()
            spaceKeydownHandler()
            render()
            break
        case "Enter":
            e.preventDefault()
            enterKeydownHandler()
            render()
            break
        case "Tab":
            e.preventDefault()
            tabKeydownHandler()
            render()
            break
        case "ArrowUp":
            e.preventDefault()
            upKeydownHandler()
            render()
            break
        case "ArrowDown":
            e.preventDefault()
            downKeydownHandler()
            render()
            break
        case "ArrowLeft":
            e.preventDefault()
            render()
            break
        case "ArrowRight":
            e.preventDefault()
            render()
            break
        case "Escape":
            e.preventDefault()
            escapeKeydownHandler()
            break
        case "Backspace":
            if (navData.inputText !== "") {
                return
            }
            else {
                e.preventDefault()
                backspaceKeydownHandler()
            }
            break
    }
}

function spaceKeydownHandler() {
    if (navData.inputText === "") {
        return
    }
    const context = segmentContext(getLevel())
    const command = resolve(navData.inputText, context)

    switch (context.mode) {
        case "path":
            if (command === null) {
                navData.committedTokens.push(navData.inputText + "/")
            }
            else {
                navData.committedTokens.push(command)
            }
            break

        case "key":
            if (hasFacet(navBridge, context.page, navData.inputText)) {
                navData.committedTokens.push(navData.inputText + "=")
            }
            else {
                setError("key not found")
                return
            }
            break

        case "value":
            if (hasValue(navBridge, context.page, context.key, navData.inputText)) {
                navData.committedTokens.push(navData.inputText)
            }
            else {
                setError("value not found")
                return
            }
            break
    }

    navElements.input.value = ""
    inputHandler()
}

function enterKeydownHandler() {
    if (navData.inputText === "" && navData.committedTokens.length === 0) {
        return
    }
    import.meta.env.DEV && console.assert(isTailLegal(navData.inputText), "nav assert 121")
    window.location.assign(getDestination())
}

function tabKeydownHandler() {
    if (navData.listEligible.length > 0) {
        navElements.input.value = navData.listEligible[navData.selectedIndex].name
        inputHandler()
    }
}

function upKeydownHandler() {
    if (navData.listEligible.length > 0) {
        navData.selectedIndex += 1
        if (navData.selectedIndex >= navData.listEligible.length) {
            navData.selectedIndex = 0
        }
    }
}

function downKeydownHandler() {
    if (navData.listEligible.length > 0) {
        navData.selectedIndex -= 1
        if (navData.selectedIndex < 0) {
            navData.selectedIndex = navData.listEligible.length - 1
        }
    }
}

function escapeKeydownHandler() {
    navData.committedTokens = []
    navElements.input.value = ""
    navElements.input.blur()
    inputHandler()
}

function backspaceKeydownHandler() {
    if (navData.committedTokens.length > 0) {
        if (!navData.tokenLoaded) {
            navData.tokenLoaded = true
        }
        else {
            navData.committedTokens.pop()
            navData.tokenLoaded = false
        }
    }
    inputHandler()
}

// ---------- ERROR FUNCTIONS ---------- //
// YES THIS WILL BE FOR COMMANDS LATER DON'T WORRY
function setError(message) {
    navData.errorMessage = navData.inputText + ": " + message
    clearTimeout(navData.errorTimer)
    navData.errorTimer = setTimeout(() => {
        removeError()
        render()
    }, 2500)
}

function removeError() {
    clearTimeout(navData.errorTimer)
    navData.errorMessage = null
    navData.errorTimer = null
}

// ---------- PATH FUNCTIONS ---------- //

function storeActualLocation() {
    navData.actualLocation = getActualLocation()
}

function getActualLocation() {
    return serializePathData(parsePathData(window.location.pathname, window.location.search))
}

function getLevel() {
    const committedString = navData.committedTokens.reduce(applyToken, navData.actualLocation)
    return committedString
}

function getDestination() {
    const level = getLevel()
    const token = resolve(navData.inputText, segmentContext(level))
    if (token === null) {
        return buildDestination(level, navData.inputText)
    }
    return applyToken(level, token)
}

// ---------- CLICK FUNCTIONS ---------- //

function clickHandler(e) {
    if (e.target.closest("input.nav-input") !== null) {
        caretReposition()
        return
    }
    if (e.target.closest("li.nav-list-item") !== null) {
        const element = e.target.closest("li.nav-list-item")
        if (element.querySelector("a") === null) {
            navElements.input.value = element.dataset.name
            navElements.input.focus()
            navData.tokenLoaded = false
            inputHandler()
        }

    }
}

// ---------- FOCUS FUNCTIONS ---------- //

function focusHandler() {
    caretReposition()
}

// ---------- BUILD FUNCTIONS ---------- //

function buildTokenElements() {
    const tokenElements = []
    for (const token of navData.committedTokens) {
        const tokenElement = document.createElement("span")
        tokenElement.className = "nav-token"
        tokenElement.textContent = token
        tokenElements.push(tokenElement)
    }
    return tokenElements
}

function buildCandidateElements(candidate, isSelected, page) {
    const hrefCandidate = page + candidate.name + "/"

    const li = document.createElement("li")
    li.className = (isSelected) ? "nav-list-item is-selected" : "nav-list-item"

    li.classList.add("nav-list-" + candidate.kind)
    li.dataset.name = candidate.name

    const isLink = candidate.kind === "page" || candidate.kind === "entry"

    const wrapper = isLink ? document.createElement("a") : document.createElement("span")
    wrapper.className = "nav-link"
    if (isLink) {
        wrapper.href = hrefCandidate
    }

    const textSpan = document.createElement("span")
    textSpan.className = "nav-link-text"
    const slugSpan = document.createElement("span")
    slugSpan.className = "nav-link-slug"
    slugSpan.textContent = candidate.name
    if (candidate.count !== null) {
        const countSpan = document.createElement("span")
        countSpan.className = "nav-link-count"
        countSpan.textContent = " " + candidate.count
        slugSpan.append(countSpan)
    }

    textSpan.append("> ", slugSpan, "\u00A0")
    wrapper.appendChild(textSpan)
    li.appendChild(wrapper)

    return li
}

// ---------- N/A FUNCTIONS ---------- //

function caretReposition() {
    navElements.input.setSelectionRange(navElements.input.value.length, navElements.input.value.length)
}

// ---------- RENDERING FUNCTIONS ---------- //

function render() {
    const selected = navData.listEligible[navData.selectedIndex]
    renderList(selected)
    renderTokens()
    renderGhost(selected)
    renderLocation()
}

function renderList(selected) {
    const segment = segmentContext(getLevel())
    const candidates = navData.listEligible.toReversed().map((candidate) => buildCandidateElements(candidate, candidate === selected, segment.page))
    navElements.listHolder.replaceChildren(...candidates)
}

function renderTokens() {
    navElements.tokenHolder.replaceChildren(...buildTokenElements())
    if (navElements.tokenHolder.lastElementChild === null) {
        return
    }
    if (navData.tokenLoaded) {
        navElements.tokenHolder.lastElementChild.classList.add("is-loaded")
    }
}

function renderGhost(selected) {
    navElements.textCursor.classList.toggle("is-illegal", navData.illegalInput)
    if (navData.errorMessage != null) {
        navElements.beforeCursor.textContent = ""
        navElements.textCursor.textContent = ""
        navElements.afterCursor.textContent = ""
        navElements.error.textContent = navData.errorMessage
    }
    else if (selected) {
        navElements.beforeCursor.textContent = navData.inputText
        navElements.error.textContent = ""
        if (navData.inputText.length >= selected.name.length) {
            navElements.textCursor.textContent = "\u00A0"
            navElements.afterCursor.textContent = ""
        }
        else {
            navElements.textCursor.textContent = selected.name.charAt(navData.inputText.length)
            navElements.afterCursor.textContent = selected.name.slice(navData.inputText.length + 1)
        }
    }
    else {
        navElements.beforeCursor.textContent = navData.inputText
        navElements.textCursor.textContent = "\u00A0"
        navElements.afterCursor.textContent = ""
        navElements.error.textContent = ""
    }
}

function renderLocation() {
    const built = getDestination()
    const { kept, pending } = splitDestination(navData.actualLocation, built)
    navElements.pathReal.textContent = "~" + kept
    navElements.pathPreview.textContent = pending
}

// ---------- MAIN ---------- //

function main() {
    if (import.meta.env.DEV) {
        runAsserts()
    }

    storeActualLocation()

    import.meta.env.DEV && console.assert(navElements.pathReal.textContent === ("~" + navData.actualLocation).split("?")[0], "nav assert 94")

    inputHandler()

    navElements.input.addEventListener("input", (e) => {
        inputHandler(e)
    })
    navElements.input.addEventListener("keydown", (e) => {
        keydownHandler(e)
    })
    navElements.input.addEventListener("focus", (e) => {
        focusHandler()
    })
    document.addEventListener("click", (e) => {
        clickHandler(e)
    })
}

main()
