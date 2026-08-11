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
    return actual + buffer + "/"
}