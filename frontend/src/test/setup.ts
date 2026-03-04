import '@testing-library/jest-dom'

// jsdom does not implement scrollIntoView
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

// jsdom does not implement IntersectionObserver (e.g. Welcome carousel)
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class IntersectionObserver {
    observe = () => {}
    unobserve = () => {}
    disconnect = () => {}
    takeRecords = () => []
    root = null
    rootMargin = ''
    thresholds = []
  } as unknown as typeof IntersectionObserver
}
