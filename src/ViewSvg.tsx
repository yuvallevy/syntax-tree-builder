import React, { forwardRef } from 'react';
import { flatMap } from 'lodash';
import { NodeId, PositionedNodeTree, PositionedNodeData } from './interfaces';
import { LABEL_WIDTH, LABEL_HEIGHT, LEVEL_HEIGHT, EDIT_TEXT_BOX_WIDTH } from './positioning';
import './ViewSvg.scss';

interface ViewSvgProps {
  selectedNodes: Set<NodeId> | null;
  editingNode: NodeId | null;
  adoptingNode: NodeId | null;
  positionedNodes: PositionedNodeTree;
  treeWidth: number;
  treeHeight: number;
  treeXMargin: number;
  onNodesSelected: (nodeIds: NodeId[], multi: boolean) => void;
  onToggleEditMode: () => void;
  onNodeLabelChanged: (nodeId: NodeId, newValue: string) => void;
  onNodesMoved: (dx: number, dy: number) => void;
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
    [node.sliceXSpan[0], node.naturalY + LEVEL_HEIGHT],
    [node.sliceXSpan[1], node.naturalY + LEVEL_HEIGHT]
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
  x2={node.naturalX}
  y2={node.naturalY + LEVEL_HEIGHT}
/>

const ViewSvg: React.ForwardRefRenderFunction<HTMLDivElement, ViewSvgProps> = ({
  selectedNodes, editingNode, adoptingNode, positionedNodes, treeWidth, treeHeight, treeXMargin,
  onNodesSelected, onToggleEditMode, onNodeLabelChanged
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

  /**
   * Renders the tree nodes as SVG elements.
   */
  const renderNodes = () => Object.entries(positionedNodes).map(
    ([nodeId, node]) => editingNode !== nodeId && (
      <g
        key={nodeId}
        className={
          selectedNodes && selectedNodes.has(nodeId)
            ? 'node selected'
            : adoptingNode === nodeId
              ? 'node secondary-selected'
              : 'node'
        }
      >
        <rect
          x={Math.round(node.x - (LABEL_WIDTH / 2))} y={Math.round(node.y)}
          data-node-id={nodeId}
          width={LABEL_WIDTH} height={LABEL_HEIGHT}
          onMouseDown={selectNode}
          onTouchStart={selectNode}
          onDoubleClick={onToggleEditMode}
        />
        <text
          x={node.x} y={node.y}
          data-node-id={nodeId}
          onMouseDown={selectNode}
          onTouchStart={selectNode}
          onDoubleClick={onToggleEditMode}
        >
          {node.label}
        </text>
      </g>
    )
  );

  /**
   * Renders the links between nodes as SVG elements.
   */
  const renderLinks = () => flatMap(Object.values(positionedNodes),
    (node: PositionedNodeData) => node.children
      ? node.children.map(childId => lineToChild(node, positionedNodes[childId]))
      : node.triangle ? triangleToSlice(node) : lineToSlice(node)
  );

  /**
   * Renders a text field located at the node currently being edited, if one is defined.
   */
  const renderEditingNode = (): React.ReactNode => {
    const node: PositionedNodeData | null = editingNode ? positionedNodes[editingNode] : null;
    return node && <input
      type="text"
      className="node-edit-box"
      data-node-id={node.id}
      value={node.label}
      style={{
        left: node.x - (EDIT_TEXT_BOX_WIDTH / 2) + treeXMargin,
        top: node.y + treeHeight,
        width: EDIT_TEXT_BOX_WIDTH
      }}
      onChange={setNodeLabel}
      autoFocus={true}
    />;
  }

  return <div className="ViewSvg" ref={ref}>
    <svg width={treeWidth + treeXMargin * 2} height={treeHeight + 1}>
      <g transform={`translate(${treeXMargin},${treeHeight})`}>
        {renderNodes()}
        {renderLinks()}
      </g>
    </svg>
    {editingNode && renderEditingNode()}
  </div>;
};

export default forwardRef(ViewSvg);
