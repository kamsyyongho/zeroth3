import { createBrowserHistory } from 'history';
import React, { useEffect } from "react";
import { Route, Router } from "react-router-dom";
import SyncLoader from 'react-spinners/SyncLoader';
import { KeycloakContext } from './hooks/keycloak/KeycloakContext';
import { useKeycloak } from './hooks/keycloak/useKeycloak';
import { IAM } from './routes/IAM/IAM';
import { About } from './routes/main/About';
import MiniDrawer from './routes/main/ExampleDrawer';
import MultipleSelect from './routes/main/ExampleMultiSelect';
import SimpleSelect from './routes/main/ExampleSimpleSelect';
import { ExampleTable } from './routes/main/ExampleTable';
import { Home } from './routes/main/Home';
import { Topics } from './routes/main/Topics';
import Header from './routes/shared/Header';

const history = createBrowserHistory();

function App() {
  const { keycloak, keycloakInitialized, initKeycloak } = useKeycloak();
  useEffect(initKeycloak, []);

  if (!keycloakInitialized) {
    return (
      <SyncLoader
        sizeUnit={"px"}
        size={25}
        color={'#123abc'}
        loading={true}
      />
    )
  }

  return (
    <KeycloakContext.Provider value={keycloak}>
      <Router history={history}>
        <Header />
        <Route exact path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/topics" component={Topics} />
        <Route path="/drawer" component={MiniDrawer} />
        <Route path="/simple" component={SimpleSelect} />
        <Route path="/multi" component={MultipleSelect} />
        <Route path="/list" component={IAM} />
        <Route path="/table" component={ExampleTable} />
      </Router>
    </KeycloakContext.Provider>
  );
}

export default App;
