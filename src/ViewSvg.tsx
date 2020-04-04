import React, { useState, useEffect, useRef } from 'react';
import { measureText } from './measureText';
import { avg } from './utils';
import { flatMap } from 'lodash';
import { NodeTree, NodeData, NodeId } from './interfaces';
import './ViewSvg.scss';

interface ViewSvgProps {
  nodes: NodeTree;
  sentence: string;
  selectedNodes: Set<NodeId> | null;
  editingNode: NodeId | null;
  onNodesSelected: (nodeIds: NodeId[], multi: boolean) => void;
  onSelectionCleared: () => void;
  onNodeLabelChanged: (nodeId: NodeId, newValue: string) => void;
}

interface PositionedNodeData extends NodeData {
  x: number;
  y: number;
}

interface PositionedNodeTree {
  [nodeId: string]: PositionedNodeData;
}

type PositionCache = Map<NodeId, number>;

interface ViewSvgState {
  positionedNodes: PositionedNodeTree
}

const xCache: PositionCache = new Map();
const yCache: PositionCache = new Map();

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
 * Calculates the X position of a node with the given children.
 * @param  {NodeTree} nodes    Tree of nodes.
 * @param  {string}   sentence Sentence to measure against.
 * @param  {NodeId[]} children List of children.
 * @return {number}            Node's target X position.
 */
const computeXByChildren = (nodes: NodeTree, sentence: string, children: NodeId[]) =>
  avg(children.map(childId => getNodeX(nodes, sentence, nodes[childId])));

/**
 * Calculates the X position of the given node.
 * @param  {NodeTree} nodes    Tree of nodes.
 * @param  {string}   sentence Sentence to measure against.
 * @param  {NodeData} node     Node to position.
 * @return {number}            Node's target X position.
 */
const computeNodeX = (nodes: NodeTree, sentence: string, node: NodeData) =>
  node.slice ? computeXBySlice(sentence, ...node.slice)
    : node.children ? computeXByChildren(nodes, sentence, node.children)
      : 0;

/**
 * Calculates the Y position of a node with the given children.
 * @param  {NodeTree} nodes    Tree of nodes.
 * @param  {NodeId[]} children List of children.
 * @return {number}            Node's target Y position.
 */
const computeYByChildren = (nodes: NodeTree, children: NodeId[]) =>
  Math.min(...children.map(childId => getNodeY(nodes, nodes[childId]))) - 40;

/**
 * Calculates the Y position of the given node.
 * @param  {NodeTree} nodes Tree of nodes.
 * @param  {NodeData} node  Node to position.
 * @return {number}         Node's target Y position.
 */
const computeNodeY = (nodes: NodeTree, node: NodeData) => node.slice ? 178
  : node.children ? computeYByChildren(nodes, node.children)
    : 0;

/**
 * Returns the X position of the given node and caches the result, or retrieves it if it is already cached.
 * @param  {NodeTree} nodes    Tree of nodes.
 * @param  {string}   sentence Sentence to measure against.
 * @param  {NodeData} node     Node to position.
 * @return {number}            Node's target X position.
 */
