import React, { useEffect, useState } from 'react';
import Modal from './Modal';

const LS_KEY_VERSION = 'v';
const CURRENT_VERSION = '0.1';

const AboutBox: React.FC<{}> = () => {
  const [visible, setVisible] = useState(localStorage.getItem(LS_KEY_VERSION) !== CURRENT_VERSION);

  const hideMe = () => setVisible(false);

  useEffect(() => {
    localStorage.setItem(LS_KEY_VERSION, CURRENT_VERSION);
  }, []);

  return <Modal
    visible={visible}
    header="Syntax Tree Builder"
    width="60vw"
    onDismiss={hideMe}
  >
    <p>Build <strong>constituent trees</strong> for articles, lectures, homework etc.
      using an intuitive, in-browser WYSIWYG interface, without labeled bracket notation.</p>
    <h4>New in alpha {CURRENT_VERSION}:</h4>
    <ul>
      <li>Fixed bug where top-level nodes were able to adopt themselves,
        triggering a recursion error and causing the tree to implode.
        (tnx Ziv Plotnik for reporting)</li>
    </ul>
    <p>
      See <a href="https://github.com/yuvallevy/syntax-tree-builder/blob/master/HISTORY.md" target="_blank">
        GitHub
      </a> for full release notes.
    </p>
    <p>
      Proudly powered by <a href="https://reactjs.org/" target="_blank">
        React
      </a>, <a href="https://www.w3.org/Graphics/SVG/" target="_blank">
        SVG
      </a> and <a href="https://www.typescriptlang.org/" target="_blank">
        TypeScript
      </a>.
    </p>
  </Modal>
}

export default AboutBox;
