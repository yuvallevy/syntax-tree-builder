import { NodeTree } from './interfaces';
import { redo, registerHistoryEntry, undo, UndoRedoHistory, UndoRedoHistoryEntry } from './undoRedoHistory';

describe.only('undo/redo history', () => {
  const nodes: NodeTree = {
    'abcde': {
      id: 'abcde',
      label: 'NP',
      offsetX: 0,
      offsetY: 0,
      children: ['fghij', 'klmno'],
    },
    'fghij': {
      id: 'fghij',
      label: 'Det',
      offsetX: 0,
      offsetY: 0,
      slice: [0, 3],
    },
    'klmno': {
      id: 'klmno',
      label: 'N',
      offsetX: 0,
      offsetY: 0,
      slice: [4, 8],
    },
  };

  const actions: UndoRedoHistoryEntry[] = [
    {
      type: 'editNode',
      timestamp: new Date(2021, 1, 22, 8, 4, 19, 576),
      nodeId: 'klmno',
      before: nodes['klmno'],
      after: {
        ...nodes['klmno'],
        slice: [4, 7],
      },
    },
    {
      type: 'editNode',
      timestamp: new Date(2021, 1, 22, 8, 4, 21, 135),
      nodeId: 'fghij',
      before: nodes['fghij'],
      after: {
        ...nodes['fghij'],
        label: 'D',
      },
    },
    {
      type: 'editNode',
      timestamp: new Date(2021, 1, 22, 8, 4, 23, 635),
      nodeId: 'klmno',
      before: {
        ...nodes['klmno'],
        slice: [4, 7],
      },
      after: nodes['klmno'],
    },
  ];

  const initialHistory: UndoRedoHistory = {
    undo: [],
    current: null,
    redo: [],
  };
  const historyAfterOneEvent: UndoRedoHistory = {
    undo: [],
    current: actions[0],
    redo: [],
  };
  const historyAfterTwoEvents: UndoRedoHistory = {
    undo: [actions[0]],
    current: actions[1],
    redo: [],
  };
  const historyAfterThreeEvents: UndoRedoHistory = {
    undo: [actions[1], actions[0]],
    current: actions[2],
    redo: [],
  };
  const historyAfterThreeEventsAndUndo: UndoRedoHistory = {
    undo: [actions[0]],
    current: actions[1],
    redo: [actions[2]],
  };

  it('registers a new event in an empty history object', () => {
    expect(registerHistoryEntry(initialHistory, actions[0]))
      .toEqual(historyAfterOneEvent);
  });

  it('registers a new event in a history object with past actions', () => {
    expect(registerHistoryEntry(historyAfterTwoEvents, actions[2]))
      .toEqual(historyAfterThreeEvents);
  });

  it('undoes an action', () => {
    expect(undo(historyAfterThreeEvents)).toEqual(historyAfterThreeEventsAndUndo);
  });

  it('redoes an undone action', () => {
    expect(redo(historyAfterThreeEventsAndUndo)).toEqual(historyAfterThreeEvents);
  });
});
