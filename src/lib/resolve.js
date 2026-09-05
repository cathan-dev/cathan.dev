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

export function offeredCommands(bridge, context) {
    const returnedInputs = []
    if (context.mode !== "path") {
        return returnedInputs
    }
    for (const obj of navCommands) {
        if (obj.offered(bridge, context)) {
            returnedInputs.push(obj.input)
        }
    }
    return returnedInputs
}
