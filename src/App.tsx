
import { createBrowserHistory } from 'history';
import React from "react";
import ErrorBoundary, { withErrorBoundary } from 'react-error-boundary';
import { Route, Router, Switch } from "react-router-dom";
import { useApi } from './hooks/api/useApi';
import { useGlobalState } from './hooks/global-state/useGlobalState';
import { useI18n } from './hooks/i18n/useI18n';
import { useKeycloak } from './hooks/keycloak/useKeycloak';
import { useNavigationProps } from './hooks/navigation-props/useNavigationProps';
import RootProvider from './hooks/Rootprovider';
import "./i18n"; // to immediately initialize i18n
import { Editor } from './routes/editor/Editor';
import { IAM } from './routes/IAM/IAM';
import { Home } from './routes/main/Home';
import { ModelConfigPage } from './routes/model-config/ModelConfigPage';
import { Models } from './routes/models/Models';
import { Profile } from './routes/profile/Profile';
import { ProjectDetails } from './routes/projects/ProjectDetails';
import { Header } from './routes/shared/header/Header';
import { NotFound } from './routes/shared/NotFound';
import { PageErrorFallback } from './routes/shared/PageErrorFallback';
import { SiteLoadingIndicator } from './routes/shared/SiteLoadingIndicator';
import { PATHS } from './types';

const history = createBrowserHistory();

function App() {
  const { keycloak, keycloakInitialized, initKeycloak } = useKeycloak();
  const { api, apiInitialized, initApi } = useApi();
  const i18n = useI18n();
  const navigationProps = useNavigationProps();
  const globalState = useGlobalState();

  React.useEffect(() => {
    initKeycloak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (keycloakInitialized) {
      initApi(keycloak.keycloak, keycloak.logout);
    }
  }, [keycloakInitialized]);

  if (!keycloakInitialized || !apiInitialized) {
    return (<SiteLoadingIndicator />);
  }

  return (
    <RootProvider keycloak={keycloak} api={api} i18n={i18n} navigationProps={navigationProps} globalState={globalState} >
      <Router history={history}>
        <ErrorBoundary FallbackComponent={PageErrorFallback}>
          <Header />
        </ErrorBoundary>
        <Switch>
          <Route exact path={PATHS.home.to} component={withErrorBoundary(Home, PageErrorFallback)} />
          <Route path={PATHS.IAM.to} component={withErrorBoundary(IAM, PageErrorFallback)} />
          <Route exact path={PATHS.project.to} component={withErrorBoundary(ProjectDetails, PageErrorFallback)} />
          <Route exact path={PATHS.modelConfig.to} component={withErrorBoundary(ModelConfigPage, PageErrorFallback)} />
          <Route path={PATHS.editor.to} component={withErrorBoundary(Editor, PageErrorFallback)} />
          <Route path={PATHS.models.to} component={withErrorBoundary(Models, PageErrorFallback)} />
          <Route path={PATHS.profile.to} component={withErrorBoundary(Profile, PageErrorFallback)} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    </RootProvider>
  );
}

export default App;
