import {TableCell, Typography} from '@material-ui/core';
import Button from '@material-ui/core/Button';
import {createStyles, makeStyles, useTheme} from '@material-ui/core/styles';
import TableRow from '@material-ui/core/TableRow';
import {useSnackbar} from 'notistack';
import React, {useGlobal} from 'reactn';
import {useHistory} from 'react-router-dom';
import {ApiContext} from '../../../hooks/api/ApiContext';
import {I18nContext} from '../../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../../hooks/keycloak/KeycloakContext';
import {CustomTheme} from '../../../theme';
import {CONTENT_STATUS, PATHS, VoiceData, ROLES} from '../../../types';
import {ICONS} from '../../../theme/icons';
import Chip from '@material-ui/core/Chip';

interface TranscriptionTableItemProps {
    voiceData: VoiceData;
    voiceDataIndex: number;
    handleConfirmationClick: (voiceDataIndex: number) => void;
    handleRejectClick: (voiceDataIndex: number) => void;
    // openEvaluationDetail: (dataSetIndex: number) => void;
}

const useStyles = makeStyles((theme: CustomTheme) =>
    createStyles({
        processedText: {
            color: theme.palette.primary.main,
        },
        tableRow: {
            borderWidth: 1,
            borderColor: theme.table.border,
            border: 'solid',
            borderCollapse: undefined,
        },
        inlineBlockProgressBar: {
            display: 'inline-block',
            borderTop: '5px',
        },
        button: {
            marginLeft: '15px',
            width: '90px',
        },
        buttonReject: {
            backgroundColor: '#c33636',
        },
        rejected: {
            backgroundColor: theme.error,
            color: theme.palette.primary.contrastText,
            fontWeight: 'bold',
        },
        confirmed: {
            backgroundColor: theme.editor.changes,
            color: theme.palette.primary.contrastText,
            fontWeight: 'bold',
        },
        review: {
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.contrastText,
            fontWeight: 'bold',
        },
        fetched: {
            backgroundColor: theme.editor.LowConfidence,
            color: theme.palette.primary.contrastText,
            fontWeight: 'bold',
        },
    }));

export function TranscriptionTableItem(props: TranscriptionTableItemProps) {
    const { voiceData, voiceDataIndex, handleConfirmationClick, handleRejectClick } = props;
    const [navigationProps, setNavigationProps] = useGlobal('navigationProps');
    const history = useHistory();
    const api = React.useContext(ApiContext);
    const { enqueueSnackbar } = useSnackbar();
    const { translate, formatDate } = React.useContext(I18nContext);
    const { hasPermission, roles } = React.useContext(KeycloakContext);
    const [downloadLinkPending, setDownloadLinkPending] = React.useState(false);
    const [downloadLink, setDownloadLink] = React.useState('');
    const [expanded, setExpanded] = React.useState(false);
    const [isCreateTrainingSetLoading, setIsCreateTrainingSetLoading] = React.useState(false);
    const [setDetailLoading, setSetDetailLoading] = React.useState(false);
    const [subSets, setSubSets] = React.useState<VoiceData[]>([]);

    const classes = useStyles();
    const theme: CustomTheme = useTheme();

    const handleDiffClick = () => {
        // const projectId = voiceData.projectId;
        // setNavigationProps({ voiceData: voiceData, projectId: projectId, isDiff: true, readOnly: false });
        PATHS.editor.to && history.push(`/editor/mode/diff/projectId/${projectId}/voiceDataId/${voiceData.id}`);
    };

    const statusChipClass = () => {
        switch(voiceData.status) {
            case CONTENT_STATUS.REJECTED :
                return classes.rejected;
            case CONTENT_STATUS.CONFIRMED :
                return classes.confirmed;
            // case CONTENT_STATUS.IN_REVIEW :
            //     return classes.review;
            // case CONTENT_STATUS.FETCHED :
            //     return classes.fetched
            default :
                return '';
        }
    };
    
    return (
        <TableRow
            className={classes.tableRow}
        >
            <TableCell>
                <Typography>{voiceData.originalFilename}</Typography>
            </TableCell>
            <TableCell>
                <Typography>{voiceData.transcriber}</Typography>
            </TableCell>
            <TableCell>
                {voiceData.wordCount}
            </TableCell>
            <TableCell>
                <Typography>{voiceData.length}</Typography>
            </TableCell>
            <TableCell>
                <Typography>{formatDate(new Date(voiceData.decodedAt))}</Typography>
            </TableCell>
            <TableCell>
                <Button
                    color='primary'
                    startIcon={<ICONS.Diff />}
                    onClick={handleDiffClick} />
            </TableCell>
            <TableCell style={{ minWidth: '250px' }}>
                {
                    roles.includes(ROLES.manager) && voiceData.status !== CONTENT_STATUS.CONFIRMED &&
                        <>
                            <Button
                                className={classes.button}
                                variant='contained'
                                color="primary"
                                disabled={voiceData.status !== CONTENT_STATUS.IN_REVIEW}
                                size='small'
                                onClick={() => handleConfirmationClick(voiceDataIndex)}>
                                {translate('common.confirm')}
                            </Button>
                            <Button
                                className={[classes.button, classes.buttonReject].join(' ')}
                                color='secondary'
                                disabled={voiceData.status !== CONTENT_STATUS.IN_REVIEW}
                                variant='contained'
                                size='small'
                                onClick={() => handleRejectClick(voiceDataIndex)}>
                                {translate('common.reject')}
                            </Button>
                        </>
                }
            </TableCell>
        </TableRow>
    );
}
