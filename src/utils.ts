export const avg = (values: number[]) => values.reduce((sum, elt) => sum + elt, 0) / values.length;

export const generateId =
    (): string => new Array(12).fill(null).map(i => String.fromCharCode(Math.floor(Math.random() * 62 + 64))).join('');

export const svgPathD =
    (...points: [number, number][]) => 'M' + points.map(([x, y]) => `${x},${y}`).join('L') + 'Z';
