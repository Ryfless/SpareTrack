import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
