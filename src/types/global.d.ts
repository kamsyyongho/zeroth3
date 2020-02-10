import 'reactn';
import { Organization } from './organizations.types';
import { Project } from './projects.types';

declare module 'reactn/default' {
  export interface State {
    organizations?: Organization[];
    currentOrganization?: Organization;
    currentProject?: Project;
    uploadQueueEmpty?: boolean;
    projectInitialized?: boolean;
  }
}
