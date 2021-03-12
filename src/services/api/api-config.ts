import { ApisauceConfig } from 'apisauce';
import ENV from '../env';

/**
 * The options used to configure the API.
 */
export interface ApiConfig extends ApisauceConfig {
  /**
   * The URL of the api.
   */
  baseURL: string;

  /**
   * Milliseconds before we timeout the request.
   */
  timeout: number;
}

/**
 * The default configuration for the app.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  baseURL: ENV.BACKEND_URL || 'http://ailab.sorizava.co.kr:8080',
  timeout: 30000
};
