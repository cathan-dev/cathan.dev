const navElements = {
    input: document.getElementById("nav-input"),
    list: document.querySelectorAll(".nav-list"),
    listItems: document.querySelectorAll(".nav-list-item"),
    listLinks: document.querySelectorAll(".nav-link"),
    listText: document.querySelectorAll(".nav-link-text"),
    overlayText: document.querySelectorAll(".nav-overlay-text")
}

const navData = {
    inputText: "",
    listPages: [...navElements.listLinks].map((link) => link.dataset.page)
}

function stateUpdate() {
    navData.inputText = getInputText()
    toggleLinks()
}

function getInputText() {
    return navElements.input.value
}

function toggleLinks() {
    navElements.listItems.forEach((elem, index) => {
        elem.classList.toggle("is-hidden", !matchLinkText(index))
    })
}

function matchLinkText(index) {
    return navData.listPages[index].startsWith(navData.inputText)
}

function main() {
    console.log(navElements)
    console.log(navData)
    navElements.input.addEventListener("input", () => {
        stateUpdate()
        render()
    })
}

main()
