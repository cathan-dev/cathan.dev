// ---------- CONSTANTS ---------- //

import { parsePathData, serializePathData, splitDestination, buildDestination, segmentContext, isTailLegal, applyToken } from "../../lib/location.js"
import { deriveCandidates, hasFacet } from "../../lib/candidates.js"
import { resolve } from "../../lib/resolve.js"

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

function matchLinkText(page, input) {
    return page.startsWith(input)
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
            return
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
    console.assert(matchLinkText("shelf", "SH") === false, "nav assert 11")
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
    console.assert(buildDestination("/shelf/?", "medi") === "/shelf/?medi", "nav assert 28")
    console.assert(buildDestination("/shelf/?medium=", "mang") === "/shelf/?medium=mang", "nav assert 29")
    console.assert(buildDestination("/shelf/?medium=manga", "one-piece") === "/shelf/one-piece/", "nav assert 30")
    console.assert(buildDestination("/shelf/", "") === "/shelf/", "nav assert 31")

    const segment1 = segmentContext("/")
    console.assert(segment1.mode === "path", "nav assert 33")
    console.assert(segment1.page === "/", "nav assert 34")
    console.assert(segment1.key === null, "nav assert 35")
    console.assert(segment1.hasFilters === false, "nav assert 36")
    const segment2 = segmentContext("/shelf/")
    console.assert(segment2.mode === "path", "nav assert 37")
    console.assert(segment2.page === "/shelf/", "nav assert 38")
    console.assert(segment2.key === null, "nav assert 39")
    console.assert(segment2.hasFilters === false, "nav assert 40")
    const segment3 = segmentContext("/")
    console.assert(segment3.mode === "path", "nav assert 41")
    console.assert(segment3.page === "/", "nav assert 42")
    console.assert(segment3.key === null, "nav assert 43")
    console.assert(segment3.hasFilters === false, "nav assert 44")
    const segment4 = segmentContext("/")
    console.assert(segment4.mode === "path", "nav assert 45")
    console.assert(segment4.page === "/", "nav assert 46")
    console.assert(segment4.key === null, "nav assert 47")
    console.assert(segment4.hasFilters === false, "nav assert 48")
    const segment5 = segmentContext("/shelf/?")
    console.assert(segment5.mode === "key", "nav assert 49")
    console.assert(segment5.page === "/shelf/", "nav assert 50")
    console.assert(segment5.key === null, "nav assert 51")
    console.assert(segment5.hasFilters === true, "nav assert 52")
    const segment6 = segmentContext("/shelf/?medium=")
    console.assert(segment6.mode === "value", "nav assert 53")
    console.assert(segment6.page === "/shelf/", "nav assert 54")
    console.assert(segment6.key === "medium", "nav assert 55")
    console.assert(segment6.hasFilters === true, "nav assert 56")
    const segment7 = segmentContext("/shelf/?medium=manga")
    console.assert(segment7.mode === "path", "nav assert 57")
    console.assert(segment7.page === "/shelf/", "nav assert 58")
    console.assert(segment7.key === null, "nav assert 59")
    console.assert(segment7.hasFilters === true, "nav assert 60")

    const fixtureBridge = {
        "/": { children: [{ name: "alpha", kind: "page" }, { name: "beta", kind: "page" }], facets: {} },
        "/alpha/": { children: [{ name: "solo", kind: "entry" }], facets: { medium: { manga: 2, movie: 1 }, verdict: { good: 1 } } },
        "/beta/": { children: [], facets: {} },
    }

    const derive1 = deriveCandidates(fixtureBridge, { mode: "path", page: "/", key: null, hasFilters: false })
    console.assert(derive1.length === 2, "nav assert 61")
    console.assert(derive1[0].name === "alpha", "nav assert 62")
    console.assert(derive1[0].kind === "page", "nav assert 63")
    console.assert(derive1[0].count === null, "nav assert 64")

    const derive2 = deriveCandidates(fixtureBridge, { mode: "path", page: "/alpha/", key: null, hasFilters: false })
    console.assert(derive2.length === 3, "nav assert 65")
    console.assert(derive2[0].name === "solo" && derive2[0].kind === "entry", "nav assert 66")
    console.assert(derive2[1].name === "back" && derive2[1].kind === "command", "nav assert 67")
    console.assert(derive2[2].name === "filter" && derive2[2].kind === "command", "nav assert 68")

    const derive3 = deriveCandidates(fixtureBridge, { mode: "path", page: "/beta/", key: null, hasFilters: false })
    console.assert(derive3.length === 1, "nav assert 69")
    console.assert(derive3[0].name === "back", "nav assert 70")

    const derive4 = deriveCandidates(fixtureBridge, { mode: "path", page: "/gamma/", key: null, hasFilters: false })
    console.assert(Array.isArray(derive4) && derive4.length === 0, "nav assert 71")

    const derive5 = deriveCandidates(fixtureBridge, { mode: "key", page: "/alpha/", key: null, hasFilters: true })
    console.assert(derive5.length === 2, "nav assert 72")
    console.assert(derive5[0].name === "medium" && derive5[0].kind === "key" && derive5[0].count === null, "nav assert 73")
    console.assert(derive5[1].name === "verdict" && derive5[1].kind === "key", "nav assert 74")

    const derive6 = deriveCandidates(fixtureBridge, { mode: "value", page: "/alpha/", key: "medium", hasFilters: true })
    console.assert(derive6.length === 2, "nav assert 75")
    console.assert(derive6[0].name === "manga" && derive6[0].kind === "value" && derive6[0].count === 2, "nav assert 76")
    console.assert(derive6[1].name === "movie" && derive6[1].kind === "value" && derive6[1].count === 1, "nav assert 77")

    const derive7 = deriveCandidates(fixtureBridge, { mode: "value", page: "/alpha/", key: "verdict", hasFilters: true })
    console.assert(derive7.length === 1, "nav assert 78")
    console.assert(derive7[0].name === "good" && derive7[0].count === 1, "nav assert 79")

    const derive8 = deriveCandidates(fixtureBridge, { mode: "value", page: "/alpha/", key: "bogus", hasFilters: true })
    console.assert(Array.isArray(derive8) && derive8.length === 0, "nav assert 80")

    console.assert(isTailLegal("") === true, "nav assert 102")
    console.assert(isTailLegal("shelf") === true, "nav assert 103")
    console.assert(isTailLegal("hunter-x-hunter") === true, "nav assert 104")
    console.assert(isTailLegal("404") === true, "nav assert 105")
    console.assert(isTailLegal("-") === true, "nav assert 106")
    console.assert(isTailLegal("/shelf") === false, "nav assert 107")
    console.assert(isTailLegal("/") === false, "nav assert 108")
    console.assert(isTailLegal("\\shelf") === false, "nav assert 109")
    console.assert(isTailLegal("a@evil.com") === false, "nav assert 110")
    console.assert(isTailLegal("100%") === false, "nav assert 111")
    console.assert(isTailLegal("%") === false, "nav assert 112")
    console.assert(isTailLegal("shelf?") === false, "nav assert 113")
    console.assert(isTailLegal("?medium") === false, "nav assert 114")
    console.assert(isTailLegal("?") === false, "nav assert 115")
    console.assert(isTailLegal("medium=") === false, "nav assert 116")
    console.assert(isTailLegal("shelf#foo") === false, "nav assert 117")
    console.assert(isTailLegal("a b") === false, "nav assert 118")
    console.assert(isTailLegal("..") === false, "nav assert 119")
    console.assert(isTailLegal("café") === false, "nav assert 120")

    console.assert(applyToken("/", "shelf/") === "/shelf/", "nav assert 122")
    console.assert(applyToken("/shelf/", "one-piece/") === "/shelf/one-piece/", "nav assert 123")
    console.assert(applyToken("/shelf/", "?") === "/shelf/?", "nav assert 124")
    console.assert(applyToken("/shelf/?medium=manga", "&") === "/shelf/?medium=manga&", "nav assert 125")
    console.assert(applyToken("/shelf/?medium=", "manga") === "/shelf/?medium=manga", "nav assert 126")
    console.assert(applyToken("/shelf/one-piece/", "↑") === "/shelf/", "nav assert 127")
    console.assert(applyToken("/shelf/?medium=manga", "↑") === "/shelf/", "nav assert 128")
    console.assert(applyToken("/shelf/?medium=manga&verdict=essential", "↑") === "/shelf/?medium=manga", "nav assert 129")
    console.assert(applyToken("/", "↑") === "/", "nav assert 130")
    console.assert(applyToken("/shelf/?medium=manga&2=b", "↑") === "/shelf/?medium=manga", "nav assert 131")
    console.assert(applyToken("/shelf/?medium=manga&medium=anime", "↑") === "/shelf/", "nav assert 132")
    console.assert(applyToken("/a/b/c/", "↑") === "/a/b/", "nav assert 133")
    console.assert(applyToken("/shelf/?__proto__=x&medium=manga", "↑") === "/shelf/?__proto__=x", "nav assert 134")

    console.assert(resolve("back", segmentContext("/")) === "↑", "nav assert 135")
    console.assert(resolve("back", segmentContext("/?query=true")) === "↑", "nav assert 136")
    console.assert(resolve("filter", segmentContext("/")) === "?", "nav assert 137")
    console.assert(resolve("filter", segmentContext("/?query=true")) === "&", "nav assert 138")
    console.assert(resolve("shelf", segmentContext("/")) === null, "nav assert 139")
    console.assert(resolve("", segmentContext("/")) === null, "nav assert 140")
    console.assert(resolve("BACK", segmentContext("/")) === null, "nav assert 141")
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
