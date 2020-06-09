import Paper from '@material-ui/core/Paper';
import { Box, Card, CardContent, CardHeader, Container, Grid, TextField, Typography } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import clsx from 'clsx';
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
import {
    AcousticModel,
    DataSet,
    VoiceData,
    LanguageModel,
    ModelConfig,
    PATHS,
    Project,
    SubGraph,
    TopGraph,
    BooleanById,
    PaginatedResults,
    TranscriberStats } from '../../types';
import { TabPanel } from '../shared/TabPanel';
import SET from '../projects/set/SET';
import { TDP } from '../projects/TDP/TDP';
import { AdminTable } from './components/TranscriptionManagementTable';
import log from '../../util/log/logger';
import { setPageTitle } from '../../util/misc';
import { AddTranscriberDialog } from '../projects/set/components/AddTranscriberDialog';
import { NotFound } from '../shared/NotFound';
import { CustomTheme } from '../../theme';

const useStyles = makeStyles((theme) =>
    createStyles({
        root: {
            backgroundColor: theme.palette.background.default,
        },
        card: {
            backgroundColor: theme.palette.background.default,
            justifyContent: 'flex-start',
        },
        cardContent: {
            marginLeft: 10,
            padding: 0,
        },
        infoBox: {
            minHeight: 180,
        },
        boxSpacing: {
            marginRight: theme.spacing(1),
        },
        apiHeading: {
            minWidth: 75,
            margin: theme.spacing(1),
        },
        summaryHeading: {
            minWidth: 75,
            margin: theme.spacing(1),
            size: '16px',
            color: '#077db5'
        },
        apiInfo: {
            minWidth: 250,
            backgroundColor: theme.palette.grey[200],
        },
        refreshButton: {
            marginTop: theme.spacing(1),
        },
        textField: {
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(1),
        },
    }),
);

