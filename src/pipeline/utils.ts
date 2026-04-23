export function debounce<T extends (...args: never[]) => Promise<void> | void>(fn: T, ms: number): (...args: Parameters<T>) => Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  let pending: Promise<void> | undefined;

  return async (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    pending = new Promise((resolve) => {
      timer = setTimeout(async () => {
        await fn(...args);
        resolve();
      }, ms);
    });
    return pending;
  };
}
