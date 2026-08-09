// ---------- CONSTANTS ---------- //

// Make sure these classes all exist in the HTML
const navElements = {
    listLinks: [...document.querySelectorAll(".nav-link")].reverse(),
    input: document.getElementById("nav-input"),
    beforeCursor: document.querySelector(".nav-before-cursor"),
    textCursor: document.querySelector(".nav-text-cursor"),
    afterCursor: document.querySelector(".nav-after-cursor"),
    pathReal: document.querySelector(".nav-path-text-real"),
    pathPreview: document.querySelector(".nav-path-text-preview"),
    error: document.querySelector(".nav-error")
}

const navData = {
    inputText: "",
    listEligible: [...navElements.listLinks],
    selectedIndex: 0,
    errorMessage: null,
    errorTimer: null
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

// ---------- PATH AND PREVIEW FUNCTIONS ---------- //

function writePathOnStartup() {
    const actualLocation = getActualLocation()
    navElements.pathReal.textContent = "~" + actualLocation
}

function getActualLocation() {
    return serializePathData(parsePathData(window.location.pathname, window.location.search))
}

function parsePathData(pathName, search) {
    if (search === "") {
        return { page: pathName, filters: {} }
    }
    let searchParams = new URLSearchParams(search)
    let paramObject = {}
    for (const [key, value] of searchParams) {
        paramObject[key] = value
    }
    return { page: pathName, filters: paramObject }
}

function serializePathData(components) {
    let fullPath = components.page
    if (Object.keys(components.filters).length > 0) {
        fullPath += ("?" + new URLSearchParams(components.filters).toString())
    }
    return fullPath
}


// ---------- KEYDOWN FUNCTIONS ---------- //

function keydownHandler(e) {
    if (navData.errorMessage != null) {
        removeError();
        render();
        return
    }
    switch (e.key) {
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

function enterKeydownHandler() {
    if (navData.listEligible.length > 0) {
        window.location.assign(navData.listEligible[navData.selectedIndex].href)
    }
    else {
        setError()
    }
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
}

function renderItems(selected) {
    navElements.listLinks.forEach((link) => {
        link.closest("li").classList.toggle("is-hidden", !navData.listEligible.includes(link))
        link.closest("li").classList.toggle("is-selected", link === selected)
    })
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

// ---------- ASSERTS ---------- //

function runAsserts() {
    console.assert(serializePathData(parsePathData("/", "")) === "/", "assert 1")
    console.assert(serializePathData(parsePathData("/shelf/", "")) === "/shelf/", "assert 2")
    console.assert(serializePathData(parsePathData("/shelf/", "?medium=manga")) === "/shelf/?medium=manga", "assert 3")
    console.assert(serializePathData(parsePathData("/shelf/", "?medium=manga&verdict=essential")) === "/shelf/?medium=manga&verdict=essential", "assert 4")
    console.assert(serializePathData(parsePathData("/shelf/", "?medium=manga&medium=anime")) === "/shelf/?medium=anime", "assert 5")
    console.assert(serializePathData(parsePathData("/shelf/", "?q=hello%20world")) === "/shelf/?q=hello+world", "assert 6")

    console.assert(parsePathData("/shelf/", "?medium=manga").page === "/shelf/", "assert 7")
    console.assert(parsePathData("/shelf/", "?medium=manga").filters.medium === "manga", "assert 8")
    console.assert(Object.keys(parsePathData("/shelf/", "").filters).length === 0, "assert 9")

    console.assert(matchLinkText("shelf", "sh") === true, "assert 10")
    console.assert(matchLinkText("shelf", "SH") === true, "assert 11")
    console.assert(matchLinkText("shelf", "") === true, "assert 12")
    console.assert(matchLinkText("shelf", "elf") === false, "assert 13")

}

// ---------- MAIN ---------- //

function main() {
    if (import.meta.env.DEV) {
        runAsserts()
    }

    inputHandler()

    writePathOnStartup()

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
