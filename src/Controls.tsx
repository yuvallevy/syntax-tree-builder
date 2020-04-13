import React from 'react';
import { NodeId, NodeTree } from './interfaces';
import { Plus, Edit, Trash, CaretTop } from 'react-bytesize-icons';
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
      <button type="button" onClick={onNodeAdded} disabled={!selectedNodes || !selectedNodes.size}>
        <Plus />
      </button>
      <button type="button" onClick={onEnterEditMode} disabled={!selectedNodes || !selectedNodes.size}>
        <Edit />
      </button>
      <button type="button" onClick={onNodesDeleted} disabled={!selectedNodes || !selectedNodes.size}>
        <Trash />
      </button>
      <button disabled={!triangleToggleEnabled}>
        <label>
          <input type="checkbox"
            disabled={!triangleToggleEnabled} checked={triangleToggleChecked}
            onChange={(event) => onTriangleToggled(event.currentTarget.checked)} />
          <CaretTop />
        </label>
      </button>
    </div>
  );
};

export default Controls;
