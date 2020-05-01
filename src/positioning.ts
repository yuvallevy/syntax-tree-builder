/** 
 * We assume that the tree is built bottom-up; i.e. the user starts by inputting the sentence to be analyzed, then
 * labels each part of speech and works their way up to the root of the tree.
 * In other words, parent nodes are defined after child nodes.
 * 
 * A leaf node (one at the bottom of the tree) corresponds to a word or phrase, which is defined as a "slice" of the
 * sentence (a range of character indices).
 * The X coordinate of such a node is derived by averaging the X coordinates, in pixels, of the beginning and end of
 * the slice. (We use measureText() to find said X coordinates.)
 * Conversely, a parent node's X coordinate is derived by averaging those of its children.
 * 
 * Leaf nodes also have "X spans", referring to where their respective slices begin and end. This is used for triangle
 * notation, which should span the entire phrase it corresponds to.
 * 
 * Finding Y coordinates is simpler, but somewhat counterintuitive: since we define the tree bottom-up, it is easier to
 * treat Y=0 as the "sentence level" and go up towards -Y, going as high as we need.
 * We can then easily find the height necessary to contain the tree by simply taking the minimum Y-coordinate, which
 * will necessarily be negative (assuming there are any nodes in the tree), negating that to get a positive value, then
 * using SVG transforms to translate the whole tree down by that amount, and assigning the height of the SVG element to
 * the same value.
 * Knowing this, we can derive the Y coordinates, assuming each "level" of the tree has a fixed height:
 *   - For a leaf node, the Y coordinate is simply the level height negated. This ensures that the bottom level will
 *     end at exactly Y=0.
 *   - For a parent node, the Y coordinate is the minimum of all Y coordinates of its children, minus the level height.
 * 
 * By repeating these computations recursively, we can derive exact coordinates for all nodes in the tree.
 * However, this can lead to repeated calculations: to find the coordinates of a parent node, we must also find the
 * coordinates of all of its child nodes. This means that some nodes' positions may be calculated more than once - more
 * or less depending on the iteration order. This problem is exacerbated by the fact that by default in JS, object
 * properties are iterated in insertion order, which in most cases will be bottom-up.
 * 
 * We solve this by using a set of simple caches: for any given tree, the position of a node always stays the same, so
 * once a node's position is calculated it can be stored for future reference. This guarantees that each coordinate
 * calculation will be done exactly once per node.
 * 
 * The recursive computation is triggered by calling one function, computeNodePositions(). The utility functions it
 * calls are recursive, but it is not a recursive function in itself, so it is guaranteed to be called only once per
 * tree. This way, invalidation of the caches is also well-defined: whenever computeNodePositions() is called, the
 * caches are cleared and prepared for use in the next computation without stale data.
 * 
 * When a leaf node is deleted and its parent node is left without any children, the parent does not "adopt" the slice
 * previously occupied by the leaf node. Instead, the parent node becomes "stranded", meaning it has neither children
 * nor a slice, and so has nothing to define its position by. These nodes are exempt from position cache invalidation.
 * (This may change in a future version.)
 */

import { NodeId, NodeTree, NodeData, PositionedNodeTree } from './interfaces';
import { measureText } from './measureText';
import { mean } from 'lodash';

type PositionCache = Map<NodeId, number>;
type SpanCache = Map<NodeId, [number, number]>;

export const LABEL_WIDTH = 28;
export const LABEL_HEIGHT = 22;
export const EDIT_TEXT_BOX_WIDTH = 32;
export const LEVEL_HEIGHT = 40;

// Position caches
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
  mean(children.map(childId => getNodeX(nodes, sentence, nodes[childId]) + nodes[childId].offsetX));

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
  Math.min(...children.map(childId => getNodeY(nodes, nodes[childId]) + nodes[childId].offsetY)) - LEVEL_HEIGHT;

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
 * @return {number}            Node's target X position.
 */
const getNodeX = (nodes: NodeTree, sentence: string, node: NodeData): number => {
  if (!xCache.has(node.id)) {
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
 * @return {number}            Node's X span, or null if node has no slice.
 */
const getNodeXSpan = (sentence: string, node: NodeData): [number, number] | null => {
  if (node.slice) {
    if (!xSpanCache.has(node.id)) {
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
 * @return {number}         Node's target Y position.
 */
const getNodeY = (nodes: NodeTree, node: NodeData): number => {
  if (!yCache.has(node.id)) {
    yCache.set(node.id, computeNodeY(nodes, node));
  }
  return yCache.get(node.id) || 0;
};

/**
 * Invalidates the position cache. Removes all nodes that should be recalculated or have been deleted.
 * Stranded nodes are kept.
 * @param {NodeTree} nodes Tree of nodes.
 */
const invalidateCaches = (nodes: NodeTree) => {
  // Remove deleted nodes from the cache
  for (const nodeId of Array.from(xCache.keys())) {
    if (!nodes[nodeId]) {
      xCache.delete(nodeId);
      yCache.delete(nodeId);
      xSpanCache.delete(nodeId);
    }
  }
  // Invalidate cached positions for all nodes except stranded ones
  for (const [nodeId, node] of Object.entries(nodes)) {
    if (node.children?.length || node.slice) {
      xCache.delete(nodeId);
      yCache.delete(nodeId);
      xSpanCache.delete(nodeId);
    }
  }
};

/**
 * Returns a copy of the given node tree with computed positions.
 * @param  {NodeTree}           nodes    Original tree of nodes.
 * @param  {string}             sentence Sentence to measure against.
 * @return {PositionedNodeTree}          Tree of nodes with exact positions.
 */
export const computeNodePositions = (nodes: NodeTree, sentence: string): PositionedNodeTree => {
  invalidateCaches(nodes);
  return Object.entries(nodes).reduce((positionedNodes, [id, node]) => ({
    ...positionedNodes,
    [id]: {
      ...node,
      x: getNodeX(nodes, sentence, node) + node.offsetX,
      y: getNodeY(nodes, node) + node.offsetY,
      naturalX: getNodeX(nodes, sentence, node),
      naturalY: getNodeY(nodes, node),
      sliceXSpan: getNodeXSpan(sentence, node)
    }
  }), {});
}

/**
 * Returns the total width necessary to accommodate the given node tree.
 * @param  {string} sentence Sentence to measure against.
 * @return {number}          Total target width of tree.
 */
export const computeTreeWidth = (sentence: string): number =>
  measureText(sentence);

/**
 * Returns the total height necessary to accommodate the given node tree.
 * @param  {PositionedNodeTree} positionedNodes Tree of nodes with exact positions.
 * @return {number}                             Total target height of tree.
 */
export const computeTreeHeight = (positionedNodes: PositionedNodeTree): number =>
  -Math.min(...Object.values(positionedNodes).map(node => node.y))
