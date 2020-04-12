export default (): string => new Array(12).fill(null).map(i => String.fromCharCode(Math.floor(Math.random() * 62 + 64))).join('');
