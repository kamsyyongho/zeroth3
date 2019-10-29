/* eslint-disable @typescript-eslint/camelcase */
import { ResourceLanguage } from 'i18next';

export const en: ResourceLanguage = {
  translation: {
    common: {
      okay: 'Okay',
      delete: 'Delete',
      submit: 'Submit',
      cancel: 'Cancel',
      create: 'Create',
      edit: 'Edit',
      error: 'Error',
      success: 'Success',
      failure: 'Failure',
    },
    path: {
      home: 'Home',
      IAM: 'IAM',
      projects: 'Projects',
      models: 'Models',
    },
    menu: {
      login: 'Login',
      logout: 'Logout',
      changeLanguage: 'Change language',
    },
    forms: {
      validation: {
        required: 'Required',
        email: 'Email is not valid',
        number: 'Must be a number',
        integer: 'Must be an integer',
        greaterThan: '{{target}} must be greater than {{value}}',
        lessThan: '{{target}} must be less than {{value}}',
        greaterEqualTo: '{{target}} must be greater than or equal to {{value}}',
        lessEqualTo: '{{target}} must be less than or equal to {{value}}',
        between: '{{target}} must between {{first}} and {{second}}',
        between_characters:
          '{{target}} must between {{first}} and {{second}} characters long',
      },
      email: 'Email',
      name: 'Name',
      text: 'Text',
      file: 'File',
      thresholdHc: 'High confidence threshold',
      thresholdLc: 'Low confidence threshold',
      description: 'Description',
      location: 'Location',
      sampleRate: 'Sample rate (kHz)',
      top: 'Top',
      sub: 'Sub',
      privacySetting: 'Privacy setting',
      fileUpload: 'File upload',
      source: 'Source',
      private: 'Private',
      public: 'Public',
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
      editProject: 'Edit project',
      deleteProject: 'Delete project',
      deleteProject_plural: 'Delete {{count}} projects',
      header: 'Project Management',
    },
    models: {
      header: 'Model Management',
      tabs: {
        acousticModel: {
          header: 'Acoustic Model',
          create: 'Create acoustic model',
        },
        languageModel: {
          header: 'Language Model',
          create: 'Create language model',
          edit: 'Edit language model',
          createSubGraph: 'Create new sub graph',
        },
      },
      createModel: 'Create model',
      editModel: 'Edit model',
    },
  },
};
