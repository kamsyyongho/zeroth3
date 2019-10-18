import { ResourceLanguage } from 'i18next';

export const en: ResourceLanguage = {
  translation: {
    common: {
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
        email: 'Email is not valid'
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
      inviteUser: 'Invite user'
    },
    projects: {
      createProject: 'Create project',
      create: 'Create'
    }
  }
};
