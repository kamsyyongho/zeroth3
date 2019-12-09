import { Grid } from '@material-ui/core';
import React from 'react';
import { Project } from '../../../types';
import { CheckedProjectsById } from '../Projects';
import { ProjectGridItem } from './ProjectGridItem';

interface ProjectGridListProps {
  projects: Project[];
  canModify: boolean;
  checkedProjects: CheckedProjectsById;
  setCheckedProjects: React.Dispatch<React.SetStateAction<CheckedProjectsById>>;
  onUpdate: (project: Project, isEdit?: boolean) => void;
}

export interface EditOpenByProjectId {
  [x: string]: boolean;
}

export function ProjectGridList(props: ProjectGridListProps) {
  const { projects, canModify, checkedProjects, setCheckedProjects, onUpdate } = props;
  const [editOpen, setEditOpen] = React.useState<EditOpenByProjectId>({});

  const handleEditOpen = (projectId: string) => setEditOpen(prevOpen => {
    return { ...prevOpen, [projectId]: true };
  });
  const handleEditClose = (projectId: string) => setEditOpen(prevOpen => {
    return { ...prevOpen, [projectId]: false };
  });

  const handleEditSuccess = (updatedProject: Project, isEdit?: boolean) => {
    onUpdate(updatedProject, isEdit);
    handleEditClose(updatedProject.id);
  };

  const handleProjectCheck = (projectId: string, value: boolean): void => {
    setCheckedProjects((prevCheckedProjects) => {
      return { ...prevCheckedProjects, [projectId]: value };
    });
  };

  const renderProjects = () => projects.map((project, index) => (
    <ProjectGridItem
      key={index}
      project={project}
      canModify={canModify}
      handleEditClose={handleEditClose}
      handleEditOpen={handleEditOpen}
      editOpen={editOpen}
      checkedProjects={checkedProjects}
      handleEditSuccess={handleEditSuccess}
      handleProjectCheck={handleProjectCheck}
    />
  ));

  return (
    <Grid container spacing={2} >
      {renderProjects()}
    </Grid>
  );
}
