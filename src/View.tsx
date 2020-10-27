import React, { useState, useEffect, useRef } from 'react';
import ViewSvg from './ViewSvg';
import { isEmpty } from 'lodash';
import { NodeTree, NodeId, PositionedNodeTree, PositionedNodeData } from './interfaces';
import { computeNodePositions, computeTreeWidth, computeTreeHeight, LABEL_HEIGHT } from './positioning';
import './View.scss';

interface ViewProps {
  nodes: NodeTree;
  sentence: string;
  selectedNodes: Set<NodeId> | null;
  unselectableNodes: Set<NodeId> | null;
  editingNode: NodeId | null;
  adoptingNode: NodeId | null;
  disowningNode: NodeId | null;
  onSentenceChanged: (newSentence: string) => void;
  onTextSelected: (start: number, end: number) => void;
  onNodesSelected: (nodeIds: NodeId[], multi: boolean) => void;
  onSelectionCleared: () => void;
  onToggleEditMode: () => void;
  onNodeLabelChanged: (newValue: string) => void;
  onNodesMoved: (dx: number, dy: number) => void;
}

const TREE_X_MARGIN = 16;

/**
 * Returns whether the center of the given node is within the rectangle defined by the points (x1,y1),(x2,y2).
 */
const isNodeInRect = (node: PositionedNodeData, x1: number, y1: number, x2: number, y2: number) =>
  node.x > Math.min(x1, x2) && node.x < Math.max(x1, x2) &&
  node.y + LABEL_HEIGHT / 2 > Math.min(y1, y2) &&
  node.y + LABEL_HEIGHT / 2 < Math.max(y1, y2);

/**
 * Returns the mouse/touch position from the given mouse/touch event.
 */
const getInteractionPos = (event: React.MouseEvent | React.TouchEvent): [number, number] =>
  'clientX' in event ? [event.clientX, event.clientY]
    : 'targetTouches' in event ? [event.targetTouches[0].clientX, event.targetTouches[0].clientY]
    : [0, 0];

