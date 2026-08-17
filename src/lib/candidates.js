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
            if (context.key in bridge[context.page].facets) {
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