import { NodeData, NodeId } from './interfaces';

const ACTION_GROUPING_INTERVAL_THRESHOLD = 400;

abstract class BaseUndoRedoHistoryEntry<T> {
  before: T;
  after: T;
  timestamp: Date;

  constructor(before: T, after: T, timestamp?: Date) {
    this.before = before;
    this.after = after;
    this.timestamp = timestamp || new Date();
  }

  /**
   * Returns this entry merged with a later one, with the "before" of this entry
   * and the "after" and timestamp of the given later entry.
   */
  abstract merge(laterEntry: BaseUndoRedoHistoryEntry<T>): BaseUndoRedoHistoryEntry<T>;

  get timestampStr() {
    return this.timestamp?.toISOString();
  }

  toString() {
    return `[${this.timestampStr}] `;
  }
}

export class NodeUndoRedoHistoryEntry extends BaseUndoRedoHistoryEntry<NodeData | null> {
  constructor(
    readonly nodeId: NodeId,
    before: NodeData | null,
    after: NodeData | null,
    timestamp?: Date,
  ) {
    super(before, after, timestamp);
  }

  merge(laterEntry: NodeUndoRedoHistoryEntry): NodeUndoRedoHistoryEntry {
    return new NodeUndoRedoHistoryEntry(
      this.nodeId,
      this.before,
      laterEntry.after,
      laterEntry.timestamp,
    );
  }

  toString() {
    return super.toString() + `edit node ${this.nodeId} from ${this.before?.label} to ${this.after?.label}`;
  }
}

export class SentenceUndoRedoHistoryEntry extends BaseUndoRedoHistoryEntry<string> {
  merge(laterEntry: SentenceUndoRedoHistoryEntry): SentenceUndoRedoHistoryEntry {
    return new SentenceUndoRedoHistoryEntry(
      this.before,
      laterEntry.after,
      laterEntry.timestamp,
    );
  }

  toString() {
    return super.toString() + `edit sentence to "${this.after}"`;
  }
}

export class UndoRedoHistory {
  constructor(
    readonly past: BaseUndoRedoHistoryEntry<NodeData | string | null>[] = [],
    readonly present: BaseUndoRedoHistoryEntry<NodeData | string | null> | null = null,
    readonly future: BaseUndoRedoHistoryEntry<NodeData | string | null>[] = [],
  ) {}

  canUndo(): boolean { return !!this.present || this.past.length > 0; }
  canRedo(): boolean { return this.future.length > 0; }

  undo(): UndoRedoHistory {
    if (this.canUndo()) {
      return new UndoRedoHistory(
        this.past.slice(1),
        this.past[0],
        this.present ? [this.present, ...this.future] : this.future,
      );
    }
    return this;
  }

  redo(): UndoRedoHistory {
    if (this.canRedo()) {
      return new UndoRedoHistory(
        this.present ? [this.present, ...this.past] : this.past,
        this.future[0],
        this.future.slice(1),
      );
    }
    return this;
  }

  register(newEntry: BaseUndoRedoHistoryEntry<NodeData | string | null>) {
    // If the last registered action (i.e. what was the present until now) was a very short time ago,
    // and was of the same type, merge the actions together so they can be undone/redone as one.
    if (this.present?.constructor === newEntry.constructor &&
      newEntry.timestamp.valueOf() - this.present.timestamp.valueOf() < ACTION_GROUPING_INTERVAL_THRESHOLD) {
        return new UndoRedoHistory(
          this.past,
          this.present.merge(newEntry),
        );
      }
    return new UndoRedoHistory(
      this.present ? [this.present, ...this.past] : this.past,
      newEntry,
    );
  }
};
