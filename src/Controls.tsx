import React, { useState } from 'react';
import { NodeId, NodeTree } from './interfaces';
import { Plus, Edit, Trash, CaretTop } from 'react-bytesize-icons';
import './Controls.scss';

interface ControlsProps {
  nodes: NodeTree;
  sentence: string;
  selectedRange: [number, number] | null;
  selectedNodes: Set<NodeId> | null;
  onNodeAdded: () => void;
  onToggleEditMode: () => void;
  onNodesDeleted: () => void;
  onTriangleToggled: (newValue: boolean) => void;
}

interface ToolbarButtonProps {
  toolName: string;
  onClick: () => void;
  disabled: boolean;
  active?: boolean;
}

const TOOL_DESCRIPTIONS: {[key: string]: string} = {
  add: 'Add a new parent node from the selected text or nodes. (Shortcut: Ctrl+Up)',
  edit: 'Edit the selected node. (Shortcut: F2 or Enter)',
  delete: 'Delete the selected nodes. (Shortcut: Delete or Backspace)',
  triangle: 'Toggle triangles for the selected terminal nodes.'
}

const Controls: React.FC<ControlsProps> = ({ nodes, selectedRange, selectedNodes, onNodeAdded, onToggleEditMode: onEnterEditMode, onNodesDeleted, onTriangleToggled }) => {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  const triangleToggleEnabled: boolean = !!selectedNodes && !!selectedNodes.size && Array.from(selectedNodes).every(nodeId => nodes[nodeId].slice);
  const triangleToggleChecked: boolean = triangleToggleEnabled && Array.from(selectedNodes as Set<NodeId>).some(nodeId => nodes[nodeId].triangle);

  const ToolbarButton: React.FC<ToolbarButtonProps> = ({ toolName, onClick, disabled, active, children }) =>
    <button type="button" onClick={onClick} disabled={disabled} onMouseEnter={() => setHoveredTool(toolName)} onMouseLeave={() => setHoveredTool(null)} className={active ? 'active' : ''}>
      {children}
    </button>;

  return (
    <div className="Controls">
      <ToolbarButton toolName="add" onClick={onNodeAdded} disabled={!selectedRange && (!selectedNodes || !selectedNodes.size)}>
        <Plus />
      </ToolbarButton>
      <ToolbarButton toolName="edit" onClick={onEnterEditMode} disabled={!selectedNodes || !selectedNodes.size}>
        <Edit />
      </ToolbarButton>
      <ToolbarButton toolName="delete" onClick={onNodesDeleted} disabled={!selectedNodes || !selectedNodes.size}>
        <Trash />
      </ToolbarButton>
      <ToolbarButton toolName="triangle"
        onClick={() => onTriangleToggled(!triangleToggleChecked)}
        disabled={!triangleToggleEnabled} active={triangleToggleChecked}
      >
        <CaretTop />
      </ToolbarButton>
      {hoveredTool && <div className="tooltip">
        {TOOL_DESCRIPTIONS[hoveredTool]}
      </div>}
    </div>
  );
};

export default Controls;
