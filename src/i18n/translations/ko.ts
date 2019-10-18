import { ResourceLanguage } from 'i18next';

export const ko: ResourceLanguage = {
  translation: {
    common: {
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
        email: 'Email is not valid'
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
      inviteUser: 'Invite user'
    },
    projects: {
      createProject: 'Create project',
      create: 'Create'
    }
  }
};