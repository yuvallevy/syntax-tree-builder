import React, { forwardRef } from 'react';
import { measureText } from './measureText';
import { flatMap } from 'lodash';
import { NodeTree, NodeId, PositionedNodeTree, PositionedNodeData } from './interfaces';
import { LABEL_WIDTH, LABEL_HEIGHT, LEVEL_HEIGHT, EDIT_TEXT_BOX_WIDTH } from './positioning';
import './ViewSvg.scss';

interface ViewSvgProps {
  nodes: NodeTree;
  sentence: string;
  selectedNodes: Set<NodeId> | null;
  editingNode: NodeId | null;
  positionedNodes: PositionedNodeTree;
  treeWidth: number;
  treeHeight: number;
  onNodesSelected: (nodeIds: NodeId[], multi: boolean) => void;
  onSelectionCleared: () => void;
  onNodeLabelChanged: (nodeId: NodeId, newValue: string) => void;
  ref: React.Ref<HTMLDivElement>;
}

/**
 * Returns an SVG path description corresponding to the given list of absolute coordinates.
 */
const svgPathD =
  (...points: [number, number][]) => 'M' + points.map(([x, y]) => `${x},${y}`).join('L') + 'Z';

/**
 * Renders a line from the given parent node to the given child node.
 */
const lineToChild = (parent: PositionedNodeData, child: PositionedNodeData) => <line
  key={child.id}
  className="tree-link"
  x1={parent.x}
  y1={parent.y + LABEL_HEIGHT}
  x2={child.x}
  y2={child.y}
/>;

/**
 * Renders a triangle between a leaf node and a slice.
 */
const triangleToSlice = (node: PositionedNodeData) => node.slice && node.sliceXSpan && <path
  key={node.slice.join(',')}
  className="tree-link"
  d={svgPathD(
    [node.x, node.y + LABEL_HEIGHT],
    [node.sliceXSpan[0], node.y + LEVEL_HEIGHT],
    [node.sliceXSpan[1], node.y + LEVEL_HEIGHT]
  )}
/>

/**
 * Renders a line between a leaf node and a slice.
 */
const lineToSlice = (node: PositionedNodeData) => node.slice && <line
  key={node.slice.join(',')}
  className="tree-link"
  x1={node.x}
  y1={node.y + LABEL_HEIGHT}
  x2={node.x}
  y2={node.y + LEVEL_HEIGHT}
/>

const ViewSvg: React.ForwardRefRenderFunction<HTMLDivElement, ViewSvgProps> = ({
  nodes, sentence, selectedNodes, editingNode, positionedNodes, treeWidth, treeHeight,
  onNodesSelected, onSelectionCleared, onNodeLabelChanged
}, ref) => {
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

  const renderNodes = () => Object.entries(positionedNodes).map(
    ([nodeId, node]) => editingNode !== nodeId && (
      <g
        key={nodeId}
        className={selectedNodes && selectedNodes.has(nodeId) ? 'node selected' : 'node'}
      >
        <rect
          x={Math.round(node.x - (LABEL_WIDTH / 2))} y={Math.round(node.y)}
          data-node-id={nodeId}
          width={LABEL_WIDTH} height={LABEL_HEIGHT}
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
    (node: PositionedNodeData) => node.children
      ? node.children.map(childId => lineToChild(node, positionedNodes[childId]))
      : node.triangle ? triangleToSlice(node) : lineToSlice(node)
  );

  const renderEditingNode = (): React.ReactNode => {
    const node: PositionedNodeData | null = editingNode ? positionedNodes[editingNode] : null;
    return node && <input
      type="text"
      className="node-edit-box"
      data-node-id={node.id}
      value={node.label}
      style={{
        left: node.x - (EDIT_TEXT_BOX_WIDTH / 2),
        top: node.y + treeHeight,
        width: EDIT_TEXT_BOX_WIDTH
      }}
      onChange={setNodeLabel}
      autoFocus={true}
    />;
  }

  return <div className="ViewSvg" ref={ref}>
    <svg width={treeWidth} height={treeHeight}>
      <g transform={`translate(0,${treeHeight})`}>
        {renderNodes()}
        {renderLinks()}
      </g>
    </svg>
    {editingNode && renderEditingNode()}
  </div>;
};

export default forwardRef(ViewSvg);
