// ---------- CONSTANTS ---------- //

import { parsePathData, serializePathData, splitDestination, buildDestination } from "../../lib/location.js"
import { navCommands } from "../../data/nav-commands.js"

// Make sure these classes all exist in the HTML
const navElements = {
    listLinks: [...document.querySelectorAll(".nav-link")].reverse(),
    input: document.getElementById("nav-input"),
    tokenText: document.querySelector(".nav-token-text"),
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
    listEligible: [...navElements.listLinks],
    selectedIndex: 0,
    errorMessage: null,
    errorTimer: null,
    actualLocation: "",
}

// ---------- INPUT FUNCTIONS ---------- //

function inputHandler() {
    removeError()
    navData.selectedIndex = 0
    navElements.textCursor.getAnimations().forEach(a => a.currentTime = 0)
    navData.inputText = getInputText()
    updateEligible()
    render()
}

function getInputText() {
    return navElements.input.value
}

function updateEligible() {
    navData.listEligible = navElements.listLinks.filter((link) => matchLinkText(link.dataset.page, navData.inputText))
}

function matchLinkText(page, input) {
    return page.toLowerCase().startsWith(input.toLowerCase())
}

// ---------- PATH FUNCTIONS ---------- //

function storeActualLocation() {
    navData.actualLocation = getActualLocation()
}

function getActualLocation() {
    return serializePathData(parsePathData(window.location.pathname, window.location.search))
}

function getTokenString() {
    return navData.committedTokens.join("") + navData.inputText
}

// ---------- KEYDOWN FUNCTIONS ---------- //

function keydownHandler(e) {
    if (navData.errorMessage != null) {
        removeError();
        render();
        return
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
            navElements.input.blur()
            render()
            break
    }
}

function spaceKeydownHandler() {
    if (navData.inputText === "") {
        return
    }
    const found = navCommands.find((command) => command.input === navData.inputText)
    if (found === undefined) {
        navData.committedTokens.push(navData.inputText + "/")
    }
    else {
        navData.committedTokens.push(found.real)
    }
    navElements.input.value = ""
    inputHandler()
}

function enterKeydownHandler() {
    if (navData.inputText === "" && navData.committedTokens.length === 0) {
        return
    }
    window.location.assign(buildDestination(navData.actualLocation, getTokenString()))
}

