import { createBrowserHistory } from 'history';
import React, { useEffect } from "react";
import { Route, Router } from "react-router-dom";
import SyncLoader from 'react-spinners/SyncLoader';
import { useApi } from './hooks/api/useApi';
import { useKeycloak } from './hooks/keycloak/useKeycloak';
import RootProvider from './hooks/Rootprovider';
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
  const { api, apiInitialized, initApi } = useApi();

  useEffect(() => {
    initKeycloak();
  }, []);

  useEffect(() => {
    if (keycloakInitialized) {
      initApi(keycloak.keycloak, keycloak.logout)

      //////////////////////////////////////////
      // TEST CODE - DELETE BEFORE PRODUCTION //
      //////////////////////////////////////////
      //!
      //TODO
      //* TO DEAL WITH A RACE CONDITION WITH ACCOUNT CREATION AND ORGANIZATION ID CREATION
      //!
      if (keycloak.organizationId === undefined) keycloak.logout()
      //!
      //////////////////////////////////////////
      // TEST CODE - DELETE BEFORE PRODUCTION //
      //////////////////////////////////////////

    }
  }, [keycloakInitialized]);

  if (!keycloakInitialized || !apiInitialized) {
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
    <RootProvider keycloak={keycloak} api={api}>
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
    </RootProvider>
  );
}

export default App;
