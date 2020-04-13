import { NodeId, NodeTree, NodeData, PositionedNodeTree } from './interfaces';
import { measureText } from './measureText';
import { mean } from 'lodash';

type PositionCache = Map<NodeId, number>;
type SpanCache = Map<NodeId, [number, number]>;

export const LABEL_WIDTH = 28
export const LABEL_HEIGHT = 22
export const EDIT_TEXT_BOX_WIDTH = 32
export const LEVEL_HEIGHT = 40

const xCache: PositionCache = new Map();
const yCache: PositionCache = new Map();
const xSpanCache: SpanCache = new Map();

/**
 * Calculates the X position of a leaf node corresponding to the given sentence slice.
 * @param  {string} sentence Sentence to measure against.
 * @param  {number} start    Start position of the slice (inclusive).
 * @param  {number} end      End position of the slice (exclusive).
 * @return {number}          Node's target X position.
 */
const computeXBySlice = (sentence: string, start: number, end: number): number =>
  measureText(sentence.slice(0, start)) + (measureText(sentence.slice(start, end)) / 2);

/**
 * Calculates the X positions of the edges of the given sentence slice.
 * @param  {string} sentence Sentence to measure against.
 * @param  {number} start    Start position of the slice (inclusive).
 * @param  {number} end      End position of the slice (exclusive).
 * @return {number}          Slice start and end X positions.
 */
const computeSliceXSpan = (sentence: string, start: number, end: number): [number, number] =>
  [measureText(sentence.slice(0, start)), measureText(sentence.slice(0, end))];

/**
 * Calculates the X position of a node with the given children.
 * @param  {NodeTree} nodes    Tree of nodes.
 * @param  {string}   sentence Sentence to measure against.
 * @param  {NodeId[]} children List of children.
 * @return {number}            Node's target X position.
 */
const computeXByChildren = (nodes: NodeTree, sentence: string, children: NodeId[]) =>
  mean(children.map(childId => getNodeX(nodes, sentence, nodes[childId])));

/**
 * Calculates the X position of the given node.
 * @param  {NodeTree} nodes    Tree of nodes.
 * @param  {string}   sentence Sentence to measure against.
 * @param  {NodeData} node     Node to position.
 * @return {number}            Node's target X position.
 */
const computeNodeX = (nodes: NodeTree, sentence: string, node: NodeData) =>
  node.slice ? computeXBySlice(sentence, ...node.slice)
    : node.children && node.children.length ? computeXByChildren(nodes, sentence, node.children)
      : 0;

/**
 * Calculates the Y position of a node with the given children.
 * @param  {NodeTree} nodes    Tree of nodes.
 * @param  {NodeId[]} children List of children.
 * @return {number}            Node's target Y position.
 */
const computeYByChildren = (nodes: NodeTree, children: NodeId[]) =>
  Math.min(...children.map(childId => getNodeY(nodes, nodes[childId]))) - LEVEL_HEIGHT;

/**
 * Calculates the Y position of the given node.
 * @param  {NodeTree} nodes Tree of nodes.
 * @param  {NodeData} node  Node to position.
 * @return {number}         Node's target Y position.
 */
const computeNodeY = (nodes: NodeTree, node: NodeData) => node.slice ? -LEVEL_HEIGHT
  : node.children && node.children.length ? computeYByChildren(nodes, node.children)
    : -LEVEL_HEIGHT;

/**
 * Returns the X position of the given node and caches the result, or retrieves it if it is already cached.
 * @param  {NodeTree} nodes    Tree of nodes.
 * @param  {string}   sentence Sentence to measure against.
 * @param  {NodeData} node     Node to position.
 * @param  {boolean}  invalidateCache Whether to invalidate the position cache (usually because the data has changed).
 * @return {number}            Node's target X position.
 */
const getNodeX = (nodes: NodeTree, sentence: string, node: NodeData, invalidateCache: boolean = false): number => {
  if (invalidateCache || !xCache.has(node.id)) {
    const targetX = computeNodeX(nodes, sentence, node);
    if (targetX) {
      xCache.set(node.id, targetX);
    }
  }
  return xCache.get(node.id) || 0;
};

/**
 * Returns the X span of the given node and caches the result, or retrieves it if it is already cached.
 * @param  {string}   sentence Sentence to measure against.
 * @param  {NodeData} node     Node to operate on.
 * @param  {boolean}  invalidateCache Whether to invalidate the position cache (usually because the data has changed).
 * @return {number}            Node's X span, or null if node has no slice.
 */
const getNodeXSpan = (sentence: string, node: NodeData, invalidateCache: boolean = false): [number, number] | null => {
  if (node.slice) {
    if (invalidateCache || !xSpanCache.has(node.id)) {
      xSpanCache.set(node.id, computeSliceXSpan(sentence, ...node.slice));
    }
    return xSpanCache.get(node.id) || [0, 0];
  }
  return null;
};

/**
 * Returns the Y position of the given node and caches the result, or retrieves it if it is already cached.
 * @param  {NodeTree} nodes Tree of nodes.
 * @param  {NodeData} node  Node to position.
 * @param  {boolean}  invalidateCache Whether to invalidate the position cache (usually because the data has changed).
 * @return {number}         Node's target Y position.
 */
const getNodeY = (nodes: NodeTree, node: NodeData, invalidateCache: boolean = false): number => {
  if (invalidateCache || !yCache.has(node.id)) {
    yCache.set(node.id, computeNodeY(nodes, node));
  }
  return yCache.get(node.id) || 0;
};

/**
 * Returns a copy of the given node tree with computed positions.
 * @param  {NodeTree}           nodes    Original tree of nodes.
 * @param  {string}             sentence Sentence to measure against.
 * @return {PositionedNodeTree}          Tree of nodes with exact positions.
 */
export const computeNodePositions = (nodes: NodeTree, sentence: string): PositionedNodeTree => {
  return Object.entries(nodes).reduce((positionedNodes, [id, node]) => ({
    ...positionedNodes,
    [id]: {
      ...node,
      x: getNodeX(nodes, sentence, node, true),
      y: getNodeY(nodes, node, true),
      sliceXSpan: getNodeXSpan(sentence, node, true)
    }
  }), {});
}

/**
 * Returns the total height necessary to accommodate the given node tree.
 * @param  {PositionedNodeTree} positionedNodes Tree of nodes with exact positions.
 * @return {number}                             Total target height of tree.
 */
export const computeTreeHeight = (positionedNodes: PositionedNodeTree): number =>
  -Math.min(...Object.values(positionedNodes).map(node => node.y))