export async function getCommitCount() {
    try {
        const res = await fetch(
            "https://api.github.com/search/commits?q=author:cathan-dev&per_page=1",
        );
        if (!res.ok) {
            return null
        }
        const data = await res.json()
        return data.total_count
    }
    catch {
        return null
    }
}