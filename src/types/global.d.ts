import 'reactn';
import { DataSetMetadata, Organization, Project } from './index';

declare module 'reactn/default' {
  export interface State {
    organizations?: Organization[];
    currentOrganization?: Organization;
    currentProject?: Project;
    uploadQueueEmpty?: boolean;
    projectInitialized?: boolean;
    projectTdpDataShouldRefresh?: boolean;
    navigationProps?: any;
    dataSetMetadata?: DataSetMetadata;
    playingBlockIndex?: number;
  }
}
