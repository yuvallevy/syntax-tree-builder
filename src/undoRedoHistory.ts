import { NodeData } from './interfaces';

const ACTION_GROUPING_INTERVAL_THRESHOLD = 400;

interface Change<T> {
  before: T;
  after: T;
}
type SingleNodeChange = Change<NodeData | null>;
type NodeSetChange = { [nodeId: string]: SingleNodeChange };
type SentenceChange = Change<string>;

const mergeNodeChanges = (earlier: NodeSetChange, later: NodeSetChange): NodeSetChange => {
  const mergedChangedNodes = { ...earlier };
  Object.entries(later).forEach(([nodeId, { before, after }]) => {
    mergedChangedNodes[nodeId] = {
      before: mergedChangedNodes[nodeId]?.before || before,
      after: after,
    };
  });
  return mergedChangedNodes;
};

const mergeSentenceChanges = (earlier?: SentenceChange, later?: SentenceChange): SentenceChange | undefined =>
  // if both changes exist, merge them
  earlier && later ? ({
    before: earlier.before,
    after: later.after,
  }) :
  // if only one exists, return it
  earlier || later ||
  // if no changes were made at all at either point in time, reflect that in the merged entry
  undefined;

export class UndoRedoHistoryEntry {
  timestamp: Date;

  constructor(
    readonly changedNodes: NodeSetChange,
    readonly changedSentence?: SentenceChange,
    timestamp?: Date,
  ) {
    this.timestamp = timestamp || new Date();
  }
  get timestampStr() {
    return this.timestamp?.toISOString();
  }

  /**
   * Returns this entry merged with a later one, with the "before" of this entry
   * and the "after" and timestamp of the given later entry.
   */
  merge(laterEntry: UndoRedoHistoryEntry): UndoRedoHistoryEntry {
    const mergedChangedNodes = mergeNodeChanges(this.changedNodes, laterEntry.changedNodes);
    const mergedChangedSentence = mergeSentenceChanges(this.changedSentence, laterEntry.changedSentence);
    return new UndoRedoHistoryEntry(
      mergedChangedNodes,
      mergedChangedSentence,
      laterEntry.timestamp,
    );
  }

  toString() {
    return `[${this.timestampStr}] `;
  }
}

export class UndoRedoHistory {
  constructor(
    readonly past: UndoRedoHistoryEntry[] = [],
    readonly present: UndoRedoHistoryEntry | null = null,
    readonly future: UndoRedoHistoryEntry[] = [],
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

  register(newEntry: UndoRedoHistoryEntry) {
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
