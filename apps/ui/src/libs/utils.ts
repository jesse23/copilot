export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    return new Promise((resolve, reject) => {
      const later = () => {
        clearTimeout(timeout);
        try {
          resolve(func.apply(this, args));
        } catch (e) {
          reject(e);
        }
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    });
  };
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
