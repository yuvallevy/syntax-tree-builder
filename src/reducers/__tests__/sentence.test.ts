import { UndoRedoHistory } from '../../undoRedoHistory';
import { setSentence } from '../sentence';
import { EditorState } from '../interfaces';

describe('editing a sentence', () => {
  const initialState: EditorState = {
    nodes: {
      'abc': {
        id: 'abc',
        label: 'VP',
        offsetX: 0,
        offsetY: 0,
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
        offsetY: 0,
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
    selectedNodes: null,
    selectedRange: [8, 8],
    unselectableNodes: null,
    adoptingNode: null,
    disowningNode: null,
    editingNode: null,
    undoRedoHistory: new UndoRedoHistory(),
  };

  it('sets the sentence', () => {
    expect(setSentence(initialState, 'know their way')).toMatchObject({
      sentence: 'know their way',
    });
  });

  it('tweaks node slices accordingly when the sentence changes', () => {
    expect(setSentence(initialState, 'know their way')).toMatchObject({
      nodes: {
        'def': {
          slice: [0, 4],
        },
        'jkl': {
          slice: [5, 10],
        },
        'mno': {
          slice: [11, 14],
        },
      },
    });
  });
});