const View: React.FC<ViewProps> = ({
  nodes, sentence, selectedNodes, unselectableNodes, editingNode, adoptingNode, disowningNode,
  onSentenceChanged, onTextSelected, onNodesSelected, onSelectionCleared, onToggleEditMode, onNodeLabelChanged,
  onNodesMoved
}) => {
  const [positionedNodes, setPositionedNodes] = useState<PositionedNodeTree>({});
  const [treeWidth, setTreeWidth] = useState<number>(0);
  const [treeHeight, setTreeHeight] = useState<number>(0);
  const [selecting, setSelecting] = useState<boolean>(false);
  const [boxSelectionStart, setBoxSelectionStart] = useState<[number, number] | null>();
  const [boxSelectionEnd, setBoxSelectionEnd] = useState<[number, number] | null>();
  const viewSvgRef = useRef<HTMLDivElement>(null);

  /**
   * Whenever the sentence changes, recalculate the width of the tree.
   */
  useEffect(() => {
    setTreeWidth(computeTreeWidth(sentence));
  }, [sentence]);

  /**
   * Whenever the tree or sentence changes, recalculate the positions of the nodes and the height of the tree.
   */
  useEffect(() => {
    const newPositionedNodes = computeNodePositions(nodes, sentence);
    setPositionedNodes(newPositionedNodes);
    setTreeHeight(computeTreeHeight(newPositionedNodes));
  }, [nodes, sentence]);

  /**
   * Handler called when the sentence changes.
   */
  const onInputChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSentenceChanged(event.target.value);
  };

  /**
   * Handler called when a selection is made in the sentence,
   * or the position of the cursor in the text box changes.
   */
  const onInputSelectionChanged = (event: React.SyntheticEvent<HTMLInputElement>): void => {
    const { selectionStart, selectionEnd } = event.currentTarget;
    if (selectionStart !== null && selectionEnd !== null) {
      onTextSelected(selectionStart, selectionEnd);
    }
  };

  /**
   * Starts a new box selection, setting the first corner to the current mouse position.
   */
  const initiateBoxSelection = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (viewSvgRef.current && ((event.target as Element).className === 'View' || (event.target as Element).tagName === 'svg')) {
      onSelectionCleared();
      setBoxSelectionStart(getInteractionPos(event));
      setBoxSelectionEnd(null);
      setSelecting(true);
    }
  };
  
  /**
   * Updates the box selection started in initiateBoxSelection(),
   * setting the second corner to the current mouse position.
   */
  const updateBoxSelection = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (viewSvgRef.current) {
      event.preventDefault();
      setBoxSelectionEnd(getInteractionPos(event));
    }
  };

  const handleMouseDrag = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ((event as React.MouseEvent).buttons === 1 || 'targetTouches' in event) {
      if (selecting) {
        updateBoxSelection(event);
      } else if ((event.target as any).tagName === 'text' || (event.target as any).tagName === 'svg') {
        onNodesMoved((event as React.MouseEvent).movementX, (event as React.MouseEvent).movementY);
      }
    }
  };

  /**
   * Receives a pair of absolute window coordinates, and returns a new pair translated to be relative to the positions
   * of the nodes (as defined in the positionedNodes object).
   */
  const windowCoordsToTreeCoords = (coords: [number, number]): [number, number] => [
    coords[0] - viewSvgRef.current!.offsetLeft - TREE_X_MARGIN,
    coords[1] - viewSvgRef.current!.offsetTop - treeHeight
  ];
  
  /**
   * Completes the box selection, selecting all nodes within the selection box and clearing it.
   */
  const finishBoxSelection = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setSelecting(false);
    if (viewSvgRef.current && boxSelectionStart && boxSelectionEnd) {
      const [x1, y1] = windowCoordsToTreeCoords(boxSelectionStart);
      const [x2, y2] = windowCoordsToTreeCoords(boxSelectionEnd);
      onNodesSelected(Object.values(positionedNodes)
        .filter((node) => isNodeInRect(node, x1, y1, x2, y2))
        .map((node) => node.id), false);
      setBoxSelectionStart(null);
      setBoxSelectionEnd(null);
    }
  };

  /**
   * Renders the sentence text box.
   */
  const renderInput = (): React.ReactNode => {
    return (
      <input
        type="text" value={sentence}
        placeholder="Click here and type a sentence..."
        onChange={onInputChanged}
        onSelect={onInputSelectionChanged}
      />
    );
  };

  /**
   * Renders the current selection box, if it is defined.
   * The selection box is controlled by the initiateBoxSelection, updateBoxSelection and finishBoxSelection functions.
   */
  const renderSelectionBox = (): React.ReactNode => {
    if (selecting && boxSelectionStart && boxSelectionEnd) {
      const [x1, y1] = boxSelectionStart;
      const [x2, y2] = boxSelectionEnd;
      return <div
        className="selection-box"
        style={{
          left: Math.min(x1, x2), top: Math.min(y1, y2),
          width: Math.abs(x2 - x1), height: Math.abs(y2 - y1)
        }}
      />;
    }
    return false;
  };

  return (
    <div
      className="View"
      onMouseDown={initiateBoxSelection}
      onMouseMove={handleMouseDrag}
      onMouseUp={finishBoxSelection}
    >
      {!isEmpty(nodes) && <ViewSvg
        selectedNodes={selectedNodes}
        unselectableNodes={unselectableNodes}
        editingNode={editingNode}
        adoptingNode={adoptingNode}
        disowningNode={disowningNode}
        positionedNodes={positionedNodes}
        treeWidth={treeWidth}
        treeHeight={treeHeight}
        treeXMargin={TREE_X_MARGIN}
        onNodesSelected={onNodesSelected}
        onToggleEditMode={onToggleEditMode}
        onNodeLabelChanged={onNodeLabelChanged}
        onNodesMoved={onNodesMoved}
        ref={viewSvgRef}
      />}
      {renderInput()}
      {renderSelectionBox()}
    </div>
  );
};

export default View;
