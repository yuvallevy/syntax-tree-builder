import React from 'react';
import './Controls.scss';

interface ControlsProps {
  sentence: string;
  onNodeAdded: (event: React.SyntheticEvent) => void;
  onNodesDeleted: (event: React.SyntheticEvent) => void;
}

const Controls: React.FC<ControlsProps> = ({ onNodeAdded, onNodesDeleted }) => {
  return (
    <div className="Controls">
      <button type="button" onClick={onNodeAdded}>
        New Node
      </button>
      <button type="button" onClick={onNodesDeleted}>
        Delete Selected Nodes
      </button>
    </div>
  );
};

export default Controls;
