import { NodeTree, NodeId } from '../interfaces';
import { UndoRedoHistory } from '../undoRedoHistory';

export interface EditorState {
  nodes: NodeTree;
  sentence: string;
  selectedRange: [number, number] | null;
  selectedNodes: Set<NodeId> | null;
  unselectableNodes: Set<NodeId> | null;
  adoptingNode: NodeId | null;
  disowningNode: NodeId | null;
  editingNode: NodeId | null;
  undoRedoHistory: UndoRedoHistory;
}

export type EditorAction = { type: 'setSentence'; newSentence: string; }
  | { type: 'selectText'; start: number; end: number; }
  | { type: 'selectNode'; nodeIds: NodeId[]; multi: boolean; }
  | { type: 'clearSelection'; }
  | { type: 'addNode'; }
  | { type: 'toggleEditMode'; }
  | { type: 'toggleAdoptMode'; }
  | { type: 'toggleDisownMode'; }
  | { type: 'deleteNodes'; }
  | { type: 'toggleTriangle'; newValue: boolean; }
  | { type: 'setLabel'; newValue: string; }
  | { type: 'moveNodes'; dx: number; dy: number; }
  | { type: 'resetNodePositions' }
  | { type: 'undo' }
  | { type: 'redo' };
