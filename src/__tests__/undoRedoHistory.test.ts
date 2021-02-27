import { NodeTree } from '../interfaces';
import { NodeUndoRedoHistoryEntry, UndoRedoHistory, UndoRedoHistoryEntry } from '../undoRedoHistory';

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
    new NodeUndoRedoHistoryEntry(
      'klmno',
      nodes['klmno'],
      { ...nodes['klmno'], slice: [4, 7] },
      new Date(2021, 1, 22, 8, 4, 19, 576),
    ),
    new NodeUndoRedoHistoryEntry(
      'fghij',
      nodes['fghij'],
      { ...nodes['fghij'], label: 'D' },
      new Date(2021, 1, 22, 8, 4, 21, 135),
    ),
    new NodeUndoRedoHistoryEntry(
      'klmno',
      { ...nodes['klmno'], slice: [4, 7] },
      nodes['klmno'],
      new Date(2021, 1, 22, 8, 4, 23, 635),
    ),
  ];

  const initialHistory = new UndoRedoHistory();
  const historyAfterOneEvent = new UndoRedoHistory(
    [],
    actions[0]
  );
  const historyAfterTwoEvents = new UndoRedoHistory(
    [actions[0]],
    actions[1],
  );
  const historyAfterThreeEvents = new UndoRedoHistory(
    [actions[1], actions[0]],
    actions[2],
  );
  const historyAfterThreeEventsAndUndo = new UndoRedoHistory(
    [actions[0]],
    actions[1],
    [actions[2]],
  );

  it('registers a new event in an empty history object', () => {
    expect(initialHistory.register(actions[0]))
      .toEqual(historyAfterOneEvent);
  });

  it('registers a new event in a history object with past actions', () => {
    expect(historyAfterTwoEvents.register(actions[2]))
      .toEqual(historyAfterThreeEvents);
  });

  it('undoes an action', () => {
    expect(historyAfterThreeEvents.undo()).toEqual(historyAfterThreeEventsAndUndo);
  });

  it('redoes an undone action', () => {
    expect(historyAfterThreeEventsAndUndo.redo()).toEqual(historyAfterThreeEvents);
  });
});
