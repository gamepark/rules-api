export function loopWithFuse(repeat: () => boolean, options?: { attempts?: number, errorFn?: () => Error }) {
  let attempts = options?.attempts || (process.env.NODE_ENV === 'development' ? 1000 : 10000)
  const errorFn = options?.errorFn || (() => new Error('Infinite loop detected'))
  while (repeat()) {
    if (attempts == 0) {
      throw errorFn()
    }
    attempts--
  }
}