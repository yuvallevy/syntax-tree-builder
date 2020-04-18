import React, { useState, useEffect, useRef } from 'react';
import ViewSvg from './ViewSvg';
import { isEmpty } from 'lodash';
import { NodeTree, NodeId, PositionedNodeTree } from './interfaces';
import { computeNodePositions, computeTreeWidth, computeTreeHeight } from './positioning';
import './View.scss';

interface ViewProps {
  nodes: NodeTree;
  sentence: string;
  selectedNodes: Set<NodeId> | null;
  editingNode: NodeId | null;
  onSentenceChanged: (newSentence: string) => void;
  onTextSelected: (start: number, end: number) => void;
  onNodesSelected: (nodeIds: NodeId[], multi: boolean) => void;
  onSelectionCleared: () => void;
  onNodeLabelChanged: (nodeId: NodeId, newValue: string) => void;
}

const TREE_X_MARGIN = 16;

const View: React.FC<ViewProps> = ({
  nodes, sentence, selectedNodes, editingNode,
  onSentenceChanged, onTextSelected, onNodesSelected, onSelectionCleared, onNodeLabelChanged
}) => {
  const [positionedNodes, setPositionedNodes] = useState<PositionedNodeTree>({});
  const [treeWidth, setTreeWidth] = useState<number>(0);
  const [treeHeight, setTreeHeight] = useState<number>(0);
  const [selecting, setSelecting] = useState<boolean>(false);
  const [boxSelectionStart, setBoxSelectionStart] = useState<[number, number] | null>();
  const [boxSelectionEnd, setBoxSelectionEnd] = useState<[number, number] | null>();
  const viewSvgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTreeWidth(computeTreeWidth(sentence));
  }, [sentence]);

  useEffect(() => {
    const newPositionedNodes = computeNodePositions(nodes, sentence);
    setPositionedNodes(newPositionedNodes);
    setTreeHeight(computeTreeHeight(newPositionedNodes));
  }, [nodes, sentence]);

  const onInputChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSentenceChanged(event.target.value);
  };

  const onInputSelectionChanged = (event: React.SyntheticEvent<HTMLInputElement>): void => {
    const { selectionStart, selectionEnd } = event.currentTarget;
    if (selectionStart !== null && selectionEnd !== null) {
      onTextSelected(selectionStart, selectionEnd);
    }
  }

  const initiateBoxSelection = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (viewSvgRef.current && ((event.target as Element).className === 'View' || (event.target as Element).tagName === 'svg')) {
      let x = 0;
      let y = 0;
      if ('clientX' in event) {
        x = event.clientX;
        y = event.clientY;
      } else if ('targetTouches' in event) {  // TODO: Does this work?
        x = event.targetTouches[0].clientX;
        y = event.targetTouches[0].clientY;
      }
      onSelectionCleared();
      setBoxSelectionStart([x, y]);
      setBoxSelectionEnd(null);
      setSelecting(true);
    }
  };
  
  const updateBoxSelection = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (selecting && viewSvgRef.current) {
      event.preventDefault();
      if ('clientX' in event) {
        setBoxSelectionEnd([
          event.clientX,
          event.clientY
        ]);
      } else if ('targetTouches' in event) {  // TODO: Does this work?
        setBoxSelectionEnd([
          event.targetTouches[0].clientX,
          event.targetTouches[0].clientY
        ]);
      }
    }
  };

  const windowCoordsToTreeCoords = (coords: [number, number]): [number, number] => [
    coords[0] - viewSvgRef.current!.offsetLeft - TREE_X_MARGIN,
    coords[1] - viewSvgRef.current!.offsetTop - treeHeight
  ];
  
  const finishBoxSelection = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setSelecting(false);
    if (viewSvgRef.current && boxSelectionStart && boxSelectionEnd) {
      const [x1, y1] = windowCoordsToTreeCoords(boxSelectionStart);
      const [x2, y2] = windowCoordsToTreeCoords(boxSelectionEnd);
      onNodesSelected(Object.values(positionedNodes)
        .filter((node) =>
          node.x > Math.min(x1, x2) && node.x < Math.max(x1, x2) &&
          node.y > Math.min(y1, y2) && node.y < Math.max(y1, y2))
        .map((node) => node.id), false);
      setBoxSelectionStart(null);
      setBoxSelectionEnd(null);
    }
  };

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
      onMouseMove={updateBoxSelection}
      onMouseUp={finishBoxSelection}
    >
      {!isEmpty(nodes) && <ViewSvg
        nodes={nodes}
        sentence={sentence}
        selectedNodes={selectedNodes}
        editingNode={editingNode}
        positionedNodes={positionedNodes}
        treeWidth={treeWidth}
        treeHeight={treeHeight}
        treeXMargin={TREE_X_MARGIN}
        onNodesSelected={onNodesSelected}
        onSelectionCleared={onSelectionCleared}
        onNodeLabelChanged={onNodeLabelChanged}
        ref={viewSvgRef}
      />}
      {renderInput()}
      {renderSelectionBox()}
    </div>
  );
};

export default View;
