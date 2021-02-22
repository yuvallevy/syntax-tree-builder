import { NodeData, NodeId } from './interfaces';

interface BaseUndoRedoHistoryEntry {
  type: string;
  timestamp?: Date;
}

interface NodeUndoRedoHistoryEntry extends BaseUndoRedoHistoryEntry {
  type: 'editNode';
  nodeId: NodeId;
  before: NodeData | null;
  after: NodeData | null;
}

interface SentenceUndoRedoHistoryEntry extends BaseUndoRedoHistoryEntry {
  type: 'editSentence';
  before: string;
  after: string;
}

export type UndoRedoHistoryEntry = NodeUndoRedoHistoryEntry
  | SentenceUndoRedoHistoryEntry;

export interface UndoRedoHistory {
  undo: UndoRedoHistoryEntry[];
  current: UndoRedoHistoryEntry | null;
  redo: UndoRedoHistoryEntry[];
};

export const entryToString = (entry: UndoRedoHistoryEntry) => {
  const timestampStr = entry.timestamp?.toISOString();
  switch (entry.type) {
    case 'editNode':
      return `${timestampStr} edit node ${entry.nodeId}`;
    case 'editSentence':
      return `${timestampStr} edit sentence to "${entry.after}"`;
    default:
      return 'Unknown action';
  }
};

export const undo = (history: UndoRedoHistory): UndoRedoHistory => {
  if (history.current && history.undo) {
    return {
      undo: history.undo.slice(1),
      current: history.undo[0],
      redo: [history.current, ...history.redo],
    };
  }
  return history;
};

export const redo = (history: UndoRedoHistory): UndoRedoHistory => {
  if (history.current && history.redo) {
    return {
      undo: [history.current, ...history.undo],
      current: history.redo[0],
      redo: history.redo.slice(1),
    };
  }
  return history;
};

export const registerHistoryEntry = (history: UndoRedoHistory, action: UndoRedoHistoryEntry): UndoRedoHistory => {
  return {
    undo: history.current ? [history.current, ...history.undo] : history.undo,
    current: action,
    redo: [],
  }
};

const createHistoryEntry = (entry: UndoRedoHistoryEntry) => ({
  ...entry,
  timestamp: new Date(),
}) as UndoRedoHistoryEntry;

export const createNodeHistoryEntry = (nodeId: NodeId, before: NodeData | null, after: NodeData | null): UndoRedoHistoryEntry => createHistoryEntry({
  type: 'editNode',
  nodeId,
  before,
  after,
});

export const createSentenceHistoryEntry = (before: string, after: string): UndoRedoHistoryEntry => createHistoryEntry({
  type: 'editSentence',
  before,
  after,
});
