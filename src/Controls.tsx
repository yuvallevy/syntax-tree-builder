import React from 'react';
import './Controls.scss';

interface ControlsProps {
  sentence: string;
  onNodeAdded: (event: React.SyntheticEvent) => void;
}

const Controls: React.FC<ControlsProps> = ({ onNodeAdded }) => {
  return (
    <div className="Controls">
      <button type="button" onClick={onNodeAdded}>
        New Node
      </button>
    </div>
  );
};

export default Controls;
