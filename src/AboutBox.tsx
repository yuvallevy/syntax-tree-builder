import React, { useEffect, useState } from 'react';
import Modal from './Modal';

const LS_KEY_VERSION = 'v';
const CURRENT_VERSION = '0.2';

const AboutBox: React.FC<{}> = () => {
  const [visible, setVisible] = useState(localStorage.getItem(LS_KEY_VERSION) !== CURRENT_VERSION);

  const hideMe = () => setVisible(false);

  useEffect(() => {
    localStorage.setItem(LS_KEY_VERSION, CURRENT_VERSION);
  }, []);

  return <Modal
    visible={visible}
    header={`Syntax Tree Builder v${CURRENT_VERSION}`}
    width="60vw"
    onDismiss={hideMe}
  >
    <p>Build <strong>constituent trees</strong> for articles, lectures, homework etc.
      using an intuitive, in-browser WYSIWYG interface instead of labeled bracket notation.</p>
    <h4>New in alpha {CURRENT_VERSION}:</h4>
    <ul>
      <li>Added the long-overdue undo/redo functionality.</li>
    </ul>
    <p>
      See <a href="https://github.com/yuvallevy/syntax-tree-builder/blob/master/HISTORY.md" target="_blank" rel="noopener noreferrer">
        GitHub
      </a> for full release notes.
    </p>
    <p>
      Syntax Tree Builder is written in <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer">
        TypeScript
      </a> and powered by <a href="https://reactjs.org/" target="_blank" rel="noopener noreferrer">
        React
      </a> and <a href="https://www.w3.org/Graphics/SVG/" target="_blank" rel="noopener noreferrer">
        SVG
      </a>.
    </p>
  </Modal>
}

export default AboutBox;
