import React, { useState } from 'react';
import { NodeId, NodeTree } from './interfaces';
import { Plus, Edit, Trash, CaretTop, Move, Reply } from 'react-bytesize-icons';
import './Controls.scss';
import { Adopt, Disown } from './icons';

interface ControlsProps {
  nodes: NodeTree;
  sentence: string;
  selectedRange: [number, number] | null;
  selectedNodes: Set<NodeId> | null;
  adoptingNode: NodeId | null;
  disowningNode: NodeId | null;
  onNodeAdded: () => void;
  onToggleEditMode: () => void;
  onToggleAdoptMode: () => void;
  onToggleDisownMode: () => void;
  onNodesDeleted: () => void;
  onTriangleToggled: (newValue: boolean) => void;
  onNodePositionsReset: () => void;
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
  triangle: 'Toggle triangles for the selected terminal nodes.',
  resetPositions: 'Relocate the selected nodes to their original positions.',
  adopt: 'Adopt one or more other nodes as children of the selected node.',
  disown: 'Disown one or more of the children of the selected node.'
};

const Controls: React.FC<ControlsProps> = ({
  nodes, selectedRange, selectedNodes, adoptingNode, disowningNode,
  onNodeAdded, onToggleEditMode, onToggleAdoptMode, onToggleDisownMode, onNodesDeleted, onTriangleToggled, onNodePositionsReset
}) => {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  const triangleToggleEnabled: boolean = !!selectedNodes && !!selectedNodes.size && Array.from(selectedNodes).every(nodeId => nodes[nodeId].slice);
  const triangleToggleChecked: boolean = triangleToggleEnabled && Array.from(selectedNodes as Set<NodeId>).some(nodeId => nodes[nodeId].triangle);

  const ToolbarButton: React.FC<ToolbarButtonProps> = ({ toolName, onClick, disabled, active, children }) =>
    <button type="button" id={`button-${toolName}`} onClick={onClick} disabled={disabled} onMouseEnter={() => setHoveredTool(toolName)} onMouseLeave={() => setHoveredTool(null)} className={active ? 'active' : ''}>
      {children}
    </button>;

  return (
    <div className="Controls">
      <ToolbarButton toolName="add" onClick={onNodeAdded} disabled={!selectedRange && (!selectedNodes || !selectedNodes.size)}>
        <Plus />
      </ToolbarButton>
      <ToolbarButton toolName="edit" onClick={onToggleEditMode} disabled={!selectedNodes || !selectedNodes.size}>
        <Edit />
      </ToolbarButton>
      <ToolbarButton toolName="delete" onClick={onNodesDeleted} disabled={!selectedNodes || !selectedNodes.size}>
        <Trash />
      </ToolbarButton>
      <ToolbarButton toolName="adopt"
        onClick={() => onToggleAdoptMode()}
        disabled={(!selectedNodes || !selectedNodes.size) && !adoptingNode}
        active={!!adoptingNode}
      >
        <Adopt />
      </ToolbarButton>
      <ToolbarButton toolName="disown"
        onClick={() => onToggleDisownMode()}
        disabled={(!selectedNodes || !selectedNodes.size) && !disowningNode}
        active={!!disowningNode}
      >
        <Disown />
      </ToolbarButton>
      <ToolbarButton toolName="triangle"
        onClick={() => onTriangleToggled(!triangleToggleChecked)}
        disabled={!triangleToggleEnabled} active={triangleToggleChecked}
      >
        <CaretTop />
      </ToolbarButton>
      <ToolbarButton toolName="resetPositions" onClick={() => onNodePositionsReset()} disabled={!selectedNodes || !selectedNodes.size}>
        <Move />
        <Reply />
      </ToolbarButton>
      {hoveredTool && <div className="tooltip">
        {TOOL_DESCRIPTIONS[hoveredTool]}
      </div>}
    </div>
  );
};

export default Controls;
