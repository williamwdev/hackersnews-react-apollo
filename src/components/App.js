import React from 'react';
import LinkList from './LinkList';
import CreateLink from './CreateLink';
import '../styles/App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>GraphQL tutorial</h1>
        <LinkList />
        <CreateLink />
      </header>
    </div>
  );
}

export default App;
