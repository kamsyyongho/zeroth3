import { Container } from '@material-ui/core';
import React, { useContext, useEffect, useState } from 'react';
import { ApiContext } from '../../hooks/api/ApiContext';
import { Role, User } from '../../types';
import log from '../../util/log/logger';
import { IAMTable } from './components/IAMTable';


export function IAM() {
  const api = useContext(ApiContext)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])

  useEffect(() => {
    const getUsers = async () => {
      if (api && api.IAM) {
        const response = await api.IAM.getUsers();
        if (response.kind === "ok") {
          setUsers(response.users)
        } else {
          log({
            file: `IAM.tsx`,
            caller: `getUsers - failed to get users`,
            value: response,
            important: true,
          })
        }
      }
    }
    const getRoles = async () => {
      if (api && api.IAM) {
        const response = await api.IAM.getRoles();
        if (response.kind === "ok") {
          setRoles(response.roles)
        } else {
          log({
            file: `IAM.tsx`,
            caller: `getUsers - failed to get roles`,
            value: response,
            important: true,
          })
        }
      }
    }
    getUsers();
    getRoles();
  }, []);
  return (
    <Container >
      <IAMTable users={users} roles={roles} />
    </Container>
  );
}
