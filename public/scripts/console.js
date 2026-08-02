// ---------- CONSTANTS ---------- //

const navElements = {
    input: document.getElementById("nav-input"),
    list: document.querySelector(".nav-list"),
    listItems: document.querySelectorAll(".nav-list-item"),
    listLinks: document.querySelectorAll(".nav-link"),
    listText: document.querySelectorAll(".nav-link-text"),
    overlayText: document.querySelector(".nav-overlay-text"),
    beforeCursor: document.querySelector(".nav-before-cursor"),
    textCursor: document.querySelector(".nav-text-cursor"),
    afterCursor: document.querySelector(".nav-after-cursor")
}

const navData = {
    inputText: "",
    listEligible: [...navElements.listLinks],
    selectedIndex: 0,
    errorFlag: false
}

// ---------- INPUT FUNCTIONS ---------- //

function inputHandler() {
    navData.selectedIndex = 0
    navData.inputText = getInputText()
    updateEligible()
    render()
}

function getInputText() {
    return navElements.input.value
}

function updateEligible() {
    navData.listEligible = [...navElements.listLinks].filter((link) => matchLinkText(link.dataset.page))
}

function matchLinkText(page) {
    return page.toLowerCase().startsWith(navData.inputText.toLowerCase())
}

// ---------- KEYDOWN FUNCTIONS ---------- //

function keydownHandler(e) {
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
            break
        case "ArrowRight":
            e.preventDefault()
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
}

function tabKeydownHandler() {
    if (navData.listEligible.length > 0) {
        navElements.input.value = navData.listEligible[navData.selectedIndex].dataset.page
        inputHandler()
    }
}

function upKeydownHandler() {
    if (navData.listEligible.length > 0) {
        navData.selectedIndex -= 1
        if (navData.selectedIndex < 0) {
            navData.selectedIndex = navData.listEligible.length - 1
        }
    }
}

function downKeydownHandler() {
    if (navData.listEligible.length > 0) {
        navData.selectedIndex += 1
        if (navData.selectedIndex >= navData.listEligible.length) {
            navData.selectedIndex = 0
        }
    }
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
    if (selected) {
        navElements.beforeCursor.textContent = navData.inputText
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
    }
}

// ---------- MAIN ---------- //

function main() {
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
