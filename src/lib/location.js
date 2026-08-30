export function parsePathData(pathName, search) {
    let searchParams = new URLSearchParams(search)
    let paramObject = Object.create(null)
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

export function buildDestination(level, buffer) {
    if (buffer === "") {
        return level
    }
    const mode = segmentContext(level).mode
    if (mode === "path") {
        return applyToken(level, buffer + "/")
    }
    else {
        return applyToken(level, buffer)
    }
}

export function segmentContext(level) {
    const querySet = ["?", "&", "="]
    const page = level.split("?")[0]
    const lastChar = level.at(-1)
    if (querySet.includes(lastChar)) {
        const hasFilters = true
        if (lastChar === "?" || lastChar === "&") {
            const mode = "key"
            const key = null
            return { mode, page, key, hasFilters }
        }
        else {
            const mode = "value"
            let key = ""
            if (level.includes("&")) { // need to find if & is in the string
                key = level.split("&").at(-1).replaceAll("=", "")
            }
            else {
                key = level.split("?").at(-1).slice(0, -1)
            }
            return { mode, page, key, hasFilters }
        }
    }
    else {
        const mode = "path"
        const hasFilters = level.includes("?")
        return { mode, page, key: null, hasFilters }
    }
}

export function isTailLegal(tail) {
    const re = /^[a-z0-9-]*$/
    return re.test(tail)
}

export function applyToken(location, token) {
    const splitLocation = location.split("?")
    switch (token) {
        case "↑": {
            const pathData = parsePathData(splitLocation[0], splitLocation[1])
            if (Object.keys(pathData.filters).length !== 0) {
                const lastKey = [...new URLSearchParams(splitLocation[1]).keys()].at(-1)
                delete pathData.filters[lastKey]
                return serializePathData(pathData)
            }
            else {
                return new URL("..", "http://x" + pathData.page).pathname
            }
        }
        default: {
            if (token.at(-1) === "/") {
                return splitLocation[0] + token
            }
            return location + token
        }
    }
}
