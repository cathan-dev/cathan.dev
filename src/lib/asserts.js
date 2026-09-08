import { parsePathData, serializePathData, splitDestination, buildDestination, segmentContext, isTailLegal, applyToken, } from "./location.js"
import { deriveCandidates, matchLinkText, hasFacet, hasValue } from "./candidates.js"
import { resolve, offeredCommands, commandConflicts } from "./resolve.js"

export function runAsserts() {
    const throws = (fn) => { try { fn(); return false } catch { return true } }

    // --- parsePathData / serializePathData ---
    console.assert(serializePathData(parsePathData("/", "")) === "/", "nav assert 1")
    console.assert(serializePathData(parsePathData("/shelf/", "")) === "/shelf/", "nav assert 2")
    console.assert(serializePathData(parsePathData("/shelf/", "?medium=manga")) === "/shelf/?medium=manga", "nav assert 3")
    console.assert(serializePathData(parsePathData("/shelf/", "?medium=manga&verdict=essential")) === "/shelf/?medium=manga&verdict=essential", "nav assert 4")
    console.assert(serializePathData(parsePathData("/shelf/", "?medium=manga&medium=anime")) === "/shelf/?medium=anime", "nav assert 5")
    console.assert(serializePathData(parsePathData("/shelf/", "?q=hello%20world")) === "/shelf/?q=hello+world", "nav assert 6")
    console.assert(parsePathData("/shelf/", "?medium=manga").page === "/shelf/", "nav assert 7")
    console.assert(parsePathData("/shelf/", "?medium=manga").filters.medium === "manga", "nav assert 8")
    console.assert(Object.keys(parsePathData("/shelf/", "").filters).length === 0, "nav assert 9")

    // --- matchLinkText (case-sensitive by ruling) ---
    console.assert(matchLinkText("shelf", "sh") === true, "nav assert 10")
    console.assert(matchLinkText("shelf", "SH") === false, "nav assert 11")
    console.assert(matchLinkText("shelf", "") === true, "nav assert 12")
    console.assert(matchLinkText("shelf", "elf") === false, "nav assert 13")

    // --- splitDestination ---
    const split1 = splitDestination("/shelf/", "/projects/")
    console.assert(split1.kept === "/", "nav assert 14")
    console.assert(split1.pending === "projects/", "nav assert 15")
    const split2 = splitDestination("/", "/shelf/")
    console.assert(split2.kept === "/", "nav assert 16")
    console.assert(split2.pending === "shelf/", "nav assert 17")
    const split3 = splitDestination("/shelf/", "/shelf/")
    console.assert(split3.kept === "/shelf/", "nav assert 18")
    console.assert(split3.pending === "", "nav assert 19")
    const split4 = splitDestination("/", "/")
    console.assert(split4.kept === "/", "nav assert 20")
    console.assert(split4.pending === "", "nav assert 21")
    const split5 = splitDestination("/shelf/?medium=manga", "/shelf/")
    console.assert(split5.kept === "/shelf/", "nav assert 22")
    console.assert(split5.pending === "", "nav assert 23")

    // --- buildDestination (second arg is a TAIL: [a-z0-9-] only) ---
    console.assert(buildDestination("/", "") === "/", "nav assert 24")
    console.assert(buildDestination("/", "pro") === "/pro/", "nav assert 25")
    console.assert(buildDestination("/shelf/", "one-pie") === "/shelf/one-pie/", "nav assert 26")
    console.assert(buildDestination("/shelf/", "") === "/shelf/", "nav assert 27")
    console.assert(buildDestination("/shelf/?", "medi") === "/shelf/?medi", "nav assert 28")
    console.assert(buildDestination("/shelf/?medium=", "mang") === "/shelf/?medium=mang", "nav assert 29")
    console.assert(buildDestination("/shelf/?medium=manga&", "verd") === "/shelf/?medium=manga&verd", "nav assert 30")
    console.assert(buildDestination("/shelf/?medium=manga&verdict=", "essent") === "/shelf/?medium=manga&verdict=essent", "nav assert 31")
    console.assert(buildDestination("/shelf/?medium=manga", "one-piece") === "/shelf/one-piece/", "nav assert 32")

    // --- segmentContext (takes a composed level, no tokens) ---
    const segment1 = segmentContext("/")
    console.assert(segment1.mode === "path", "nav assert 33")
    console.assert(segment1.page === "/", "nav assert 34")
    console.assert(segment1.key === null, "nav assert 35")
    console.assert(segment1.hasFilters === false, "nav assert 36")
    const segment2 = segmentContext("/shelf/")
    console.assert(segment2.mode === "path", "nav assert 37")
    console.assert(segment2.page === "/shelf/", "nav assert 38")
    console.assert(segment2.key === null, "nav assert 39")
    console.assert(segment2.hasFilters === false, "nav assert 40")
    const segment3 = segmentContext("/shelf/?medium=manga&")
    console.assert(segment3.mode === "key", "nav assert 41")
    console.assert(segment3.page === "/shelf/", "nav assert 42")
    console.assert(segment3.key === null, "nav assert 43")
    console.assert(segment3.hasFilters === true, "nav assert 44")
    const segment4 = segmentContext("/shelf/?medium=manga&verdict=")
    console.assert(segment4.mode === "value", "nav assert 45")
    console.assert(segment4.page === "/shelf/", "nav assert 46")
    console.assert(segment4.key === "verdict", "nav assert 47")
    console.assert(segment4.hasFilters === true, "nav assert 48")
    const segment5 = segmentContext("/shelf/?")
    console.assert(segment5.mode === "key", "nav assert 49")
    console.assert(segment5.page === "/shelf/", "nav assert 50")
    console.assert(segment5.key === null, "nav assert 51")
    console.assert(segment5.hasFilters === true, "nav assert 52")
    const segment6 = segmentContext("/shelf/?medium=")
    console.assert(segment6.mode === "value", "nav assert 53")
    console.assert(segment6.page === "/shelf/", "nav assert 54")
    console.assert(segment6.key === "medium", "nav assert 55")
    console.assert(segment6.hasFilters === true, "nav assert 56")
    const segment7 = segmentContext("/shelf/?medium=manga")
    console.assert(segment7.mode === "path", "nav assert 57")
    console.assert(segment7.page === "/shelf/", "nav assert 58")
    console.assert(segment7.key === null, "nav assert 59")
    console.assert(segment7.hasFilters === true, "nav assert 60")

    // --- deriveCandidates ---
    const fixtureBridge = {
        "/": { children: [{ name: "alpha", kind: "page" }, { name: "beta", kind: "page" }], facets: {} },
        "/alpha/": { children: [{ name: "solo", kind: "entry" }], facets: { medium: { manga: 2, movie: 1 }, verdict: { good: 1 } } },
        "/beta/": { children: [], facets: {} },
    }
    const rootContext = { mode: "path", page: "/", key: null, hasFilters: false }
    const alphaContext = { mode: "path", page: "/alpha/", key: null, hasFilters: false }
    const betaContext = { mode: "path", page: "/beta/", key: null, hasFilters: false }

    const derive1 = deriveCandidates(fixtureBridge, rootContext)
    console.assert(derive1.length === 2, "nav assert 61")
    console.assert(derive1[0].name === "alpha", "nav assert 62")
    console.assert(derive1[0].kind === "page", "nav assert 63")
    console.assert(derive1[0].count === null, "nav assert 64")

    const derive2 = deriveCandidates(fixtureBridge, alphaContext)
    console.assert(derive2.length === 3, "nav assert 65")
    console.assert(derive2[0].name === "solo" && derive2[0].kind === "entry", "nav assert 66")
    // court assert 84 (retired-by-refactor): command names come from one source, not literals
    console.assert(JSON.stringify(derive2.filter((c) => c.kind === "command").map((c) => c.name)) === JSON.stringify(offeredCommands(fixtureBridge, alphaContext)), "nav assert 67")

    const derive3 = deriveCandidates(fixtureBridge, betaContext)
    console.assert(JSON.stringify(derive3.filter((c) => c.kind === "command").map((c) => c.name)) === JSON.stringify(offeredCommands(fixtureBridge, betaContext)), "nav assert 68")
    console.assert(derive3.length === 1, "nav assert 69")
    console.assert(derive3[0].name === "back", "nav assert 70")

    const derive4 = deriveCandidates(fixtureBridge, { mode: "path", page: "/gamma/", key: null, hasFilters: false })
    console.assert(Array.isArray(derive4) && derive4.length === 0, "nav assert 71")

    const derive5 = deriveCandidates(fixtureBridge, { mode: "key", page: "/alpha/", key: null, hasFilters: true })
    console.assert(derive5.length === 2, "nav assert 72")
    console.assert(derive5[0].name === "medium" && derive5[0].kind === "key" && derive5[0].count === null, "nav assert 73")
    console.assert(derive5[1].name === "verdict" && derive5[1].kind === "key", "nav assert 74")

    const derive6 = deriveCandidates(fixtureBridge, { mode: "value", page: "/alpha/", key: "medium", hasFilters: true })
    console.assert(derive6.length === 2, "nav assert 75")
    console.assert(derive6[0].name === "manga" && derive6[0].kind === "value" && derive6[0].count === 2, "nav assert 76")
    console.assert(derive6[1].name === "movie" && derive6[1].kind === "value" && derive6[1].count === 1, "nav assert 77")

    const derive7 = deriveCandidates(fixtureBridge, { mode: "value", page: "/alpha/", key: "verdict", hasFilters: true })
    console.assert(derive7.length === 1, "nav assert 78")
    console.assert(derive7[0].name === "good" && derive7[0].count === 1, "nav assert 79")

    const derive8 = deriveCandidates(fixtureBridge, { mode: "value", page: "/alpha/", key: "bogus", hasFilters: true })
    console.assert(Array.isArray(derive8) && derive8.length === 0, "nav assert 80")

    // --- isTailLegal (the alphabet gate) ---
    console.assert(isTailLegal("") === true, "nav assert 81")
    console.assert(isTailLegal("shelf") === true, "nav assert 82")
    console.assert(isTailLegal("hunter-x-hunter") === true, "nav assert 83")
    console.assert(isTailLegal("404") === true, "nav assert 84")
    console.assert(isTailLegal("-") === true, "nav assert 85")
    console.assert(isTailLegal("/shelf") === false, "nav assert 86")
    console.assert(isTailLegal("/") === false, "nav assert 87")
    console.assert(isTailLegal("\\shelf") === false, "nav assert 88")
    console.assert(isTailLegal("a@evil.com") === false, "nav assert 89")
    console.assert(isTailLegal("100%") === false, "nav assert 90")
    console.assert(isTailLegal("%") === false, "nav assert 91")
    console.assert(isTailLegal("shelf?") === false, "nav assert 92")
    console.assert(isTailLegal("?medium") === false, "nav assert 93")
    console.assert(isTailLegal("?") === false, "nav assert 94")
    console.assert(isTailLegal("medium=") === false, "nav assert 95")
    console.assert(isTailLegal("shelf#foo") === false, "nav assert 96")
    console.assert(isTailLegal("a b") === false, "nav assert 97")
    console.assert(isTailLegal("..") === false, "nav assert 98")
    console.assert(isTailLegal("café") === false, "nav assert 99")

    // --- applyToken ---
    console.assert(applyToken("/", "shelf/") === "/shelf/", "nav assert 100")
    console.assert(applyToken("/shelf/", "one-piece/") === "/shelf/one-piece/", "nav assert 101")
    console.assert(applyToken("/shelf/", "?") === "/shelf/?", "nav assert 102")
    console.assert(applyToken("/shelf/?medium=manga", "&") === "/shelf/?medium=manga&", "nav assert 103")
    console.assert(applyToken("/shelf/?medium=", "manga") === "/shelf/?medium=manga", "nav assert 104")
    console.assert(applyToken("/shelf/?medium=manga", "one-piece/") === "/shelf/one-piece/", "nav assert 105")
    console.assert(applyToken("/shelf/?medium=manga&verdict=good", "one-piece/") === "/shelf/one-piece/", "nav assert 106")
    console.assert(applyToken("/shelf/one-piece/", "↑") === "/shelf/", "nav assert 107")
    console.assert(applyToken("/shelf/?medium=manga", "↑") === "/shelf/", "nav assert 108")
    console.assert(applyToken("/shelf/?medium=manga&verdict=essential", "↑") === "/shelf/?medium=manga", "nav assert 109")
    console.assert(applyToken("/", "↑") === "/", "nav assert 110")
    console.assert(applyToken("/a/b/c/", "↑") === "/a/b/", "nav assert 111")
    console.assert(applyToken("/shelf/?medium=manga&2=b", "↑") === "/shelf/?medium=manga", "nav assert 112")
    console.assert(applyToken("/shelf/?medium=manga&medium=anime", "↑") === "/shelf/", "nav assert 113")
    console.assert(applyToken("/shelf/?__proto__=x&medium=manga", "↑") === "/shelf/?__proto__=x", "nav assert 114")

    // --- resolve ---
    console.assert(resolve("back", segmentContext("/")) === "↑", "nav assert 115")
    console.assert(resolve("back", segmentContext("/?query=true")) === "↑", "nav assert 116")
    console.assert(resolve("filter", segmentContext("/")) === "?", "nav assert 117")
    console.assert(resolve("filter", segmentContext("/?query=true")) === "&", "nav assert 118")
    console.assert(resolve("shelf", segmentContext("/")) === null, "nav assert 119")
    console.assert(resolve("", segmentContext("/")) === null, "nav assert 120")
    console.assert(resolve("BACK", segmentContext("/")) === null, "nav assert 121")
    console.assert(resolve("back", segmentContext("/shelf/?")) === null, "nav assert 122")
    console.assert(resolve("filter", segmentContext("/shelf/?medium=")) === null, "nav assert 123")

    // --- hasFacet ---
    console.assert(hasFacet(fixtureBridge, "/alpha/", "medium") === true, "nav assert 124")
    console.assert(hasFacet(fixtureBridge, "/alpha/", "verdict") === true, "nav assert 125")
    console.assert(hasFacet(fixtureBridge, "/alpha/", "bogus") === false, "nav assert 126")
    console.assert(hasFacet(fixtureBridge, "/beta/", "medium") === false, "nav assert 127")
    console.assert(hasFacet(fixtureBridge, "/zzz/", "medium") === false, "nav assert 128")
    console.assert(hasFacet(fixtureBridge, "/alpha/", "toString") === false, "nav assert 129")

    // --- hasValue ---
    console.assert(hasValue(fixtureBridge, "/alpha/", "medium", "manga") === true, "nav assert 130")
    console.assert(hasValue(fixtureBridge, "/alpha/", "medium", "movie") === true, "nav assert 131")
    console.assert(hasValue(fixtureBridge, "/alpha/", "medium", "bogus") === false, "nav assert 132")
    console.assert(hasValue(fixtureBridge, "/alpha/", "bogus", "manga") === false, "nav assert 133")
    console.assert(hasValue(fixtureBridge, "/zzz/", "medium", "manga") === false, "nav assert 134")
    console.assert(hasValue(fixtureBridge, "/alpha/", "medium", "toString") === false, "nav assert 135")

    // --- offeredCommands ---
    console.assert(JSON.stringify(offeredCommands(fixtureBridge, rootContext)) === JSON.stringify([]), "nav assert 136")
    console.assert(JSON.stringify(offeredCommands(fixtureBridge, alphaContext)) === JSON.stringify(["back", "filter"]), "nav assert 137")
    console.assert(JSON.stringify(offeredCommands(fixtureBridge, betaContext)) === JSON.stringify(["back"]), "nav assert 138")
    console.assert(JSON.stringify(offeredCommands(fixtureBridge, { mode: "key", page: "/alpha/", key: null, hasFilters: true })) === JSON.stringify([]), "nav assert 139")
    console.assert(JSON.stringify(offeredCommands(fixtureBridge, { mode: "value", page: "/alpha/", key: "medium", hasFilters: true })) === JSON.stringify([]), "nav assert 140")

    // --- commandConflicts ---
    console.assert(throws(() => commandConflicts(fixtureBridge)) === false, "nav assert 141")
    console.assert(throws(() => commandConflicts({ "/": { children: [{ name: "back", kind: "page" }], facets: {} } })) === true, "nav assert 142")
    console.assert(throws(() => commandConflicts({ "/x/": { children: [{ name: "filter", kind: "entry" }], facets: {} } })) === true, "nav assert 143")

    // --- court assert 83: anchor href === Enter destination for every page/entry candidate.
    // Only valid because commandConflicts forbids a candidate sharing a command name;
    // otherwise resolve would intercept the name and the two routes would diverge.
    const parityLevels = ["/", "/alpha/", "/alpha/?medium=manga", "/alpha/?medium=manga&verdict=good"]
    const parityPairs = parityLevels.flatMap((level) => {
        const context = segmentContext(level)
        return deriveCandidates(fixtureBridge, context)
            .filter((candidate) => candidate.kind === "page" || candidate.kind === "entry")
            .map((candidate) => [context.page + candidate.name + "/", buildDestination(level, candidate.name)])
    })
    console.assert(parityPairs.every(([anchor, enter]) => anchor === enter), "nav assert 144")
}