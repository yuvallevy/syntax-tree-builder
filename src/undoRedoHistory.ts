import { NodeData, NodeId } from './interfaces';

const ACTION_GROUPING_INTERVAL_THRESHOLD = 400;

export abstract class BaseUndoRedoHistoryEntry {
  timestamp: Date;

  constructor(timestamp?: Date) {
    this.timestamp = timestamp || new Date();
  }

  /**
   * Returns this entry merged with a later one, with the "before" of this entry
   * and the "after" and timestamp of the given later entry.
   */
  abstract merge(laterEntry: BaseUndoRedoHistoryEntry): BaseUndoRedoHistoryEntry;

  get timestampStr() {
    return this.timestamp?.toISOString();
  }

  toString() {
    return `[${this.timestampStr}] `;
  }
}

export class NodeUndoRedoHistoryEntry extends BaseUndoRedoHistoryEntry {
  constructor(
    readonly changedNodes: {
      [nodeId: string]: {
        before: NodeData | null;
        after: NodeData | null;
      },
    },
    timestamp?: Date,
  ) {
    super(timestamp);
  }

  merge(laterEntry: NodeUndoRedoHistoryEntry): NodeUndoRedoHistoryEntry {
    const mergedChangedNodes = { ...this.changedNodes };
    Object.entries(laterEntry.changedNodes).forEach(([nodeId, { before, after }]) => {
      mergedChangedNodes[nodeId] = {
        before: mergedChangedNodes[nodeId]?.before || before,
        after: after,
      };
    });
    return new NodeUndoRedoHistoryEntry(
      mergedChangedNodes,
      laterEntry.timestamp,
    );
  }

  private changeToString(nodeId: NodeId, change: { before: NodeData | null; after: NodeData | null; }) {
    if (!change.before) return `add node ${nodeId}`;
    if (!change.after) return `delete node ${nodeId}`;
    return `edit node ${nodeId} from ${change.before?.label} to ${change.after?.label}`
  }

  toString() {
    return super.toString() +
      Object.entries(this.changedNodes).map(([nodeId, change]) => this.changeToString(nodeId, change)).join(', ');
  }
}

export class SentenceUndoRedoHistoryEntry extends BaseUndoRedoHistoryEntry {
  constructor(
    readonly before: string,
    readonly after: string,
    timestamp?: Date,
  ) {
    super(timestamp);
  }

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
    readonly past: BaseUndoRedoHistoryEntry[] = [],
    readonly present: BaseUndoRedoHistoryEntry | null = null,
    readonly future: BaseUndoRedoHistoryEntry[] = [],
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

  register(newEntry: BaseUndoRedoHistoryEntry) {
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
