export function parsePathData(pathName, search) {
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

export function serializePathData(components) {
    let fullPath = components.page
    if (Object.keys(components.filters).length > 0) {
        fullPath += ("?" + new URLSearchParams(components.filters).toString())
    }
    return fullPath
}

export function splitDestination(actual, destination) {
    let border = 0
    while (border < destination.length && actual[border] === destination[border]) {
        border += 1
    }
    return { kept: destination.substring(0, border), pending: destination.substring(border) }
}

export function buildDestination(actual, buffer) {
    if (buffer === "") {
        return actual
    }
    if (buffer.includes("?")) {
        return actual + buffer
    }
    if (buffer[buffer.length - 1] === "/") {
        return actual + buffer
    }
    return actual + buffer + "/"
}

export function segmentContext(actual, tokens) {
    const actualPage = actual.split("?")[0]
    const tokenIndex = tokens.indexOf("?")
    if (tokenIndex === -1) {
        const mode = "path"
        const hasFilters = actual.includes("?")
        const page = new URL(actualPage + tokens.join(""), "http://x").pathname
        return { mode, page, key: null, hasFilters }
    }
    else {
        const hasFilters = true
        const pageTokens = tokens.slice(0, tokenIndex)
        const page = new URL(actualPage + pageTokens.join(""), "http://x").pathname
        if (tokens.at(-1) === "?") {
            const mode = "key"
            const key = null
            return { mode, page, key, hasFilters }
        }
        else {
            const mode = "value"
            const key = tokens.at(-1).slice(0, -1)
            return { mode, page, key, hasFilters }
        }

    }
}