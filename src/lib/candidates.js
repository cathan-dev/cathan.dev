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

            if (context.page !== "/") {
                returnArray.push({ "name": "back", "kind": "command", "count": null })
            }

            if (Object.keys(bridge[context.page].facets).length > 0) {
                returnArray.push({ "name": "filter", "kind": "command", "count": null })
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
