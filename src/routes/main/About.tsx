import React, { useContext, useEffect, useState } from "react";
import { ApiContext } from '../../hooks/api/ApiContext';
import { KeycloakContext } from "../../hooks/keycloak/KeycloakContext";

export function About() {
  const keycloak = useContext(KeycloakContext)
  const api = useContext(ApiContext)
  const [users, setUsers] = useState({})

  console.log("keycloak from header", keycloak)
  console.log("api from header", api)
  useEffect(() => {
    const getUsers = async () => {
      const headers = api.getHeader();
      console.log("headers", headers)
      if (api && api.IAM) {
        const response = await api.IAM.getUsers();
        console.log("response", response)
        setUsers(response)
      }
    }
    getUsers();
  }, []);

  return (<div>
    <pre>{JSON.stringify(users)}</pre>
  </div>);
}
