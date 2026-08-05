// ---------- CONSTANTS ---------- //

// Make sure these classes all exist in the HTML
const navElements = {
    input: document.getElementById("nav-input"),
    listLinks: document.querySelectorAll(".nav-link"),
    beforeCursor: document.querySelector(".nav-before-cursor"),
    textCursor: document.querySelector(".nav-text-cursor"),
    afterCursor: document.querySelector(".nav-after-cursor"),
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
    navData.listEligible = [...navElements.listLinks].filter((link) => matchLinkText(link.dataset.page))
}

function matchLinkText(page) {
    return page.toLowerCase().startsWith(navData.inputText.toLowerCase())
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
