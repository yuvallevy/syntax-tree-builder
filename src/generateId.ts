/**
 * Generates a random string ID 12 characters long,
 * consisting of a combination of uppercase and lowercase letters, @, [, \, ], ^, _, `, {, |, and }.
 */
export default (): string => new Array(12).fill(null).map(i => String.fromCharCode(Math.floor(Math.random() * 62 + 64))).join('');
