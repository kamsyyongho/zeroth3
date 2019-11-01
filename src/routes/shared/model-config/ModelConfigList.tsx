import { Container, ListItemSecondaryAction, ListSubheader, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import React from 'react';
import { BulletList } from 'react-content-loader';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { AcousticModel, LanguageModel, ModelConfig, SubGraph, TopGraph } from '../../../types';
import { ModelConfigDialog } from './ModelConfigDialog';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      padding: 0,
      marginHorizontal: 0,
      marginBottom: 0,
      marginTop: 20,
    },
    cardContent: {
      padding: 0,
    },
    card: {
      minWidth: 275,
    },
    text: {
      overflowWrap: 'break-word'
    }
  }),
);

export interface ModelConfigListProps {
  projectId: number;
  modelConfigsLoading: boolean;
  modelConfigs: ModelConfig[];
  topGraphs: TopGraph[];
  subGraphs: SubGraph[];
  acousticModels: AcousticModel[];
  languageModels: LanguageModel[];
  handleModelConfigCreate: (modelConfig: ModelConfig) => void;
  handleSubGraphCreate: (subGraph: SubGraph) => void;
  handleAcousticModelCreate: (acousticModel: AcousticModel) => void;
  handleLanguageModelCreate: (languageModel: LanguageModel) => void;
}


export function ModelConfigList(props: ModelConfigListProps) {
  const {
    projectId,
    modelConfigsLoading,
    modelConfigs,
    handleModelConfigCreate,
    handleSubGraphCreate,
    handleAcousticModelCreate,
    handleLanguageModelCreate,
    topGraphs,
    subGraphs,
    languageModels,
    acousticModels
  } = props;
  const { translate } = React.useContext(I18nContext);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const [configOpen, setCreateOpen] = React.useState(false);
  const [modelConfigToEdit, setModelConfigToEdit] = React.useState<ModelConfig | undefined>(undefined);

  const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
  };

  const openEditDialog = (modelConfigToEdit: ModelConfig) => {
    setModelConfigToEdit(modelConfigToEdit);
    setCreateOpen(true);
  };

  const closeDialog = () => {
    setModelConfigToEdit(undefined);
    setCreateOpen(false);
  };

  const openCreateDialog = () => setCreateOpen(true);

  const classes = useStyles();

  const renderItemMenu = () => (<Menu
    id="list-item-menu"
    anchorEl={anchorEl}
    keepMounted
    open={Boolean(anchorEl)}
    onClose={handleActionClose}
  >
    <MenuItem onClick={handleActionClose}>
      <ListItemIcon>
        <EditIcon fontSize="small" />
      </ListItemIcon>
      <Typography variant="inherit">{translate('common.edit')}</Typography>
    </MenuItem>
    <MenuItem onClick={handleActionClose}>
      <ListItemIcon>
        <DeleteIcon fontSize="small" />
      </ListItemIcon>
      <Typography variant="inherit">{translate('common.delete')}</Typography>
    </MenuItem>
  </Menu>);

  const renderListItems = () => modelConfigs.map(modelConfig => {
    const { acousticModel, languageModel, name, id, description } = modelConfig;
    return (
      <Card key={id}>
        <ListItem>
          <ListItemText
            primary={name}
            secondary={description}
          />
          <ListSubheader component='div' >{acousticModel.name}</ListSubheader>
          <ListSubheader component='div' >{languageModel.name}</ListSubheader>
          <ListItemSecondaryAction>
            <IconButton edge="end" aria-label="edit" onClick={handleActionClick} >
              <MoreVertIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
        {renderItemMenu()}
      </Card>
    );
  });

  return (
    <Container maxWidth={false} className={classes.container} >
      <Card>
        <CardHeader
          title={translate("models.header")}
        />
        {modelConfigsLoading ? <BulletList /> : (
          <>
            <CardContent className={classes.cardContent} >
              <List >
                {renderListItems()}
              </List>
            </CardContent>
            <CardActions>
              <Button
                color="primary"
                variant='contained'
                onClick={openCreateDialog}
                startIcon={<AddIcon />}
              >
                {translate('modelConfig.create')}
              </Button>
            </CardActions>
          </>)}
      </Card>
      <ModelConfigDialog
        projectId={projectId}
        open={configOpen}
        configToEdit={undefined}
        onClose={closeDialog}
        onSuccess={handleModelConfigCreate}
        topGraphs={topGraphs}
        subGraphs={subGraphs}
        languageModels={languageModels}
        acousticModels={acousticModels}
        handleSubGraphCreate={handleSubGraphCreate}
        handleAcousticModelCreate={handleAcousticModelCreate}
        handleLanguageModelCreate={handleLanguageModelCreate}
      />
    </Container>
  );
}