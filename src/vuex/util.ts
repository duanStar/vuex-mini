export function foreachValue<S>(
  obj: Record<string, S>,
  fn: (val: S, key: string) => void
) {
  Object.keys(obj).forEach((key) => fn(obj[key], key));
}

export function isPromise(obj: any): obj is Promise<any> {
  return obj && typeof obj.then === "function";
}

export function partial(fn: any, arg: any) {
  return function () {
    return fn(arg);
  };
}
