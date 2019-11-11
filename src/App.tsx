
import { createBrowserHistory } from 'history';
import React, { useEffect } from "react";
import { Route, Router } from "react-router-dom";
import { useApi } from './hooks/api/useApi';
import { useI18n } from './hooks/i18n/useI18n';
import { useKeycloak } from './hooks/keycloak/useKeycloak';
import RootProvider from './hooks/Rootprovider';
import "./i18n"; // to immediately initialize i18n
import { IAM } from './routes/IAM/IAM';
import { Home } from './routes/main/Home';
import { Models } from './routes/models/Models';
import { Editor } from './routes/projects/Editor';
import { ProjectDetails } from './routes/projects/ProjectDetails';
import { Projects } from './routes/projects/Projects';
import { TDP } from './routes/projects/TDP';
import Header from './routes/shared/header/Header';
import { SiteLoadingIndicator } from './routes/shared/SiteLoadingIndicator';
import { PATHS } from './types';

const history = createBrowserHistory();

function App() {
  const { keycloak, keycloakInitialized, initKeycloak } = useKeycloak();
  const { api, apiInitialized, initApi } = useApi();
  const i18n = useI18n();

  useEffect(() => {
    initKeycloak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (keycloakInitialized) {
      initApi(keycloak.keycloak, keycloak.logout);

      //////////////////////////////////////////
      // TEST CODE - DELETE BEFORE PRODUCTION //
      //////////////////////////////////////////
      //!
      //TODO
      //* TO DEAL WITH A RACE CONDITION WITH ACCOUNT CREATION AND ORGANIZATION ID CREATION
      //!
      if (keycloak.organizationId === undefined) keycloak.logout();
      //!
      //////////////////////////////////////////
      // TEST CODE - DELETE BEFORE PRODUCTION //
      //////////////////////////////////////////

    }
  }, [initApi, keycloak, keycloakInitialized]);

  if (!keycloakInitialized || !apiInitialized) {
    return (<SiteLoadingIndicator />);
  }

  return (
    <RootProvider keycloak={keycloak} api={api} i18n={i18n} >
      <Router history={history}>
        <Header />
        <Route exact path={PATHS.home.to} component={Home} />
        <Route path={PATHS.IAM.to} component={IAM} />
        <Route exact path={PATHS.projects.to} component={Projects} />
        <Route exact path={PATHS.project.to} component={ProjectDetails} />
        <Route exact path={PATHS.TDP.to} component={TDP} />
        <Route exact path={PATHS.editor.to} component={Editor} />
        <Route path={PATHS.models.to} component={Models} />
      </Router>
    </RootProvider>
  );
}

export default App;
