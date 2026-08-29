import { execSync } from "node:child_process";

export function tryExecSync(command) {
    try {
        const output = execSync(command, { encoding: "utf8", }).trim()
        return output
    } catch {
        return null
    }
}
