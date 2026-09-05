import { offeredCommands } from "./resolve.js"

export function deriveCandidates(bridge, context) {

    if (bridge[context.page] === undefined) {
        return []
    }

    const returnArray = []
    switch (context.mode) {
        case "path":
            for (const child of bridge[context.page].children) {
                returnArray.push({ "name": child.name, "kind": child.kind, "count": null })
            }

            for (const command of offeredCommands(bridge, context)) {
                returnArray.push({ "name": command, "kind": "command", "count": null })
            }
            break

        case "key":
            for (const facet of Object.keys(bridge[context.page].facets)) {
                returnArray.push({ "name": facet, "kind": "key", "count": null })
            }
            break

        case "value":
            if (hasFacet(bridge, context.page, context.key)) {
                for (const [name, count] of Object.entries(bridge[context.page].facets[context.key])) {
                    returnArray.push({ "name": name, "kind": "value", "count": count })
                }
            }
            else {
                return []
            }
            break
    }
    return returnArray
}

export function hasFacet(bridge, page, key) {
    if (bridge[page] === undefined) {
        return false
    }
    else {
        return Object.hasOwn(bridge[page].facets, key)
    }
}

export function hasValue(bridge, page, key, value) {
    if (hasFacet(bridge, page, key)) {
        return Object.hasOwn(bridge[page].facets[key], value)
    }
    return false
}

export function matchLinkText(page, input) {
    return page.startsWith(input)
}
