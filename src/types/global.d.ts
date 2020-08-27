import 'reactn';
import { Organization, Project, Shortcuts } from '.';

interface undoRedoData {
  undoRedoData: {
    undoStack: string[],
    redoStack: string[],
    location: number[],
  }
}

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
    showEditorPopups: boolean;
    undoRedoData?: undoRedoData;
    editorFocussed?: boolean;
    editorContentHeight?: number;
    editorAutoScrollDisabled?: boolean;
    autoSeekDisabled?: boolean;
    shortcuts: Shortcuts;
    scrollToSegmentIndex?: number;
  }
}
