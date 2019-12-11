import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import EditIcon from '@material-ui/icons/Edit';
import React from 'react';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../theme/index';
import { Project } from '../../../types';
import { CheckedProjectsById } from '../ProjectsDialog';
import { ProjectDialog } from './ProjectDialog';
import { EditOpenByProjectId } from './ProjectList';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    selected: {
      backgroundColor: theme.status.selected,
      "&:hover": { // to keep the color consistant when selected
        backgroundColor: theme.status.selected,
      }
    }
  }),
);

interface ProjectListItemProps {
  project: Project;
  selected: boolean;
  canModify: boolean;
  checkedProjects: CheckedProjectsById;
  editOpen: EditOpenByProjectId;
  onItemClick: (projectId: string) => void;
  handleEditOpen: (projectId: string) => void;
  handleEditClose: (projectId: string) => void;
  handleEditSuccess: (updatedProject: Project, isEdit?: boolean) => void;
  handleProjectCheck: (projectId: string, value: boolean) => void;
}


export function ProjectListItem(props: ProjectListItemProps) {
  const {
    project,
    canModify,
    editOpen,
    handleEditClose,
    handleEditOpen,
    checkedProjects,
    handleEditSuccess,
    handleProjectCheck,
    selected,
    onItemClick,
  } = props;
  const { formatDate } = React.useContext(I18nContext);
  const classes = useStyles();
  const isOpen = !!editOpen[project.id];
  let isChecked = false;
  if (checkedProjects && typeof checkedProjects[project.id] === 'boolean') {
    isChecked = checkedProjects[project.id];
  }

  const validDate = new Date(project.validFrom);

  const onClick = () => onItemClick(project.id);

  return (<React.Fragment key={project.id}>
    <ProjectDialog
      open={isOpen}
      onClose={() => handleEditClose(project.id)}
      onSuccess={handleEditSuccess}
      projectToEdit={project}
    />
    <ListItem dense button onClick={onClick} className={selected ? classes.selected : undefined}>
      <ListItemText primary={project.name} secondary={formatDate(validDate)} />
      {canModify && <ListItemSecondaryAction>
        <ListItemIcon>
          <Checkbox checked={isChecked} value="checkedB" color="secondary" onChange={(event) => handleProjectCheck(project.id, event.target.checked)} />
        </ListItemIcon>
        <ListItemIcon>
          <IconButton aria-label="edit" onClick={() => handleEditOpen(project.id)}>
            <EditIcon />
          </IconButton>
        </ListItemIcon>
      </ListItemSecondaryAction>}
    </ListItem>
  </React.Fragment>);
};