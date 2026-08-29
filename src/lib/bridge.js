import { hasOwnPage } from "./entries.js"

function buildHomeChildren(rootChildren) {
    let bridgeChildren = []
    for (const child of rootChildren) {
        bridgeChildren.push({ "name": child.slug, "kind": "page" })
    }
    return bridgeChildren
}

function countFacets(entries, facetNames) {
    const counts = {}
    for (const facet of facetNames) {
        counts[facet] = {}
        for (const entry of entries) {
            const value = entry.data[facet]
            counts[facet][value] = (counts[facet][value] ?? 0) + 1
        }
    }
    return counts
}

function deriveChildren(entries) {
    let returnArray = []

    for (const entry of entries) {
        if (hasOwnPage(entry)) {
            returnArray.push({ "name": entry.id, "kind": "entry" })
        }
    }

    return returnArray
}

export function buildBridge(rootChildren, pageFacets, entriesByCollection) {
    let bridge = {}
    bridge["/"] = { children: buildHomeChildren(rootChildren), facets: {} }
    for (const child of rootChildren) {
        bridge[child.href] = { "children": [], "facets": {} }

        if (child.href in pageFacets) {
            const config = pageFacets[child.href]
            const entries = entriesByCollection[config.collection]
            bridge[child.href].facets = countFacets(entries, config.facets)
            bridge[child.href].children = deriveChildren(entries)
            for (const childsChild of bridge[child.href].children) {
                bridge[child.href + childsChild.name + "/"] = { "children": [], "facets": {} }
            }
        }
    }
    return bridge
}