export function TranscriptionManagement() {
    //temporary hardcoded projectId for setting up dummy component
    const projectId = "845ad229-580f-449f-9368-241e2ddf2d64"
    const [transcriberStatDataLoading, setTranscriberStatDataLoading] = React.useState(true);
    const [transcribersStats, setTranscribersStats] = React.useState<TranscriberStats[]>([]);
    const [pagination, setPagination] = React.useState<PaginatedResults>({} as PaginatedResults);
    const [isForbidden, setIsForbidden] = React.useState(false);
    // const { projectId } = match.params;
    const { translate } = React.useContext(I18nContext);
    const api = React.useContext(ApiContext);
    const history = useHistory();
    const { hasPermission, roles } = React.useContext(KeycloakContext);
    const [navigationProps, setNavigationProps] = useGlobal('navigationProps');
    const [isValidProject, setIsValidProject] = React.useState(true);
    const [projectLoading, setProjectLoading] = React.useState(true);
    const [project, setProject] = React.useState<Project | undefined>();
    const [modelConfigs, setModelConfigs] = React.useState<ModelConfig[]>([]);
    const [voiceData, setVoiceData] = React.useState<VoiceData[]>([]);
    const [modelConfigsLoading, setModelConfigsLoading] = React.useState(true);
    const [transcribersDialogOpen, setTranscribersDialogOpen] = React.useState(false);
    const [selectedDataSet, setSelectedDataSet] = React.useState<DataSet | undefined>();
    const [selectedDataSetIndex, setSelectedDataSetIndex] = React.useState<number | undefined>();

    const theme: CustomTheme = useTheme();
    const classes = useStyles();


    const onUpdateDataSetSuccess = (updatedDataSet: DataSet, dataSetIndex: number): void => {
        setVoiceData((prevDataSets) => {
            const updatedDataSets = [...prevDataSets];
            updatedDataSets.splice(dataSetIndex, 1, updatedDataSet);
            return updatedDataSets;
        });
    };

    const openTranscriberDialog = () => setTranscribersDialogOpen(true);

    const handleTranscriberEditClick = (dataSetIndex: number) => {
        setSelectedDataSet(voiceData[dataSetIndex]);
        setSelectedDataSetIndex(dataSetIndex);
        openTranscriberDialog();
    };

    const closeTranscriberDialog = () => {
        setTranscribersDialogOpen(false);
        setSelectedDataSet(undefined);
        setSelectedDataSetIndex(undefined);
    };

    const hasAdminPermissions = React.useMemo(() => hasPermission(roles, PERMISSIONS.projects.administration), [roles]);
    const hasModelConfigPermissions = React.useMemo(() => hasPermission(roles, PERMISSIONS.modelConfig), [roles]);
    const hasTdpPermissions = React.useMemo(() => hasPermission(roles, PERMISSIONS.projects.TDP), [roles]);

    const getProject = async () => {
        if (api?.projects) {
            const response = await api.projects.getProject(projectId);
            if (response.kind === 'ok') {
                setProject(response.project);
                setIsValidProject(true);
            } else if (response.kind === ProblemKind["not-found"]) {
                log({
                    file: `Admin.tsx`,
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
        if (api?.voiceData) {
            const response = await api.voiceData.getHistory();
            if (response.kind === 'ok') {
                setVoiceData(response.voiceData);
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
        if (!projectId) {
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
        if (hasTdpPermissions) {
            getAllDataSets();
        }
    }, [api, projectId]);

    React.useEffect(() => {
        setPageTitle(translate('admin.pageTitle'));
    }, []);

    React.useEffect(() => {
        getTranscribersWithStats();
    }, []);

    const renderSummary = () => {
        if (!project || !isValidProject) {
            return <NotFound text={translate('projects.notFound')} />;
        }
        return (<Card elevation={0} className={classes.card} >
            <CardHeader
                title={<Typography variant='h4'>{translate('admin.pageTitle')}</Typography>}
            />
            <CardContent className={classes.cardContent} >

                {projectLoading ? <BulletList /> :
                    <Grid
                        container
                        direction='row'
                        justify='flex-start'
                        alignItems='flex-start'
                        alignContent='center'
                        spacing={2}
                    >
                        <Grid
                            container
                            item
                            direction='column'
                            component={Box}
                            border={1}
                            borderColor={theme.table.border}
                            xs={5}
                            className={clsx(classes.infoBox, classes.boxSpacing)}
                        >
                            <Typography align='left' className={classes.summaryHeading} >{translate('common.summary')}</Typography>
                            <Grid
                                container
                                item
                                direction='row'
                                justify='flex-start'
                                alignItems='center'
                                alignContent='center'
                            >
                                <Typography align='left' className={classes.apiHeading} >{translate('projects.apiKey')}</Typography>
                                <TextField
                                    id="api-key"
                                    value={project?.apiKey ?? ""}
                                    className={clsx(classes.textField, classes.apiInfo)}
                                    margin="normal"
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid container
                                  item
                                  direction='row'
                                  justify='flex-start'
                                  alignItems='center'
                                  alignContent='center'>
                                <Typography align='left' className={classes.apiHeading} >{translate('projects.apiKey')}</Typography>
                                <TextField
                                    id="api-key"
                                    value={project?.apiKey ?? ""}
                                    className={clsx(classes.textField, classes.apiInfo)}
                                    margin="normal"
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid container
                                  item
                                  direction='row'
                                  justify='flex-start'
                                  alignItems='center'
                                  alignContent='center'>
                                <Typography align='left' className={classes.apiHeading} >{translate('projects.apiKey')}</Typography>
                                <TextField
                                    id="api-key"
                                    value={project?.apiKey ?? ""}
                                    className={clsx(classes.textField, classes.apiInfo)}
                                    margin="normal"
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                    variant="outlined"
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                }
            </CardContent>
        </Card>);
    };

    return (
        <Container>
            <Paper square elevation={0} className={classes.root} >
                <AddTranscriberDialog
                    transcribers={transcribersStats}
                    transcribersLoading={transcriberStatDataLoading}
                    open={transcribersDialogOpen}
                    onClose={closeTranscriberDialog}
                    projectId={projectId}
                    dataSet={selectedDataSet}
                    dataSetIndex={selectedDataSetIndex}
                    onUpdateDataSetSuccess={onUpdateDataSetSuccess}
                />
                {
                    projectLoading ? <BulletList /> : renderSummary()
                }
                {project && isValidProject &&
                    <AdminTable
                        projectId={projectId}
                        voiceData={voiceData}
                        openTranscriberDialog={handleTranscriberEditClick}
                    />
                }
            </Paper>
        </Container>
    );
}