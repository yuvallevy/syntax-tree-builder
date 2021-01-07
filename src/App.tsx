import React, { Component } from 'react';
import Editor from './Editor';
import AboutBox from './AboutBox';
import './App.scss';

class App extends Component {
  render() {
    return (
      <div className="App">
        <AboutBox />
        <Editor />
      </div>
    );
  }
}

export default App;
