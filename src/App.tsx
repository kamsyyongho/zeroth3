
import { createBrowserHistory } from 'history';
import React, { useEffect } from "react";
import { Route, Router } from "react-router-dom";
import { useApi } from './hooks/api/useApi';
import { useI18n } from './hooks/i18n/useI18n';
import { useKeycloak } from './hooks/keycloak/useKeycloak';
import { useNavigationProps } from './hooks/navigation-props/useNavigationProps';
import RootProvider from './hooks/Rootprovider';
import "./i18n"; // to immediately initialize i18n
import { Editor } from './routes/editor/Editor';
import { IAM } from './routes/IAM/IAM';
import { Home } from './routes/main/Home';
import { Models } from './routes/models/Models';
import { UserProfile } from './routes/profile/UserProfile';
import { ProjectDetails } from './routes/projects/ProjectDetails';
import { Projects } from './routes/projects/Projects';
import Header from './routes/shared/header/Header';
import { SiteLoadingIndicator } from './routes/shared/SiteLoadingIndicator';
import { TDP } from './routes/TDP/TDP';
import { TranscribersSummary } from './routes/transcribers/TranscribersSummary';
import { PATHS } from './types';

const history = createBrowserHistory();

function App() {
  const { keycloak, keycloakInitialized, initKeycloak } = useKeycloak();
  const { api, apiInitialized, initApi } = useApi();
  const i18n = useI18n();
  const navigationProps = useNavigationProps();

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
      console.log('keycloak', keycloak);
      console.log('keycloak.user', keycloak.user);
      // if (keycloak.user.organizationId === undefined) keycloak.logout();
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
    <RootProvider keycloak={keycloak} api={api} i18n={i18n} navigationProps={navigationProps} >
      <Router history={history}>
        <Header />
        <Route exact path={PATHS.home.to} component={Home} />
        <Route path={PATHS.IAM.to} component={IAM} />
        <Route exact path={PATHS.projects.to} component={Projects} />
        <Route exact path={PATHS.project.to} component={ProjectDetails} />
        <Route exact path={PATHS.TDP.to} component={TDP} />
        <Route exact path={PATHS.editor.to} component={Editor} />
        <Route path={PATHS.models.to} component={Models} />
        <Route path={PATHS.profile.to} component={UserProfile} />
        <Route path={PATHS.transcribers.to} component={TranscribersSummary} />
      </Router>
    </RootProvider>
  );
}

export default App;
