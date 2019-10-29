import { Grid } from '@material-ui/core';
import React from 'react';
import { Project } from '../../../types';
import { CheckedProjectsById } from '../Projects';
import { ProjectGridItem } from './ProjectGridItem';

interface ProjectGridListProps {
  projects: Project[]
  checkedProjects: CheckedProjectsById
  setCheckedProjects: React.Dispatch<React.SetStateAction<CheckedProjectsById>>
  onUpdate: (project: Project, isEdit?: boolean) => void
}

export interface EditOpenByProjectId {
  [x: number]: boolean
}

export function ProjectGridList(props: ProjectGridListProps) {
  const { projects, checkedProjects, setCheckedProjects, onUpdate } = props;
  const [editOpen, setEditOpen] = React.useState<EditOpenByProjectId>({});

  const handleEditOpen = (projectId: number) => setEditOpen(prevOpen => {
    return { ...prevOpen, [projectId]: true }
  });
  const handleEditClose = (projectId: number) => setEditOpen(prevOpen => {
    return { ...prevOpen, [projectId]: false }
  });

  const handleEditSuccess = (updatedProject: Project, isEdit?: boolean) => {
    onUpdate(updatedProject, isEdit);
    handleEditClose(updatedProject.id);
  }

  const handleProjectCheck = (projectId: number, value: boolean): void => {
    setCheckedProjects((prevCheckedProjects) => {
      return { ...prevCheckedProjects, [projectId]: value }
    })
  }

  const renderProjects = () => projects.map((project, index) => (
    <ProjectGridItem
      key={index}
      project={project}
      handleEditClose={handleEditClose}
      handleEditOpen={handleEditOpen}
      editOpen={editOpen}
      checkedProjects={checkedProjects}
      handleEditSuccess={handleEditSuccess}
      handleProjectCheck={handleProjectCheck}
    />
  ))

  return (
    <Grid container spacing={2} >
      {renderProjects()}
    </Grid>
  )
}
