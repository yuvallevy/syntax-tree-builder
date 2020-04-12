import React, { useState, useEffect, useRef } from 'react';
import { measureText } from './measureText';
import { flatMap } from 'lodash';
import { NodeTree, NodeId, PositionedNodeTree, PositionedNodeData } from './interfaces';
import { computeNodePositions, computeTreeHeight, LABEL_WIDTH, LABEL_HEIGHT, LEVEL_HEIGHT, EDIT_TEXT_BOX_WIDTH } from './positioning';
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

const ViewSvg: React.FC<ViewSvgProps> = ({ nodes, sentence, selectedNodes, editingNode, onNodesSelected, onSelectionCleared, onNodeLabelChanged }) => {
  const [positionedNodes, setPositionedNodes] = useState<PositionedNodeTree>({});
  const [treeHeight, setTreeHeight] = useState<number>(0);
  const [selecting, setSelecting] = useState<boolean>(false);
  const [boxSelectionStart, setBoxSelectionStart] = useState<[number, number] | null>();
  const [boxSelectionEnd, setBoxSelectionEnd] = useState<[number, number] | null>();
  const viewSvgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newPositionedNodes = computeNodePositions(nodes, sentence);
    setPositionedNodes(newPositionedNodes);
    setTreeHeight(computeTreeHeight(newPositionedNodes));
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
        y = event.clientY - viewSvgRef.current.offsetTop - treeHeight;
      } else if ('targetTouches' in event) {  // TODO: Does this work?
        x = event.targetTouches[0].clientX - viewSvgRef.current.offsetLeft;
        y = event.targetTouches[0].clientY - viewSvgRef.current.offsetTop - treeHeight;
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
          event.clientY - viewSvgRef.current.offsetTop - treeHeight
        ]);
      } else if ('targetTouches' in event) {  // TODO: Does this work?
        setBoxSelectionEnd([
          event.targetTouches[0].clientX - viewSvgRef.current.offsetLeft,
          event.targetTouches[0].clientY - viewSvgRef.current.offsetTop - treeHeight
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

  const renderSelectionBox = (): React.ReactNode => {
    if (selecting && boxSelectionStart && boxSelectionEnd) {
      const [x1, y1] = boxSelectionStart;
      const [x2, y2] = boxSelectionEnd;
      return <rect
        className="selection-box"
        x={Math.min(x1, x2)} y={Math.min(y1, y2)}
        width={Math.abs(x2 - x1)} height={Math.abs(y2 - y1)}
      />
    }
    return false;
  };

  return <div className="ViewSvg" ref={viewSvgRef}>
    <svg width={measureText(sentence)} height={treeHeight}
      onMouseDown={initiateBoxSelection}
      onMouseMove={updateBoxSelection}
      onMouseUp={finishBoxSelection}
    >
      <g transform={`translate(0,${treeHeight})`}>
        {renderNodes()}
        {renderLinks()}
        {renderSelectionBox()}
      </g>
    </svg>
    {editingNode && renderEditingNode()}
  </div>;
};

export default ViewSvg;
