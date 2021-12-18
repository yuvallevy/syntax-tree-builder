import { NodeTree } from '../interfaces';
import { UndoRedoHistoryEntry, UndoRedoHistory } from '../undoRedoHistory';

describe('undo/redo history', () => {
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
  const sentence = 'The noun';

  const nodeActions = [
    new UndoRedoHistoryEntry(
      {
        klmno: {
          before: nodes['klmno'],
          after: { ...nodes['klmno'], slice: [4, 7] },
        },
      },
      undefined,
      new Date(2021, 1, 22, 8, 4, 19, 576),
    ),
    new UndoRedoHistoryEntry(
      {
        fghij: {
          before: nodes['fghij'],
          after: { ...nodes['fghij'], label: 'D' },
        },
      },
      undefined,
      new Date(2021, 1, 22, 8, 4, 21, 135),
    ),
    new UndoRedoHistoryEntry(
      {
        klmno: {
          before: { ...nodes['klmno'], slice: [4, 7] },
          after: nodes['klmno'],
        },
      },
      undefined,
      new Date(2021, 1, 22, 8, 4, 23, 635),
    ),
  ];

  const sentenceActions = [
    new UndoRedoHistoryEntry(
      {
        klmno: {
          before: nodes['klmno'],
          after: { ...nodes['klmno'], slice: [4, 10] },
        },
      },
      {
        before: 'The noun',
        after: 'The cookie',
      },
      new Date(2021, 1, 22, 8, 4, 19, 576),
    ),
    new UndoRedoHistoryEntry(
      {
        fghij: {
          before: nodes['fghij'],
          after: { ...nodes['fghij'], slice: [0, 1] },
        },
        klmno: {
          before: nodes['klmno'],
          after: { ...nodes['klmno'], slice: [2, 8] },
        },
      },
      {
        before: 'The cookie',
        after: 'A cookie',
      },
      new Date(2021, 1, 22, 8, 4, 20, 931),
    ),
  ]

  const initialHistory = new UndoRedoHistory();
  const historyAfterOneNodeChange = new UndoRedoHistory(
    [],
    nodeActions[0],
  );
  const historyAfterTwoNodeChanges = new UndoRedoHistory(
    [nodeActions[0]],
    nodeActions[1],
  );
  const historyAfterThreeNodeChanges = new UndoRedoHistory(
    [nodeActions[1], nodeActions[0]],
    nodeActions[2],
  );
  const historyAfterThreeNodeChangesAndUndo = new UndoRedoHistory(
    [nodeActions[0]],
    nodeActions[1],
    [nodeActions[2]],
  );

  const historyAfterOneSentenceChange = new UndoRedoHistory(
    [],
    sentenceActions[0],
  );
  const historyAfterTwoSentenceChanges = new UndoRedoHistory(
    [sentenceActions[0]],
    sentenceActions[1],
  );
  const historyAfterTwoSentenceChangesAndUndo = new UndoRedoHistory(
    [],
    sentenceActions[0],
    [sentenceActions[1]],
  );

  it('registers a new node change in an empty history object', () => {
    expect(initialHistory.register(nodeActions[0]))
      .toEqual(historyAfterOneNodeChange);
  });

  it('registers a new node change in a history object with past actions', () => {
    expect(historyAfterTwoNodeChanges.register(nodeActions[2]))
      .toEqual(historyAfterThreeNodeChanges);
  });

  it('registers a new sentence change in an empty history object', () => {
    expect(initialHistory.register(sentenceActions[0]))
      .toEqual(historyAfterOneSentenceChange);
  });

  it('registers a new sentence change in a history object with past actions', () => {
    expect(historyAfterOneSentenceChange.register(sentenceActions[1]))
      .toEqual(historyAfterTwoSentenceChanges);
  });

  it('undoes a node action', () => {
    expect(historyAfterThreeNodeChanges.undo()).toEqual(historyAfterThreeNodeChangesAndUndo);
  });

  it('redoes an undone node action', () => {
    expect(historyAfterThreeNodeChangesAndUndo.redo()).toEqual(historyAfterThreeNodeChanges);
  });

  it('undoes a sentence action', () => {
    expect(historyAfterTwoSentenceChanges.undo()).toEqual(historyAfterTwoSentenceChangesAndUndo);
  });

  it('redoes an undone sentence action', () => {
    expect(historyAfterTwoSentenceChangesAndUndo.redo()).toEqual(historyAfterTwoSentenceChanges);
  });
});
