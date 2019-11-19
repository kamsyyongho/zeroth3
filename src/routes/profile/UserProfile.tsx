import React from "react";
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { Organization } from '../../types';
import log from '../../util/log/logger';

export function UserProfile() {
  const { keycloak, user } = React.useContext(KeycloakContext);
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [organization, setOrganization] = React.useState<Organization>({} as Organization);
  const [organizationLoading, setOrganizationLoading] = React.useState(false);
  console.log('keycloak', keycloak);
  const { givenName, familyName, preferredUsername, email, organizationId } = user;

  React.useEffect(() => {
    const getOrganization = async () => {
      if (api && api.organizations) {
        setOrganizationLoading(true);
        const response = await api.organizations.getOrganization();
        if (response.kind === 'ok') {
          setOrganization(response.organization);
        } else {
          log({
            file: `UserProfile.tsx`,
            caller: `getOrganization - failed to get organization`,
            value: response,
            important: true,
          });
        }
        setOrganizationLoading(false);
      }
    };
    if (organizationId) {
      getOrganization();
    }
  }, []);

  return (
    <div >
      <p>
        Name: {translate('profile.fullName', { family: familyName, given: givenName })}
      </p>
      <p>
        username: {preferredUsername}
      </p>
      <p>
        email: {email}
      </p>
      <p>
        organization: {JSON.stringify(organization)}
      </p>
    </div>
  );
}
