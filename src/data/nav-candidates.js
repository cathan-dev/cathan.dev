export function candidatesFor(path) {
    if (path === "/") {
        return [
            { href: '/projects/', slug: 'projects' },
            { href: '/shelf/', slug: 'shelf' },
            { href: '/updates/', slug: 'updates' },
        ]
    }
    return [
        { href: '../', slug: '..' }
    ]
}
