export const navCommands = [
    {
        input: "back", real: "↑", offered(bridge, context) {
            return (context.page !== "/")
        }
    },
    {
        input: "filter", real: "?", filtered: "&", offered(bridge, context) {
            if (bridge[context.page] !== undefined) {
                return (Object.keys(bridge[context.page].facets).length > 0)
            }
            return false
        }
    }
]
