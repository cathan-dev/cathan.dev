export function hasOwnPage(entry) {
    switch (entry.collection) {
        case "projects":
            return true
        case "shelf":
            return (entry.data.format === "long" && !entry.data.draft)
    }
}