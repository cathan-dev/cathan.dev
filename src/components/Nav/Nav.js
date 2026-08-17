// ---------- CONSTANTS ---------- //

import { parsePathData, serializePathData, splitDestination, buildDestination, segmentContext } from "../../lib/location.js"
import { navCommands } from "../../data/commands.js"
import { deriveCandidates } from "../../lib/candidates.js"

const navBridge = JSON.parse(document.getElementById("nav-bridge").textContent)

// Make sure these classes all exist in the HTML
const navElements = {
    listLinks: [...document.querySelectorAll(".nav-link")].reverse(),
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

// ---------- KEYDOWN FUNCTIONS ---------- //

function keydownHandler(e) {
    if (navData.errorMessage != null) {
        removeError();
        render();
        return
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
                if (navData.committedTokens.length > 0) {
                    if (!navData.tokenLoaded) {
                        navData.tokenLoaded = true
                    }
                    else {
                        navData.committedTokens.pop()
                        navData.tokenLoaded = false
                    }
                }
            }
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

function escapeKeydownHandler() {
    navData.committedTokens = []
    navElements.input.value = ""
    navElements.input.blur()
    inputHandler()
}

// ---------- ERROR FUNCTIONS ---------- //
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

// ---------- CLICK FUNCTIONS ---------- //

function clickHandler() {
    caretReposition()
}

// ---------- FOCUS FUNCTIONS ---------- //

function focusHandler() {
    caretReposition()
}

// ---------- TOKEN FUNCTIONS ---------- //

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

// ---------- N/A FUNCTIONS ---------- //

function caretReposition() {
    navElements.input.setSelectionRange(navElements.input.value.length, navElements.input.value.length)
}

// ---------- RENDERING FUNCTIONS ---------- //

function render() {
    const selected = navData.listEligible[navData.selectedIndex]
    renderItems(selected)
    renderTokens()
    renderGhost(selected)
    renderLocation()
}

function renderItems(selected) {
    navElements.listLinks.forEach((link) => {
        link.closest("li").classList.toggle("is-hidden", !navData.listEligible.includes(link))
        link.closest("li").classList.toggle("is-selected", link === selected)
    })
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

    const segment1 = segmentContext("/", [])
    console.assert(segment1.mode === "path", "assert 33")
    console.assert(segment1.page === "/", "assert 34")
    console.assert(segment1.key === null, "assert 35")
    console.assert(segment1.hasFilters === false, "assert 36")
    const segment2 = segmentContext("/", ["shelf/"])
    console.assert(segment2.mode === "path", "assert 37")
    console.assert(segment2.page === "/shelf/", "assert 38")
    console.assert(segment2.key === null, "assert 39")
    console.assert(segment2.hasFilters === false, "assert 40")
    const segment3 = segmentContext("/shelf/", ["../"])
    console.assert(segment3.mode === "path", "assert 41")
    console.assert(segment3.page === "/", "assert 42")
    console.assert(segment3.key === null, "assert 43")
    console.assert(segment3.hasFilters === false, "assert 44")
    const segment4 = segmentContext("/", ["../"])
    console.assert(segment4.mode === "path", "assert 45")
    console.assert(segment4.page === "/", "assert 46")
    console.assert(segment4.key === null, "assert 47")
    console.assert(segment4.hasFilters === false, "assert 48")
    const segment5 = segmentContext("/", ["shelf/", "?"])
    console.assert(segment5.mode === "key", "assert 49")
    console.assert(segment5.page === "/shelf/", "assert 50")
    console.assert(segment5.key === null, "assert 51")
    console.assert(segment5.hasFilters === true, "assert 52")
    const segment6 = segmentContext("/", ["shelf/", "?", "medium="])
    console.assert(segment6.mode === "value", "assert 53")
    console.assert(segment6.page === "/shelf/", "assert 54")
    console.assert(segment6.key === "medium", "assert 55")
    console.assert(segment6.hasFilters === true, "assert 56")
    const segment7 = segmentContext("/shelf/?medium=manga", [])
    console.assert(segment7.mode === "path", "assert 57")
    console.assert(segment7.page === "/shelf/", "assert 58")
    console.assert(segment7.key === null, "assert 59")
    console.assert(segment7.hasFilters === true, "assert 60")

    const fixtureBridge = {
        "/": { children: [{ name: "alpha", kind: "page" }, { name: "beta", kind: "page" }], facets: {} },
        "/alpha/": { children: [{ name: "solo", kind: "entry" }], facets: { medium: { manga: 2, movie: 1 }, verdict: { good: 1 } } },
        "/beta/": { children: [], facets: {} },
    }

    const derive1 = deriveCandidates(fixtureBridge, { mode: "path", page: "/", key: null, hasFilters: false })
    console.assert(derive1.length === 2, "assert 61")
    console.assert(derive1[0].name === "alpha", "assert 62")
    console.assert(derive1[0].kind === "page", "assert 63")
    console.assert(derive1[0].count === null, "assert 64")

    const derive2 = deriveCandidates(fixtureBridge, { mode: "path", page: "/alpha/", key: null, hasFilters: false })
    console.assert(derive2.length === 3, "assert 65")
    console.assert(derive2[0].name === "solo" && derive2[0].kind === "entry", "assert 66")
    console.assert(derive2[1].name === "back" && derive2[1].kind === "command", "assert 67")
    console.assert(derive2[2].name === "filter" && derive2[2].kind === "command", "assert 68")

    const derive3 = deriveCandidates(fixtureBridge, { mode: "path", page: "/beta/", key: null, hasFilters: false })
    console.assert(derive3.length === 1, "assert 69")
    console.assert(derive3[0].name === "back", "assert 70")

    const derive4 = deriveCandidates(fixtureBridge, { mode: "path", page: "/gamma/", key: null, hasFilters: false })
    console.assert(Array.isArray(derive4) && derive4.length === 0, "assert 71")

    const derive5 = deriveCandidates(fixtureBridge, { mode: "key", page: "/alpha/", key: null, hasFilters: true })
    console.assert(derive5.length === 2, "assert 72")
    console.assert(derive5[0].name === "medium" && derive5[0].kind === "key" && derive5[0].count === null, "assert 73")
    console.assert(derive5[1].name === "verdict" && derive5[1].kind === "key", "assert 74")

    const derive6 = deriveCandidates(fixtureBridge, { mode: "value", page: "/alpha/", key: "medium", hasFilters: true })
    console.assert(derive6.length === 2, "assert 75")
    console.assert(derive6[0].name === "manga" && derive6[0].kind === "value" && derive6[0].count === 2, "assert 76")
    console.assert(derive6[1].name === "movie" && derive6[1].kind === "value" && derive6[1].count === 1, "assert 77")

    const derive7 = deriveCandidates(fixtureBridge, { mode: "value", page: "/alpha/", key: "verdict", hasFilters: true })
    console.assert(derive7.length === 1, "assert 78")
    console.assert(derive7[0].name === "good" && derive7[0].count === 1, "assert 79")

    const derive8 = deriveCandidates(fixtureBridge, { mode: "value", page: "/alpha/", key: "bogus", hasFilters: true })
    console.assert(Array.isArray(derive8) && derive8.length === 0, "assert 80")
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
