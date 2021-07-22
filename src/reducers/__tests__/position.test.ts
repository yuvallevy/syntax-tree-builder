import { UndoRedoHistory } from '../../undoRedoHistory';
import { EditorState } from '../interfaces';
import { moveNodes, resetNodePositions } from '../position';

describe('moving nodes', () => {
  const initialState: EditorState = {
    nodes: {
      'abc': {
        id: 'abc',
        label: 'VP',
        offsetX: 0,
        offsetY: 2,
        children: ['def', 'ghi'],
      },
      'def': {
        id: 'def',
        label: 'V',
        offsetX: 0,
        offsetY: 0,
        slice: [0, 4],
      },
      'ghi': {
        id: 'ghi',
        label: 'NP',
        offsetX: 0,
        offsetY: 2,
        children: ['jkl', 'mno'],
      },
      'jkl': {
        id: 'jkl',
        label: 'Det',
        offsetX: 0,
        offsetY: 0,
        slice: [5, 8],
      },
      'mno': {
        id: 'mno',
        label: 'N',
        offsetX: 0,
        offsetY: 0,
        slice: [9, 12],
      },
    },
    sentence: 'know the way',
    selectedNodes: new Set(['abc', 'ghi']),
    selectedRange: null,
    unselectableNodes: null,
    adoptingNode: null,
    disowningNode: null,
    editingNode: null,
    undoRedoHistory: new UndoRedoHistory(),
  };

  it('sets node positions', () => {
    expect(moveNodes(initialState, 1, 4)).toMatchObject({
      nodes: {
        ...initialState.nodes,
        'abc': {
          id: 'abc',
          label: 'VP',
          offsetX: 1,
          offsetY: 6,
          children: ['def', 'ghi'],
        },
        'ghi': {
          id: 'ghi',
          label: 'NP',
          offsetX: 1,
          offsetY: 6,
          children: ['jkl', 'mno'],
        },
      },
    });
  });

  it('resets node positions', () => {
    expect(resetNodePositions(initialState)).toMatchObject({
      nodes: {
        ...initialState.nodes,
        'abc': {
          id: 'abc',
          label: 'VP',
          offsetX: 0,
          offsetY: 0,
          children: ['def', 'ghi'],
        },
        'ghi': {
          id: 'ghi',
          label: 'NP',
          offsetX: 0,
          offsetY: 0,
          children: ['jkl', 'mno'],
        },
      },
    });
  });
});
