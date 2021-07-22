import { deriveNodeDefinition } from '../smartNodeDef';

describe('smart node definition', () => {
  it('creates a parent node from one child node', () => {
    expect(deriveNodeDefinition('know the way', new Set(['jkl']), null)).toEqual({
      slice: undefined,
      children: ['jkl'],
    });
  });

  it('creates a parent node from two child nodes', () => {
    expect(deriveNodeDefinition('know the way', new Set(['jkl', 'mno']), null)).toEqual({
      slice: undefined,
      children: ['jkl', 'mno'],
    });
  });

  it('creates a parent node from a cursor position', () => {
    expect(deriveNodeDefinition('know the way', null, [6, 6])).toEqual({
      slice: [5, 8],
      triangle: false,
      children: undefined,
    });
  });

  it('creates a parent node from a selection within a word', () => {
    expect(deriveNodeDefinition('know the way', null, [1, 3])).toEqual({
      slice: [1, 3],
      triangle: false,
      children: undefined,
    });
  });

  it('creates a parent node from a selection crossing a word boundary', () => {
    expect(deriveNodeDefinition('know the way', null, [1, 6])).toEqual({
      slice: [1, 6],
      triangle: true,
      children: undefined,
    });
  });
});