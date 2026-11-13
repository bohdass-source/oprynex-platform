import "@testing-library/jest-dom/vitest";

// jsdom has no scrolling; the router restores scroll positions on navigation.
Object.defineProperty(window, "scrollTo", { writable: true, value: () => {} });
Object.defineProperty(window, "ResizeObserver", { writable: true, value: class { observe() {} disconnect() {} } });
