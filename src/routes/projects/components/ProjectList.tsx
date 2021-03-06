import { Divider } from '@material-ui/core';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import React from 'reactn';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { Project } from '../../../types';
import { CheckedProjectsById } from '../ProjectsDialog';
import { ProjectListItem } from './ProjectListItem';

interface ProjectListProps {
  projects: Project[];
  searching: boolean;
  canModify: boolean;
  showEdit?: boolean;
  checkedProjects: CheckedProjectsById;
  setCheckedProjects: (projectId: string, value: boolean, triggerDelete?: boolean) => void;
  onUpdate: (project: Project, isEdit?: boolean) => void;
  onItemClick: (project: Project) => void;
  setEditDialogOpen: (value: boolean) => void;
  selectedProjectId?: string;
}

export interface EditOpenByProjectId {
  [x: string]: boolean;
}

export function ProjectList(props: ProjectListProps) {
  const {
    projects,
    searching,
    canModify,
    showEdit,
    checkedProjects,
    setCheckedProjects,
    onUpdate,
    onItemClick,
    setEditDialogOpen,
    selectedProjectId,
  } = props;
  const [editOpen, setEditOpen] = React.useState<EditOpenByProjectId>({});
  const { translate } = React.useContext(I18nContext);

  // const selected = React.useMemo(() => project.id === selectedProjectId, [selectedProjectId]);



  const handleEditOpen = (projectId: string) => setEditOpen(prevOpen => {
    setEditDialogOpen(true);
    return { ...prevOpen, [projectId]: true };
  });
  const handleEditClose = (projectId: string) => setEditOpen(prevOpen => {
    setEditDialogOpen(false);
    return { ...prevOpen, [projectId]: false };
  });

  const handleEditSuccess = (updatedProject: Project, isEdit?: boolean) => {
    onUpdate(updatedProject, isEdit);
    handleEditClose(updatedProject.id);
  };
  
  const renderProjects = () => projects.map((project, index) => {
    const selected = project.id === selectedProjectId;
    return (<React.Fragment key={index}>
      {index === 0 && <Divider />}
      <ProjectListItem
        key={index}
        selected={selected}
        project={project}
        canModify={canModify}
        showEdit={showEdit}
        handleEditClose={handleEditClose}
        handleEditOpen={handleEditOpen}
        editOpen={editOpen}
        onItemClick={onItemClick}
        checkedProjects={checkedProjects}
        handleEditSuccess={handleEditSuccess}
        handleProjectCheck={setCheckedProjects}
      />
      <Divider />
    </React.Fragment>
    );
  }
  );

  const renderNoResults = () => <ListItem >
    <ListItemText primary={translate(searching ? 'table.noResults' : 'projects.noProjects')} />
  </ListItem>;

  return (
    <List dense>
      {(!projects.length) ? renderNoResults() : renderProjects()}
    </List>
  );
}