const getNodeX = (nodes: NodeTree, sentence: string, node: NodeData): number => {
  if (!xCache.has(node.id)) {
    xCache.set(node.id, computeNodeX(nodes, sentence, node));
  }
  return xCache.get(node.id) || 0;
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
 * Returns a copy of the given node tree with computed positions.
 * @param  {NodeTree}           nodes    Original tree of nodes.
 * @param  {string}             sentence Sentence to measure against.
 * @return {PositionedNodeTree}          Tree of nodes with exact positions.
 */
const computeNodePositions = (nodes: NodeTree, sentence: string): PositionedNodeTree => {
  xCache.clear();
  yCache.clear();
  return Object.entries(nodes).reduce((positionedNodes, [id, node]) => ({
    ...positionedNodes,
    [id]: {
      ...node,
      x: getNodeX(nodes, sentence, node),
      y: getNodeY(nodes, node)
    }
  }), {});
}

const ViewSvg: React.FC<ViewSvgProps> = ({ nodes, sentence, selectedNodes, editingNode, onNodesSelected, onSelectionCleared, onNodeLabelChanged }) => {
  const [positionedNodes, setPositionedNodes] = useState<PositionedNodeTree>({});
  const [selecting, setSelecting] = useState<boolean>(false);
  const [boxSelectionStart, setBoxSelectionStart] = useState<[number, number] | null>();
  const [boxSelectionEnd, setBoxSelectionEnd] = useState<[number, number] | null>();
  const viewSvgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('useEffect - nodes, sentence', nodes);
    setPositionedNodes(computeNodePositions(nodes, sentence));
  }, [nodes, sentence]);

  /**
   * Sets a node as selected.
   * @param event Event that triggered the selection.
   */
  const selectNode = (event: React.MouseEvent<SVGElement> | React.TouchEvent<SVGElement>) => {
    const { nodeId } = event.currentTarget.dataset;
    if (nodeId) {
      onNodesSelected([nodeId], event.ctrlKey || event.shiftKey);
    }
  };

  /**
   * Sets a node's label.
   * @param event Event that triggered the update.
   */
  const setNodeLabel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { nodeId } = event.currentTarget.dataset;
    if (nodeId) {
      onNodeLabelChanged(nodeId, event.currentTarget.value);
    }
  }

  const initiateBoxSelection = (event: React.MouseEvent<SVGElement> | React.TouchEvent<SVGElement>) => {
    if (viewSvgRef.current && (event.target as Element).tagName === 'svg') {
      let x = 0;
      let y = 0;
      if ('clientX' in event) {
        x = event.clientX - viewSvgRef.current.offsetLeft;
        y = event.clientY - viewSvgRef.current.offsetTop;
      } else if ('targetTouches' in event) {  // TODO: Does this work?
        x = event.targetTouches[0].clientX - viewSvgRef.current.offsetLeft;
        y = event.targetTouches[0].clientY - viewSvgRef.current.offsetTop;
      }
      onSelectionCleared();
      setBoxSelectionStart([x, y]);
      setBoxSelectionEnd(null);
      setSelecting(true);
    }
  };

  const updateBoxSelection = (event: React.MouseEvent<SVGElement> | React.TouchEvent<SVGElement>) => {
    event.preventDefault();
    if (selecting && viewSvgRef.current) {
      if ('clientX' in event) {
        setBoxSelectionEnd([
          event.clientX - viewSvgRef.current.offsetLeft,
          event.clientY - viewSvgRef.current.offsetTop
        ]);
      } else if ('targetTouches' in event) {  // TODO: Does this work?
        setBoxSelectionEnd([
          event.targetTouches[0].clientX - viewSvgRef.current.offsetLeft,
          event.targetTouches[0].clientY - viewSvgRef.current.offsetTop
        ]);
      }
    }
  };

  const finishBoxSelection = (event: React.MouseEvent<SVGElement> | React.TouchEvent<SVGElement>) => {
    setSelecting(false);
    if (boxSelectionStart && boxSelectionEnd) {
      const x1 = Math.min(boxSelectionStart[0], boxSelectionEnd[0]);
      const y1 = Math.min(boxSelectionStart[1], boxSelectionEnd[1]);
      const x2 = Math.max(boxSelectionStart[0], boxSelectionEnd[0]);
      const y2 = Math.max(boxSelectionStart[1], boxSelectionEnd[1]);
      onNodesSelected(Object.values(positionedNodes)
      .filter((node) => node.x > x1 && node.x < x2 && node.y > y1 && node.y < y2)
      .map((node) => node.id), false);
      setBoxSelectionStart(null);
      setBoxSelectionEnd(null);
    }
  };

  const renderNodes = () => Object.entries(positionedNodes).map(
    ([nodeId, node]) => (
      <g
        key={nodeId}
        className={selectedNodes && selectedNodes.has(nodeId) ? 'node selected' : 'node'}
      >
        <rect
          x={Math.round(node.x - 14)} y={Math.round(node.y)}
          data-node-id={nodeId}
          width={28} height={22}
          onMouseDown={selectNode}
          onTouchStart={selectNode}
        />
        <text
          x={node.x} y={node.y}
          data-node-id={nodeId}
          onMouseDown={selectNode}
          onTouchStart={selectNode}
        >
          {node.label}
        </text>
      </g>
    )
  );

  const renderLinks = () => flatMap(Object.values(positionedNodes),
    (node: PositionedNodeData) => node.children ? node.children.map(childId => {
      const child: PositionedNodeData = positionedNodes[childId];
      return <line
        key={childId}
        className="tree-link"
        x1={node.x}
        y1={node.y + 22}
        x2={child.x}
        y2={child.y}
      />;
    }) : []
  );

  const renderEditingNode = (): React.ReactNode => {
    const node: PositionedNodeData | null = editingNode ? positionedNodes[editingNode] : null;
    return node && <input
      type="text"
      className="node-edit-box"
      data-node-id={node.id}
      value={node.label}
      style={{
        left: node.x - 16,
        top: node.y,
        width: 32
      }}
      onChange={setNodeLabel}
      autoFocus={true}
    />;
  }

  const renderSelectionBox = (): React.ReactNode => {
    if (selecting && boxSelectionStart && boxSelectionEnd) {
      const x1 = Math.min(boxSelectionStart[0], boxSelectionEnd[0]);
      const y1 = Math.min(boxSelectionStart[1], boxSelectionEnd[1]);
      const x2 = Math.max(boxSelectionStart[0], boxSelectionEnd[0]);
      const y2 = Math.max(boxSelectionStart[1], boxSelectionEnd[1]);
      const width = x2 - x1;
      const height = y2 - y1;
      return <rect className="selection-box" x={x1} y={y1} width={width} height={height} />
    }
    return false;
  };

  return <div className="ViewSvg" ref={viewSvgRef}>
    <svg width={measureText(sentence)} height={200}
      onMouseDown={initiateBoxSelection}
      onMouseMove={updateBoxSelection}
      onMouseUp={finishBoxSelection}>
      {renderNodes()}
      {renderLinks()}
      {renderSelectionBox()}
    </svg>
    {editingNode && renderEditingNode()}
  </div>;
};

export default ViewSvg;
