export const avg = (values) => values.reduce((sum, elt) => sum + elt, 0) / values.length;

export const generateId =
    () => new Array(12).fill().map(i => String.fromCharCode(Math.floor(Math.random() * 62 + 64))).join('');
