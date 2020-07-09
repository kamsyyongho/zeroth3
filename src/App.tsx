
import { createBrowserHistory } from 'history';
import ErrorBoundary, { withErrorBoundary } from 'react-error-boundary';
import { Route, Router, Switch } from "react-router-dom";
import React, { addCallback, setGlobal } from "reactn";
import { useApi } from './hooks/api/useApi';
import { useI18n } from './hooks/i18n/useI18n';
import { useKeycloak } from './hooks/keycloak/useKeycloak';
import RootProvider from './hooks/Rootprovider';
import "./i18n"; // to immediately initialize i18n
import { EditorPage } from './routes/editor/EditorPage';
import { IAM } from './routes/IAM/IAM';
import { Home } from './routes/main/Home';
import { ModelConfigPage } from './routes/model-config/ModelConfigPage';
import { ModelTraining } from './routes/model-training/ModelTraining';
import { Models } from './routes/models/Models';
import { Profile } from './routes/profile/Profile';
import { ProjectDetails } from './routes/projects/ProjectDetails';
import { Header } from './routes/shared/header/Header';
import { NotFound } from './routes/shared/NotFound';
import { PageErrorFallback } from './routes/shared/PageErrorFallback';
import { SiteLoadingIndicator } from './routes/shared/SiteLoadingIndicator';
import { Transcription } from './routes/transcription/Transcription';
import { History } from './routes/history/History';
import { LOCAL_STORAGE_KEYS, PATHS } from './types';

const history = createBrowserHistory();

function App() {
  const { keycloak, keycloakInitialized, initKeycloak } = useKeycloak();
  const { api, apiInitialized, initApi } = useApi();
  const i18n = useI18n();

  React.useEffect(() => {
    console.log('========= App,,,,,, ');
    initKeycloak();
    initApi(keycloak.keycloak, keycloak.logout);
    // update local storage on change
    const globalCallback = addCallback(globalState => {
      if (globalState.currentProject?.id) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.PROJECT_ID, globalState.currentProject.id);
      }
      if (globalState.currentOrganization?.id) {
        localStorage.setItem(
          LOCAL_STORAGE_KEYS.ORGANIZATION_ID,
          globalState.currentOrganization.id
        );
      }
      if (globalState.wordConfidenceThreshold) {
        localStorage.setItem(
          LOCAL_STORAGE_KEYS.WORD_CONFIDENCE_THRESHOLD,
          globalState.wordConfidenceThreshold.toString(),
        );
      }
    });
    return () => {
      // remove the callbacks
      globalCallback();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //
  // React.useEffect(() => {
  //   if (keycloakInitialized) {
  //     initApi(keycloak.keycloak, keycloak.logout);
  //   }
  // }, [keycloakInitialized]);

  if (!keycloakInitialized || !apiInitialized) {
    return (<SiteLoadingIndicator />);
  }


  return (
    <RootProvider keycloak={keycloak} api={api} i18n={i18n} >
      <Router history={history}>
        <ErrorBoundary FallbackComponent={PageErrorFallback}>
          <Header />
        </ErrorBoundary>
        <Switch>
          <Route exact path={PATHS.home.to} component={withErrorBoundary(Home, PageErrorFallback)} />
          <Route path={PATHS.IAM.to} component={withErrorBoundary(IAM, PageErrorFallback)} />
          <Route exact path={PATHS.project.to} component={withErrorBoundary(ProjectDetails, PageErrorFallback)} />
          <Route exact path={PATHS.modelConfig.to} component={withErrorBoundary(ModelConfigPage, PageErrorFallback)} />
          <Route path={PATHS.editor.to} component={withErrorBoundary(EditorPage, PageErrorFallback)} />
          <Route path={PATHS.models.to} component={withErrorBoundary(Models, PageErrorFallback)} />
          <Route path={PATHS.profile.to} component={withErrorBoundary(Profile, PageErrorFallback)} />
          <Route path={PATHS.modelTraining.to} component={withErrorBoundary(ModelTraining, PageErrorFallback)} />
          //withErroBoundary causes the initial render to occur twice, therefore removed from two components that call api in initial render
          <Route path={PATHS.transcription.to} component={Transcription} />
          <Route path={PATHS.history.to} component={History} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    </RootProvider>
  );
}

export default App;
