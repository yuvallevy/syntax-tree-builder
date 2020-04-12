import React from 'react';
import './Controls.scss';

interface ControlsProps {
  sentence: string;
  onNodeAdded: (event: React.SyntheticEvent) => void;
  onEnterEditMode: (event: React.SyntheticEvent) => void;
  onNodesDeleted: (event: React.SyntheticEvent) => void;
}

const Controls: React.FC<ControlsProps> = ({ onNodeAdded, onEnterEditMode, onNodesDeleted }) => {
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
    </div>
  );
};

export default Controls;
