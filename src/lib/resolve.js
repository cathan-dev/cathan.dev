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

export function commandConflicts(bridge) {
    const commands = navCommands.map(c => c.input)
    for (const page of Object.keys(bridge)) {
        for (const child of bridge[page].children.map(c => c.name)) {
            if (commands.includes(child)) {
                throw new Error("On page: " + String(page) + "\nChild: " + String(child) + "\nCollides with command")
            }
        }
    }
}
