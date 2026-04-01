const waitTasks: Promise<unknown>[] = [];
export function waitUntil(promise: Promise<unknown>): void {
    waitTasks.push(promise);
}

export async function consumeWaitUntil(
    consumer?: (task: Promise<unknown>) => Promise<void> | void
): Promise<void> {
    const tasks = waitTasks.slice();
    waitTasks.length = 0;
    const all = [];
    for (const task of tasks) {
        if (consumer) {
            all.push(consumer(task));
        } else {
            all.push(task);
        }
    }
}
