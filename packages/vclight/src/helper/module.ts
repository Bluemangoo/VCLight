export async function importFrom<T>(module: string, name?: string): Promise<T> {
    try {
        const m = await import(module);
        if (name === undefined) {
            return m;
        }
        return m[name];
    } catch {
        const m = require(module);
        if (name === undefined) {
            return m;
        }
        return m[name];
    }
}