function tabKeydownHandler() {
    if (navData.listEligible.length > 0) {
        navElements.input.value = navData.listEligible[navData.selectedIndex].dataset.page
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
// YES THIS WILL BE FOR COMMANDS LATER DON'T WORRY
function setError() {
    navData.errorMessage = navData.inputText + ": not found"
    navData.errorTimer = setTimeout(() => {
        removeError()
        render()
    }, 2500)
    navElements.input.value = ""
    navData.selectedIndex = 0
    navData.inputText = getInputText()
    updateEligible()

}

function removeError() {
    clearTimeout(navData.errorTimer)
    navData.errorMessage = null
    navData.errorTimer = null
}

// ---------- CLICK FUNCTIONS ---------- //

function clickHandler() {
    caretReposition()
}

// ---------- FOCUS FUNCTIONS ---------- //

function focusHandler() {
    caretReposition()
}

// ---------- N/A FUNCTIONS ---------- //

function caretReposition() {
    navElements.input.setSelectionRange(navElements.input.value.length, navElements.input.value.length)
}

// ---------- RENDERING FUNCTIONS ---------- //

function render() {
    const selected = navData.listEligible[navData.selectedIndex]
    renderItems(selected)
    renderGhost(selected)
    renderLocation()
}

function renderItems(selected) {
    navElements.listLinks.forEach((link) => {
        link.closest("li").classList.toggle("is-hidden", !navData.listEligible.includes(link))
        link.closest("li").classList.toggle("is-selected", link === selected)
    })
}

function renderGhost(selected) {
    navElements.tokenText.textContent = navData.committedTokens.join("")
    if (navData.errorMessage != null) {
        navElements.beforeCursor.textContent = ""
        navElements.textCursor.textContent = ""
        navElements.afterCursor.textContent = ""
        navElements.error.textContent = navData.errorMessage
    }
    else if (selected) {
        navElements.beforeCursor.textContent = navData.inputText
        navElements.error.textContent = ""
        if (navData.inputText.length >= selected.dataset.page.length) {
            navElements.textCursor.textContent = "\u00A0"
            navElements.afterCursor.textContent = ""
        }
        else {
            navElements.textCursor.textContent = selected.dataset.page.charAt(navData.inputText.length)
            navElements.afterCursor.textContent = selected.dataset.page.slice(navData.inputText.length + 1)
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
    const built = buildDestination(navData.actualLocation, getTokenString())
    const { kept, pending } = splitDestination(navData.actualLocation, built)
    navElements.pathReal.textContent = "~" + kept
    navElements.pathPreview.textContent = pending
}

// ---------- ASSERTS ---------- //

function runAsserts() {
    console.assert(serializePathData(parsePathData("/", "")) === "/", "nav assert 1")
    console.assert(serializePathData(parsePathData("/shelf/", "")) === "/shelf/", "nav assert 2")
    console.assert(serializePathData(parsePathData("/shelf/", "?medium=manga")) === "/shelf/?medium=manga", "nav assert 3")
    console.assert(serializePathData(parsePathData("/shelf/", "?medium=manga&verdict=essential")) === "/shelf/?medium=manga&verdict=essential", "nav assert 4")
    console.assert(serializePathData(parsePathData("/shelf/", "?medium=manga&medium=anime")) === "/shelf/?medium=anime", "nav assert 5")
    console.assert(serializePathData(parsePathData("/shelf/", "?q=hello%20world")) === "/shelf/?q=hello+world", "nav assert 6")

    console.assert(parsePathData("/shelf/", "?medium=manga").page === "/shelf/", "nav assert 7")
    console.assert(parsePathData("/shelf/", "?medium=manga").filters.medium === "manga", "nav assert 8")
    console.assert(Object.keys(parsePathData("/shelf/", "").filters).length === 0, "nav assert 9")

    console.assert(matchLinkText("shelf", "sh") === true, "nav assert 10")
    console.assert(matchLinkText("shelf", "SH") === true, "nav assert 11")
    console.assert(matchLinkText("shelf", "") === true, "nav assert 12")
    console.assert(matchLinkText("shelf", "elf") === false, "nav assert 13")

    const split1 = splitDestination("/shelf/", "/projects/")
    console.assert(split1.kept === "/", "nav assert 14")
    console.assert(split1.pending === "projects/", "nav assert 15")
    const split2 = splitDestination("/", "/shelf/")
    console.assert(split2.kept === "/", "nav assert 16")
    console.assert(split2.pending === "shelf/", "nav assert 17")
    const split3 = splitDestination("/shelf/", "/shelf/")
    console.assert(split3.kept === "/shelf/", "nav assert 18")
    console.assert(split3.pending === "", "nav assert 19")
    const split4 = splitDestination("/", "/")
    console.assert(split4.kept === "/", "nav assert 20")
    console.assert(split4.pending === "", "nav assert 21")
    const split5 = splitDestination("/shelf/?medium=manga", "/shelf/")
    console.assert(split5.kept === "/shelf/", "nav assert 22")
    console.assert(split5.pending === "", "nav assert 23")

    console.assert(buildDestination("/", "") === "/", "nav assert 24")
    console.assert(buildDestination("/", "pro") === "/pro/", "nav assert 25")
    console.assert(buildDestination("/shelf/", "one-pie") === "/shelf/one-pie/", "nav assert 26")

    console.assert(buildDestination("/shelf/", "?") === "/shelf/?", "assert 27")
    console.assert(buildDestination("/shelf/", "?medium=man") === "/shelf/?medium=man", "assert 28")
    console.assert(buildDestination("/shelf/", "../") === "/shelf/../", "assert 29")
    console.assert(buildDestination("/shelf/", "../pro") === "/shelf/../pro/", "assert 30")
    console.assert(buildDestination("/shelf/one-piece/", "../../") === "/shelf/one-piece/../../", "assert 31")
    console.assert(buildDestination("/shelf/", "../?medium=man") === "/shelf/../?medium=man", "assert 32")
}

// ---------- MAIN ---------- //

function main() {
    if (import.meta.env.DEV) {
        runAsserts()
    }

    storeActualLocation()

    inputHandler()

    navElements.input.addEventListener("input", (e) => {
        inputHandler()
    })
    navElements.input.addEventListener("keydown", (e) => {
        keydownHandler(e)
    })
    navElements.input.addEventListener("click", (e) => {
        clickHandler()
    })
    navElements.input.addEventListener("focus", (e) => {
        focusHandler()
    })
}

main()
