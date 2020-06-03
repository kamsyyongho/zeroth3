import Paper from '@material-ui/core/Paper';
import { Card, CardContent, CardHeader, Container, Grid, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { RouteComponentProps } from "react-router";
import { useHistory } from 'react-router-dom';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import React, { useGlobal } from "reactn";
import { BulletList } from 'react-content-loader';
import { PERMISSIONS } from '../../constants';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { ApiContext } from '../../hooks/api/ApiContext';
import { ProblemKind } from '../../services/api/types';
import { BooleanById, DataSet, ModelConfig, PaginatedResults, Project, TranscriberStats } from '../../types';
import { TabPanel } from '../shared/TabPanel';
import SET from '../projects/set/SET';
import { TDP } from '../projects/TDP/TDP';
import log from '../../util/log/logger';
import { setPageTitle } from '../../util/misc';

const STARTING_TAB_INDEX = 0;
enum TAB_INDEX {
    TDP,
    SET,
}

const useStyles = makeStyles((theme) =>
    createStyles({
        root: {
            backgroundColor: theme.palette.background.default,
        },
        card: {
            backgroundColor: theme.palette.background.default,
        },
        cardContent: {
            padding: 0,
        },
    }),
);

export type CheckedSubGraphById = BooleanById;

interface AdminProps {
    projectId: string;
}

export function Admin({ match }: RouteComponentProps<AdminProps>) {
    const [activeTab, setActiveTab] = React.useState(STARTING_TAB_INDEX);
    const [refreshCounterForSet, setRefreshCounterForSet] = React.useState(0);
    const [transcriberStatDataLoading, setTranscriberStatDataLoading] = React.useState(true);
    const [transcribersStats, setTranscribersStats] = React.useState<TranscriberStats[]>([]);
    const [pagination, setPagination] = React.useState<PaginatedResults>({} as PaginatedResults);
    const [isForbidden, setIsForbidden] = React.useState(false);

    const classes = useStyles();

    /** used to prevent tabs from rendering before they should be displayed */
    const tabsThatShouldRender = React.useMemo<Set<number>>(() => new Set([activeTab]), []);









    const { projectId } = match.params;
    const { translate } = React.useContext(I18nContext);
    const api = React.useContext(ApiContext);
    const history = useHistory();
    const { hasPermission, roles } = React.useContext(KeycloakContext);
    const [navigationProps, setNavigationProps] = useGlobal('navigationProps');
    const [isValidId, setIsValidId] = React.useState(true);
    const [isValidProject, setIsValidProject] = React.useState(true);
    const [projectLoading, setProjectLoading] = React.useState(true);
    const [project, setProject] = React.useState<Project | undefined>();
    const [modelConfigs, setModelConfigs] = React.useState<ModelConfig[]>([]);
    const [topGraphs, setTopGraphs] = React.useState<TopGraph[]>([]);
    const [subGraphs, setSubGraphs] = React.useState<SubGraph[]>([]);
    const [languageModels, setLanguageModels] = React.useState<LanguageModel[]>([]);
    const [acousticModels, setAcousticModels] = React.useState<AcousticModel[]>([]);
    const [dataSets, setDataSets] = React.useState<DataSet[]>([]);
    const [modelConfigsLoading, setModelConfigsLoading] = React.useState(true);
    const [updateSecretLoading, setUpdateSecretLoading] = React.useState(false);
    const [topGraphsLoading, setTopGraphsLoading] = React.useState(true);
    const [subGraphsLoading, setSubGraphsLoading] = React.useState(true);
    const [languageModelsLoading, setLanguageModelsLoading] = React.useState(true);
    const [acousticModelsLoading, setAcousticModelsLoading] = React.useState(true);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [hideBackdrop, setHideBackdrop] = React.useState(false);


    const openDialog = (hideBackdrop = false) => {
        setHideBackdrop(hideBackdrop);
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setHideBackdrop(false);
        setDialogOpen(false);
    };

    const hasAdminPermissions = React.useMemo(() => hasPermission(roles, PERMISSIONS.projects.administration), [roles]);
    const hasModelConfigPermissions = React.useMemo(() => hasPermission(roles, PERMISSIONS.modelConfig), [roles]);
    const hasTdpPermissions = React.useMemo(() => hasPermission(roles, PERMISSIONS.projects.TDP), [roles]);

    /**
     * navigates to the the model config page
     * - passes the project to prevent the need for unnecessary loads
     */
    const handleModelConfigClick = () => {
        if (!project) return;
        // to store props that will be used on the next page
        const propsToSet = { project, modelConfigs, topGraphs, subGraphs, languageModels, acousticModels };
        setNavigationProps(propsToSet);
        PATHS.modelConfig.function && history.push(PATHS.modelConfig.function(project.id));
    };

    const updateSecret = async () => {
        if (api?.projects && project) {
            setProject({ ...project, apiSecret: '' });
            setUpdateSecretLoading(true);
            const response = await api.projects.updateSecret(projectId);
            if (response.kind === 'ok') {
                setProject(response.project);
            } else {
                log({
                    file: `ProjectDetails.tsx`,
                    caller: `updateSecret - failed to update secret`,
                    value: response,
                    important: true,
                });
            }
            setUpdateSecretLoading(false);
        }
    };

    React.useEffect(() => {
        const getProject = async () => {
            if (api?.projects) {
                const response = await api.projects.getProject(projectId);
                if (response.kind === 'ok') {
                    setProject(response.project);
                } else if (response.kind === ProblemKind["not-found"]) {
                    log({
                        file: `ProjectDetails.tsx`,
                        caller: `getProject - project does not exist`,
                        value: response,
                        important: true,
                    });
                    setIsValidProject(false);
                } else {
                    log({
                        file: `ProjectDetails.tsx`,
                        caller: `getProject - failed to get project`,
                        value: response,
                        important: true,
                    });
                }
                setProjectLoading(false);
            }
        };
        const getModelConfigs = async () => {
            if (api?.modelConfig) {
                const response = await api.modelConfig.getModelConfigs(projectId);
                if (response.kind === 'ok') {
                    setModelConfigs(response.modelConfigs);
                } else {
                    log({
                        file: `ProjectDetails.tsx`,
                        caller: `getModelConfigs - failed to get model configs`,
                        value: response,
                        important: true,
                    });
                }
                setModelConfigsLoading(false);
            }
        };
        const getAllDataSets = async () => {
            if (api?.dataSet && projectId) {
                const response = await api.dataSet.getAll(projectId);
                if (response.kind === 'ok') {
                    setDataSets(response.dataSets);
                } else {
                    log({
                        file: `ProjectDetails.tsx`,
                        caller: `getAllDataSets - failed to get data sets`,
                        value: response,
                        important: true,
                    });
                }
            }
        };
        const getTopGraphs = async () => {
            if (api?.models) {
                const response = await api.models.getTopGraphs();
                if (response.kind === 'ok') {
                    setTopGraphs(response.topGraphs);
                } else {
                    log({
                        file: `ProjectDetails.tsx`,
                        caller: `getTopGraphs - failed to get topgraphs`,
                        value: response,
                        important: true,
                    });
                }
                setTopGraphsLoading(false);
            }
        };
        const getSubGraphs = async () => {
            if (api?.models) {
                const response = await api.models.getSubGraphs();
                if (response.kind === 'ok') {
                    setSubGraphs(response.subGraphs);
                } else {
                    log({
                        file: `ProjectDetails.tsx`,
                        caller: `getSubGraphs - failed to get subgraphs`,
                        value: response,
                        important: true,
                    });
                }
                setSubGraphsLoading(false);
            }
        };
        const getLanguageModels = async () => {
            if (api?.models) {
                const response = await api.models.getLanguageModels();
                if (response.kind === 'ok') {
                    setLanguageModels(response.languageModels);
                } else {
                    log({
                        file: `ProjectDetails.tsx`,
                        caller: `getLanguageModels - failed to get language models`,
                        value: response,
                        important: true,
                    });
                }
                setLanguageModelsLoading(false);
            }
        };
        const getAcousticModels = async () => {
            if (api?.models) {
                const response = await api.models.getAcousticModels();
                if (response.kind === 'ok') {
                    setAcousticModels(response.acousticModels);
                } else {
                    log({
                        file: `ProjectDetails.tsx`,
                        caller: `getAcousticModels - failed to get acoustic models`,
                        value: response,
                        important: true,
                    });
                }
                setAcousticModelsLoading(false);
            }
        };
        if (!projectId) {
            setIsValidId(false);
            setProjectLoading(false);
            log({
                file: `ProjectDetails.tsx`,
                caller: `project id not valid`,
                value: projectId,
                important: true,
            });
        } else {
            getProject();
            if (hasModelConfigPermissions) {
                getModelConfigs();
            }
        }
        if (hasModelConfigPermissions) {
            getTopGraphs();
            getSubGraphs();
            getLanguageModels();
            getAcousticModels();
        }
        if (hasTdpPermissions) {
            getAllDataSets();
        }
    }, [api, projectId]);

    React.useEffect(() => {
        setPageTitle(translate('path.projects'));
    }, []);

    const handleModelConfigUpdate = (modelConfig: ModelConfig) => {
        setModelConfigs(prevConfigs => {
            prevConfigs.push(modelConfig);
            return prevConfigs;
        });
    };

    const handleSubGraphListUpdate = (newSubGraph: SubGraph) => {
        setSubGraphs((prevSubGraphs) => {
            prevSubGraphs.push(newSubGraph);
            return prevSubGraphs;
        });
    };

    const handleLanguageModelCreate = (newLanguageModel: LanguageModel) => {
        setLanguageModels((prevLanguageModels) => {
            prevLanguageModels.push(newLanguageModel);
            return prevLanguageModels;
        });
    };













    const handleChange = (event: React.ChangeEvent<{}>, newActiveTab: number) => {
        tabsThatShouldRender.add(newActiveTab);
        setActiveTab(newActiveTab);
    };

    /**
     * Increments the counter that is passed to the `SET` component
     * - the child component refetches all data everytime the counter changes
     */
    const handleSetCreate = () => {
        if (tabsThatShouldRender.has(TAB_INDEX.SET)) {
            setRefreshCounterForSet(refreshCounterForSet + 1);
        }
    };

    const getTranscribersWithStats = async (page?: number, size = 10000) => {
        if (api?.transcriber) {
            setTranscriberStatDataLoading(true);
            const response = await api.transcriber.getTranscribersWithStats(page, size);
            if (response.kind === 'ok') {
                setTranscribersStats(response.transcribersStats);
                setPagination(response.pagination);
            } else {
                if (response.kind === ProblemKind['forbidden']) {
                    setIsForbidden(true);
                }
                log({
                    file: `SET.tsx`,
                    caller: `getTranscribersWithStats - failed to get transcribers stat data`,
                    value: response,
                    important: true,
                });
            }
            setTranscriberStatDataLoading(false);
        }
    };

    React.useEffect(() => {
        getTranscribersWithStats();
    }, []);

    return (
        <Container>
            <Paper square elevation={0} className={classes.root} >
                    <TDP
                        projectId={projectId}
                        project={project}
                        modelConfigs={modelConfigs}
                        dataSets={dataSets}
                        onSetCreate={handleSetCreate}
                        openModelConfigDialog={openDialog}
                        modelConfigDialogOpen={dialogOpen}
                        transcriberStats={transcribersStats}
                    />
            </Paper>
        </Container>
    );
}