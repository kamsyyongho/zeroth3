import { useState } from 'react';
import { Api } from '../../services/api/api';

export const useApi = () => {
  const rawApi = new Api()
  const [api, setApi] = useState(rawApi)

  return { api, setApi }
}