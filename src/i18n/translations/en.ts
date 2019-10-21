/* eslint-disable @typescript-eslint/camelcase */
import { ResourceLanguage } from 'i18next';

export const en: ResourceLanguage = {
  translation: {
    common: {
      okay: 'Okay',
      delete: 'Delete',
      submit: 'Submit',
      cancel: 'Cancel',
      error: 'Error',
      success: 'Success',
      failure: 'Failure'
    },
    path: {
      home: 'Home',
      IAM: 'IAM',
      projects: 'projects'
    },
    menu: {
      login: 'Login',
      logout: 'Logout',
      changeLanguage: 'Change language'
    },
    forms: {
      validation: {
        required: 'Required',
        email: 'Email is not valid',
        greaterThan: '{{target}} must be GREATER than {{value}}',
        lessThan: '{{target}} must be LESS than {{value}}',
        greaterEqualTo: '{{target}} must be or equal to {{value}}',
        lessEqualTo: '{{target}} must be less or equal to {{value}}',
        between: '{{target}} must between {{first}} and {{second}}',
        between_characters:
          '{{target}} must between {{first}} and {{second}} characters long'
      },
      email: 'Email',
      name: 'Name',
      thresholdHc: 'High confidence threshold',
      thresholdLc: 'Low confidence threshold'
    },
    IAM: {
      user: 'User',
      roles: 'Roles',
      invite: 'Invite',
      header: 'Identity and Access Management',
      inviteUser: 'Invite user',
      deleteUser: 'Delete user',
      deleteUser_plural: 'Delete {{count}} users',
    },
    projects: {
      createProject: 'Create project',
      deleteProject: 'Delete project',
      deleteProject_plural: 'Delete {{count}} projects',
      create: 'Create',
      header: 'Project Management'
    }
  }
};
