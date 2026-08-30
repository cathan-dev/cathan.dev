import { navCommands } from "../data/commands.js";

export function resolve(input, context) {
    if (context.mode !== "path") {
        return null
    }
    for (const obj of navCommands) {
        if (obj.input === input) {
            if (obj.filtered !== undefined) {
                if (context.hasFilters) {
                    return obj.filtered
                }
            }
            return obj.real
        }
    }
    return null
}
