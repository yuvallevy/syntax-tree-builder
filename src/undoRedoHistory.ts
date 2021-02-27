import { NodeData, NodeId } from './interfaces';

type UndoRedoHistoryEntryType = 'editNode'
  | 'editSentence';

abstract class BaseUndoRedoHistoryEntry {
  abstract type: UndoRedoHistoryEntryType;
  timestamp: Date;

  constructor(timestamp: Date | undefined) {
    this.timestamp = timestamp || new Date();
  }

  get timestampStr() {
    return this.timestamp?.toISOString();
  }

  toString() {
    return `[${this.timestampStr}] `;
  }
}

export class NodeUndoRedoHistoryEntry extends BaseUndoRedoHistoryEntry {
  readonly type = 'editNode';

  constructor(
    readonly nodeId: NodeId,
    readonly before: NodeData | null,
    readonly after: NodeData | null,
    timestamp?: Date,
  ) {
    super(timestamp);
  }

  toString() {
    return super.toString() + `edit node ${this.nodeId} from ${this.before?.label} to ${this.after?.label}`;
  }
}

export class SentenceUndoRedoHistoryEntry extends BaseUndoRedoHistoryEntry {
  readonly type = 'editSentence';

  constructor(
    readonly before: string,
    readonly after: string,
    timestamp?: Date,
  ) {
    super(timestamp);
  }

  toString() {
    return super.toString() + `edit sentence to "${this.after}"`;
  }
}

export type UndoRedoHistoryEntry = NodeUndoRedoHistoryEntry
  | SentenceUndoRedoHistoryEntry;

export class UndoRedoHistory {
  constructor(
    readonly past: UndoRedoHistoryEntry[] = [],
    readonly present: UndoRedoHistoryEntry | null = null,
    readonly future: UndoRedoHistoryEntry[] = [],
  ) {}

  undo(): UndoRedoHistory {
    if (this.present && this.past) {
      return new UndoRedoHistory(
        this.past.slice(1),
        this.past[0],
        [this.present, ...this.future],
      );
    }
    return this;
  }

  redo(): UndoRedoHistory {
    if (this.future) {
      return new UndoRedoHistory(
        this.present ? [this.present, ...this.past] : this.past,
        this.future[0],
        this.future.slice(1),
      );
    }
    return this;
  }

  register(entry: UndoRedoHistoryEntry) {
    return new UndoRedoHistory(
      this.present ? [this.present, ...this.past] : this.past,
      entry,
    )
  }
};
