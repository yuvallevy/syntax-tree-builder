import React, { useState, useEffect, useRef } from 'react';
import ViewSvg from './ViewSvg';
import { isEmpty } from 'lodash';
import { NodeTree, NodeId, PositionedNodeTree } from './interfaces';
import { computeNodePositions, computeTreeHeight } from './positioning';
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

const View: React.FC<ViewProps> = ({
  nodes, sentence, selectedNodes, editingNode,
  onSentenceChanged, onTextSelected, onNodesSelected, onSelectionCleared, onNodeLabelChanged
}) => {
  const [positionedNodes, setPositionedNodes] = useState<PositionedNodeTree>({});
  const [treeHeight, setTreeHeight] = useState<number>(0);
  const [selecting, setSelecting] = useState<boolean>(false);
  const [boxSelectionStart, setBoxSelectionStart] = useState<[number, number] | null>();
  const [boxSelectionEnd, setBoxSelectionEnd] = useState<[number, number] | null>();

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
    if ((event.target as Element).className === 'View' || (event.target as Element).tagName === 'svg') {
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
    if (selecting) {
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
  
  const finishBoxSelection = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setSelecting(false);
    if (boxSelectionStart && boxSelectionEnd) {
      const x1 = Math.min(boxSelectionStart[0], boxSelectionEnd[0]);
      const y1 = Math.min(boxSelectionStart[1], boxSelectionEnd[1]);
      const x2 = Math.max(boxSelectionStart[0], boxSelectionEnd[0]);
      const y2 = Math.max(boxSelectionStart[1], boxSelectionEnd[1]);
      console.log(`(${x1}, ${y1}) (${x2}, ${y2})`);
      // onNodesSelected(Object.values(positionedNodes)
        // .filter((node) => node.x > x1 && node.x < x2 && node.y > y1 && node.y < y2)
        // .map((node) => node.id), false);
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
        treeHeight={treeHeight}
        onNodesSelected={onNodesSelected}
        onSelectionCleared={onSelectionCleared}
        onNodeLabelChanged={onNodeLabelChanged}
      />}
      {renderInput()}
      {renderSelectionBox()}
    </div>
  );
};

export default View;
