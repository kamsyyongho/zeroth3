import 'reactn';
import { Organization, Project } from './index';

declare module 'reactn/default' {
  export interface State {
    organizations?: Organization[];
    currentOrganization?: Organization;
    currentProject?: Project;
    uploadQueueEmpty?: boolean;
    projectInitialized?: boolean;
    projectTdpDataShouldRefresh?: boolean;
    navigationProps?: any;
    playingWordKey?: number;
    wordConfidenceThreshold?: number;
    editorDebugMode?: boolean;
    showEditorPopups?: boolean;
    editorContentHeight?: number;
  }
}
