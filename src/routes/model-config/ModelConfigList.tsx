import { Chip, Container, Grid, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { useSnackbar } from 'notistack';
import React from 'react';
import { BulletList } from 'react-content-loader';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../theme';
import { AcousticModel, LanguageModel, ModelConfig, Project, SubGraph, TopGraph } from '../../types';
import { SnackbarError } from '../../types/';
import { PATHS } from '../../types/path.types';
import log from '../../util/log/logger';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { Breadcrumb, HeaderBreadcrumbs } from '../shared/HeaderBreadcrumbs';
import { ModelConfigDialog } from './ModelConfigDialog';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    cardContent: {
      padding: 0,
    },
    text: {
      overflowWrap: 'break-word'
    },
    category: {
      marginRight: theme.spacing(1),
    },
    chip: {
      marginRight: theme.spacing(0.5),
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
    },
    listItem: {
      width: '100%',
      paddingLeft: 24,
    },
    expandContent: {
      marginBottom: 10,
      paddingLeft: 0,
      paddingRight: 0,
    },
  }),
);

export interface ModelConfigListProps {
  project: Project;
  canModify: boolean;
  modelConfigsLoading: boolean;
  modelConfigs: ModelConfig[];
  topGraphs: TopGraph[];
  subGraphs: SubGraph[];
  acousticModels: AcousticModel[];
  languageModels: LanguageModel[];
  handleModelConfigUpdate: (modelConfig: ModelConfig, isEdit?: boolean) => void;
  handleSubGraphListUpdate: (subGraph: SubGraph, isEdit?: boolean) => void;
  handleAcousticModelCreate: (acousticModel: AcousticModel) => void;
  handleLanguageModelCreate: (languageModel: LanguageModel) => void;
  handleModelConfigDelete: (modelConfigId: string) => void;
}


