/* eslint-disable @typescript-eslint/camelcase */
import { ResourceLanguage } from 'i18next';

export const ko: ResourceLanguage = {
  translation: {
    common: {
      okay: 'Okay',
      delete: '삭제',
      submit: '제출',
      cancel: '취소',
      error: '오류',
      success: 'Success',
      failure: 'Failure'
    },
    path: {
      home: '홈',
      IAM: 'IAM',
      projects: 'projects'
    },
    menu: {
      login: '로그인',
      logout: '로그아웃',
      changeLanguage: '언어 바꾸기'
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
      email: '이메일',
      name: '이름',
      thresholdHc: 'High confidence threshold',
      thresholdLc: 'Low confidence threshold'
    },
    IAM: {
      user: '사용자',
      roles: '역할',
      invite: '초대',
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
