import '@testing-library/jest-dom';

// Mock HTMLMediaElement methods for Audio API testing in JSDOM
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
window.HTMLMediaElement.prototype.load = () => {};

// Mock window.scrollTo
window.scrollTo = () => {};
