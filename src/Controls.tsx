import React from 'react';
import { NodeId, NodeTree } from './interfaces';
import './Controls.scss';

interface ControlsProps {
  nodes: NodeTree;
  sentence: string;
  selectedNodes: Set<NodeId> | null;
  onNodeAdded: () => void;
  onEnterEditMode: () => void;
  onNodesDeleted: () => void;
  onTriangleToggled: (newValue: boolean) => void;
}

const Controls: React.FC<ControlsProps> = ({ nodes, selectedNodes, onNodeAdded, onEnterEditMode, onNodesDeleted, onTriangleToggled }) => {
  const triangleToggleEnabled: boolean = !!selectedNodes && !!selectedNodes.size && Array.from(selectedNodes).every(nodeId => nodes[nodeId].slice);
  const triangleToggleChecked: boolean = triangleToggleEnabled && Array.from(selectedNodes as Set<NodeId>).some(nodeId => nodes[nodeId].triangle);

  return (
    <div className="Controls">
      <button type="button" onClick={onNodeAdded}>
        New Node
      </button>
      <button type="button" onClick={onEnterEditMode}>
        Edit Selected Node
      </button>
      <button type="button" onClick={onNodesDeleted}>
        Delete Selected Nodes
      </button>
      <label htmlFor="triangle-checkbox">
        <input type="checkbox" id="triangle-checkbox"
          disabled={!triangleToggleEnabled} checked={triangleToggleChecked}
          onChange={(event) => onTriangleToggled(event.currentTarget.checked)} />
        Triangle
      </label>
    </div>
  );
};

export default Controls;
