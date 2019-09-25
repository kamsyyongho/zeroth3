import { createBrowserHistory } from 'history';
import React from "react";
import { Route, Router } from "react-router-dom";
import { About } from './routes/main/About';
import { Home } from './routes/main/Home';
import { Topics } from './routes/main/Topics';
import Header from './routes/shared/Header';

const history = createBrowserHistory();

function App() {
  return (
    <Router history={history}>
      <Header />
      <Route exact path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/topics" component={Topics} />
    </Router>
  );
}

export default App;
