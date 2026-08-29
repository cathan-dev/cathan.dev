import { parsePathData } from "../../lib/location.js"

const shelfElements = {
    entries: document.querySelectorAll(".shelf-entry"),
}

function matchFilters(entryFacets, filters) {
    for (const filterKey of Object.keys(filters)) {
        if (filters[filterKey] !== entryFacets[filterKey]) {
            return false
        }
    }
    return true
}

function matchEntries(filters) {
    shelfElements.entries.forEach((entry) => {
        entry.hidden = !matchFilters(entry.dataset, filters)
    })
}

function runShelfAsserts() {
    console.assert(matchFilters({ medium: "manga", verdict: "essential" }, { medium: "manga" }) === true, "shelf assert 1")
    console.assert(matchFilters({ medium: "manga", verdict: "essential" }, { medium: "manga", verdict: "essential" }) === true, "shelf assert 2")
    console.assert(matchFilters({ medium: "movie", verdict: "worth-it" }, { medium: "movie", verdict: "essential" }) === false, "shelf assert 3")
    console.assert(matchFilters({ medium: "manga", verdict: "essential" }, { verdict: "manga" }) === false, "shelf assert 4")
    console.assert(matchFilters({ medium: "manga", verdict: "essential" }, {}) === true, "shelf assert 5")
    console.assert(matchFilters({ medium: "manga", verdict: "essential" }, { bogus: "manga" }) === false, "shelf assert 6")
}

function main() {
    if (import.meta.env.DEV) {
        runShelfAsserts()
    }

    const { filters } = parsePathData(window.location.pathname, window.location.search)
    matchEntries(filters)
}

main()
