import { Organization, } from '../../../types';

export const SET_ORGANIZATIONS = 'SET_ORGANIZATIONS';
export const SET_CURRENT_ORGANIZATION = 'SET_CURRENT_ORGANIZATION';

export const setOrganizations =  (organizations: Organization[]) => {
    return {type: SET_ORGANIZATIONS, payload: organizations};
};

export const setCurrentOrganization = (organization: Organization) => {
    return {type: SET_CURRENT_ORGANIZATION, payload: organization};
};

