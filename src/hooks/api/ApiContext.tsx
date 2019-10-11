import { createContext } from "react";
import { Api } from '../../services/api/api';

const defaultContext: Api = {} as Api

export const ApiContext = createContext(defaultContext)