export function ModelConfigList(props: ModelConfigListProps) {
  const {
    project,
    canModify,
    modelConfigsLoading,
    modelConfigs,
    handleModelConfigUpdate,
    handleSubGraphListUpdate,
    handleAcousticModelCreate,
    handleLanguageModelCreate,
    handleModelConfigDelete,
    topGraphs,
    subGraphs,
    languageModels,
    acousticModels
  } = props;
  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const [configOpen, setCreateOpen] = React.useState(false);
  const [modelConfigToEdit, setModelConfigToEdit] = React.useState<ModelConfig | undefined>(undefined);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>, modelConfig: ModelConfig) => {
    event.stopPropagation();
    setModelConfigToEdit(modelConfig);
    setAnchorEl(event.currentTarget);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
  };

  const openEditDialog = () => {
    handleActionClose();
    setCreateOpen(true);
  };

  const closeDialog = () => {
    setModelConfigToEdit(undefined);
    setCreateOpen(false);
  };

  const openCreateDialog = () => setCreateOpen(true);

  const confirmDelete = () => {
    handleActionClose();
    setConfirmationOpen(true);
  };

  const closeConfirmation = () => {
    setConfirmationOpen(false);
    setModelConfigToEdit(undefined);
  };

  const handleDelete = async () => {
    if (api?.modelConfig && modelConfigToEdit) {
      setDeleteLoading(true);
      const modelConfigId = modelConfigToEdit.id;
      closeConfirmation();
      const response = await api.modelConfig.deleteModelConfig(project.id, modelConfigId);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        handleModelConfigDelete(modelConfigId);
      } else {
        log({
          file: `ModelConfigList.tsx`,
          caller: `handleDelete - failed to delete model config`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setDeleteLoading(false);
    }
  };

  const classes = useStyles();

  const renderItemMenu = () => (<Menu
    id="list-item-menu"
    anchorEl={anchorEl}
    keepMounted
    open={Boolean(anchorEl)}
    onClose={handleActionClose}
  >
    <MenuItem disabled={deleteLoading} onClick={openEditDialog}>
      <ListItemIcon>
        <EditIcon fontSize="small" />
      </ListItemIcon>
      <Typography variant="inherit">{translate('common.edit')}</Typography>
    </MenuItem>
    <MenuItem onClick={confirmDelete}>
      <ListItemIcon>
        <DeleteIcon fontSize="small" />
      </ListItemIcon>
      <Typography variant="inherit">{translate('common.delete')}</Typography>
    </MenuItem>
  </Menu>);

  const renderListItems = () => modelConfigs.map(modelConfig => {
    const { acousticModel, languageModel, name, id, thresholdHc, thresholdLc, description } = modelConfig;
    return (
      <ExpansionPanel
        key={id}
        elevation={2}
      >
        <ExpansionPanelSummary
          aria-controls="model-config-expand"
          id="model-config-expand"
          expandIcon={<IconButton aria-label="edit" onClick={(event) => handleActionClick(event, modelConfig)} >
            <MoreVertIcon />
          </IconButton>}
        >
          <CardHeader
            title={name}
            subheader={description}
          />
        </ExpansionPanelSummary>
        <ExpansionPanelDetails
          className={classes.expandContent}
        >
          <Grid
            container
            wrap='nowrap'
            direction='column'
            alignContent='center'
            alignItems='center'
            justify='flex-start'
          ><Card
            elevation={0}
            className={classes.listItem}
          >
              <CardContent>
                <Grid
                  container
                  wrap='nowrap'
                  direction='row'
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                >
                  <Typography
                    className={classes.category}
                    variant='subtitle2'
                  >
                    {`${translate('forms.thresholdLc')}:`}
                  </Typography>
                  <Typography gutterBottom color="textSecondary" className={classes.text}>
                    {thresholdLc}
                  </Typography>
                </Grid>
                <Grid
                  container
                  wrap='nowrap'
                  direction='row'
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                >
                  <Typography
                    className={classes.category}
                    variant='subtitle2'
                  >
                    {`${translate('forms.thresholdHc')}:`}
                  </Typography>
                  <Typography gutterBottom color="textSecondary" className={classes.text}>
                    {thresholdHc}
                  </Typography>
                </Grid>
              </CardContent>
            </Card>
            <Card
              elevation={0}
              className={classes.listItem}
            >
              <CardHeader
                title={translate('forms.languageModel')}
                titleTypographyProps={{ variant: 'h6' }}
                subheader={languageModel.name}
              />
              <CardContent>
                <Grid
                  container
                  wrap='nowrap'
                  direction='row'
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                >
                  <Typography
                    className={classes.category}
                    variant='subtitle2'
                  >
                    {`${translate('forms.top')}:`}
                  </Typography>
                  <Typography gutterBottom color="textSecondary" className={classes.text}>
                    {languageModel.topGraph.name}
                  </Typography>
                </Grid>
                <Grid
                  container
                  wrap='nowrap'
                  direction='row'
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                >
                  <Typography
                    className={classes.category}
                    variant='subtitle2'
                  >
                    {`${translate('forms.sub')}:`}
                  </Typography>
                  {languageModel.subGraphs.map((subGraph, index) => <Chip key={index}
                    label={subGraph.name}
                    className={classes.chip}
                  />)}
                </Grid>
              </CardContent>
            </Card>
            <Card
              elevation={0}
              className={classes.listItem}
            >
              <CardHeader
                title={translate('forms.acousticModel')}
                titleTypographyProps={{ variant: 'h6' }}
                subheader={acousticModel.name}
              />
              <CardContent>
                <Grid
                  container
                  wrap='nowrap'
                  direction='row'
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                >
                  <Typography
                    className={classes.category}
                    variant='subtitle2'
                  >
                    {`${translate('forms.sampleRate')}:`}
                  </Typography>
                  <Typography gutterBottom component="p" className={classes.text}>
                    {acousticModel.sampleRate}{' kHz'}
                  </Typography>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          {renderItemMenu()}
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  });

  const breadcrumbs: Breadcrumb[] = [
    {
      to: PATHS.project.function && PATHS.project.function(project.id),
      rawTitle: project.name,
    },
    {
      rawTitle: translate("modelConfig.header", { count: modelConfigs.length }),
    },
  ];

  return (
    <Container >
      <Card elevation={0} >
        <CardHeader
          title={<HeaderBreadcrumbs breadcrumbs={breadcrumbs} />}
          action={canModify && <Button
            color="primary"
            variant='contained'
            onClick={openCreateDialog}
            startIcon={<AddIcon />}
          >
            {translate('modelConfig.create')}
          </Button>}
        />
        {modelConfigsLoading ? <BulletList /> : (
          <CardContent className={classes.cardContent} >
            <Container >
              {renderListItems()}
            </Container>
          </CardContent>)}
      </Card>
      <ModelConfigDialog
        projectId={project.id}
        open={configOpen}
        configToEdit={modelConfigToEdit}
        onClose={closeDialog}
        onSuccess={handleModelConfigUpdate}
        topGraphs={topGraphs}
        subGraphs={subGraphs}
        languageModels={languageModels}
        acousticModels={acousticModels}
        handleSubGraphListUpdate={handleSubGraphListUpdate}
        handleAcousticModelCreate={handleAcousticModelCreate}
        handleLanguageModelCreate={handleLanguageModelCreate}
      />
      <ConfirmationDialog
        destructive
        titleText={`${translate('modelConfig.delete')}?`}
        submitText={translate('common.delete')}
        open={confirmationOpen}
        onSubmit={handleDelete}
        onCancel={closeConfirmation}
      />
    </Container>
  );
}