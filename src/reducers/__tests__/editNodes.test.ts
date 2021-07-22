import generateId from '../../generateId';
import { UndoRedoHistory } from '../../undoRedoHistory';
import { addNode, deleteNodes, setNodeLabel, toggleTriangle } from '../editNodes';
import { EditorState } from '../interfaces';

jest.mock('../../generateId', () => jest.fn().mockReturnValue('pqr'));
jest.mock('../smartNodeDef', () => ({
  deriveNodeDefinition: jest.fn().mockReturnValueOnce({
    slice: undefined,
    children: ['jkl'],
  }).mockReturnValueOnce({
    slice: undefined,
    children: ['jkl', 'mno'],
  }).mockReturnValueOnce({
    slice: [0, 4],
    triangle: false,
    children: undefined,
  }).mockReturnValueOnce({
    slice: [6, 11],
    triangle: true,
    children: undefined,
  }),
}));

describe('adding nodes', () => {
  const initialState: EditorState = {
    nodes: {
      'jkl': {
        id: 'jkl',
        label: 'Det',
        offsetX: 0,
        offsetY: 0,
        triangle: false,
        slice: [5, 8],
      },
      'mno': {
        id: 'mno',
        label: 'N',
        offsetX: 0,
        offsetY: 0,
        triangle: false,
        slice: [9, 12],
      },
    },
    sentence: 'know the way',
    selectedNodes: null,
    selectedRange: null,
    unselectableNodes: null,
    adoptingNode: null,
    disowningNode: null,
    editingNode: null,
    undoRedoHistory: new UndoRedoHistory(),
  };

  const stateWithOneNodeSelected = {
    ...initialState,
    selectedNodes: new Set(['jkl']),
  };

  const stateWithTwoNodesSelected = {
    ...initialState,
    selectedNodes: new Set(['jkl', 'mno']),
  };

  const stateWithCursor = {
    ...initialState,
    selectedRange: [2, 2] as [number, number],
  };

  const stateWithSelection = {
    ...initialState,
    selectedRange: [6, 11] as [number, number],
  };

  const stateInEditMode = {
    ...stateWithOneNodeSelected,
    editingNode: 'jkl',
  }

  it('creates a parent node from one child node', () => {
    expect(addNode(stateWithOneNodeSelected)).toMatchObject({
      nodes: {
        'pqr': {
          id: 'pqr',
          label: '',
          offsetX: 0,
          offsetY: 0,
          children: ['jkl'],
        },
      },
    });
  });

  it('creates a parent node from two child nodes', () => {
    expect(addNode(stateWithTwoNodesSelected)).toMatchObject({
      nodes: {
        'pqr': {
          id: 'pqr',
          label: '',
          offsetX: 0,
          offsetY: 0,
          children: ['jkl', 'mno'],
        },
      },
    });
  });

  it('creates a parent node from a cursor position', () => {
    expect(addNode(stateWithCursor)).toMatchObject({
      nodes: {
        'pqr': {
          id: 'pqr',
          label: '',
          offsetX: 0,
          offsetY: 0,
          slice: [0, 4],
          triangle: false,
        },
      },
    });
  });

  it('creates a parent node from a selection', () => {
    expect(addNode(stateWithSelection)).toMatchObject({
      nodes: {
        'pqr': {
          id: 'pqr',
          label: '',
          offsetX: 0,
          offsetY: 0,
          slice: [6, 11],
          triangle: true,
        },
      },
    });
  });

  it('sets the label of a node', () => {
    expect(setNodeLabel(stateInEditMode, 'D')).toMatchObject({
      nodes: {
        'jkl': {
          id: 'jkl',
          label: 'D',
          offsetX: 0,
          offsetY: 0,
          slice: [5, 8],
          triangle: false,
        },
      },
    });
  });

  it('toggles triangle terminal notation for a node', () => {
    expect(toggleTriangle(stateWithOneNodeSelected, true)).toMatchObject({
      nodes: {
        'jkl': {
          id: 'jkl',
          label: 'Det',
          offsetX: 0,
          offsetY: 0,
          slice: [5, 8],
          triangle: true,
        },
      },
    });
  });

  it('deletes a selected node', () => {
    expect(Object.keys(deleteNodes(stateWithOneNodeSelected).nodes)).toEqual(
      ['mno']
    );
  });

  it('deletes multiple selected nodes', () => {
    expect(Object.keys(deleteNodes(stateWithTwoNodesSelected).nodes)).toEqual(
      []
    );
  });
});
