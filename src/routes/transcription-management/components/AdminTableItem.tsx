import { Grid, TableCell, Tooltip, Typography } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import TableRow from '@material-ui/core/TableRow';
import AddIcon from '@material-ui/icons/Add';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import LaunchIcon from '@material-ui/icons/Launch';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import EditIcon from '@material-ui/icons/Edit';
import RateReviewIcon from '@material-ui/icons/RateReview'
import { useSnackbar } from 'notistack';
import MoonLoader from 'react-spinners/MoonLoader';
import React, { useGlobal } from 'reactn';
import { useHistory } from 'react-router-dom';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { ServerError } from '../../../services/api/types/api-problem.types';
import { CustomTheme } from '../../../theme';
import { DataSet, VoiceData, PATHS } from '../../../types';
import { SNACKBAR_VARIANTS } from '../../../types/snackbar.types';
import log from '../../../util/log/logger';
import { ProgressBar } from '../../shared/ProgressBar';
import { SetDetail } from "../../projects/set/components/SetDetail";
import { EvaluationDetailModal } from '../../projects/set/components/EvaluationDetailModal';
import { TrainingChip } from '../../shared/TrainingChip';
import BackupIcon from '@material-ui/icons/Backup';
import { ICONS } from '../../../theme/icons';

interface AdminTableItem {
    projectId: string;
    voiceData: VoiceData;
    voiceDataIndex: number;
    openTranscriberDialog: (dataSetIndex: number) => void;
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
        }
    }));

export function AdminTableItem(props: AdminTableItem) {
    const { projectId, voiceData, voiceDataIndex, openTranscriberDialog } = props;
    // const { transcribers, total, processed, name } = dataSet;
    // const numberOfTranscribers = transcribers.length;
    const [navigationProps, setNavigationProps] = useGlobal('navigationProps');
    const history = useHistory();
    const api = React.useContext(ApiContext);
    const { enqueueSnackbar } = useSnackbar();
    const { translate, formatDate } = React.useContext(I18nContext);
    const [downloadLinkPending, setDownloadLinkPending] = React.useState(false);
    const [downloadLink, setDownloadLink] = React.useState('');
    const [expanded, setExpanded] = React.useState(false);
    const [isCreateTrainingSetLoading, setIsCreateTrainingSetLoading] = React.useState(false);
    const [setDetailLoading, setSetDetailLoading] = React.useState(false);
    const [subSets, setSubSets] = React.useState<VoiceData[]>([]);

    const classes = useStyles();
    const theme: CustomTheme = useTheme();

    const onClickAssignTranscriber = () => openTranscriberDialog(voiceDataIndex);

    const startDownload = (url: string) => window.open(url);

    const createTrainingSet = async () => {
        setIsCreateTrainingSetLoading(true);
        if (api ?.dataSet) {
            let serverError: ServerError | undefined;
            const response = await api.dataSet.createTrainingSet(projectId, voiceData.id);

            if (response.kind === 'ok') {
                enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
            } else {
                log({
                    file: 'SetItem.tsx',
                    caller: 'createTrainingSet - failed to send post request',
                    value: response,
                    important: true,
                });
                serverError = response.serverError;
                let errorMessageText = translate('common.error');
                if (serverError ?.message) {
                    errorMessageText = serverError.message;
                }
                enqueueSnackbar(errorMessageText, { variant: SNACKBAR_VARIANTS.error })
            }
        }
        setIsCreateTrainingSetLoading(false);
    };

    const getDownloadLink = async () => {
        if (downloadLink) {
            startDownload(downloadLink);
            return;
        }
        if (api ?.dataSet && !downloadLinkPending) {
            setDownloadLinkPending(true);
            setDownloadLink('');
            let serverError: ServerError | undefined;
            const response = await api.dataSet.getDownloadLink(projectId, voiceData.id);
            if (response.kind === 'ok') {
                startDownload(response.url);
            } else {
                log({
                    file: `SetItem.tsx`,
                    caller: `getDownloadLink - failed to get download link`,
                    value: response,
                    important: true,
                });
                serverError = response.serverError;
                let errorMessageText = translate('common.error');
                if (serverError ?.message) {
                    errorMessageText = serverError.message;
                }
                enqueueSnackbar(errorMessageText, { variant: SNACKBAR_VARIANTS.error });
            }
            setDownloadLinkPending(false);
        }
    };

    const getSetDetail = async () => {
        if (api ?.dataSet) {
            const response = await api.dataSet ?.getSubSet(projectId, voiceData.id, '');
            if (response.kind === "ok") {
                setSubSets(response.subSets.content);
                return true;
            }
        }
    };

    const openSetDetail = async () => {
        if (subSets.length) {
            setExpanded(!expanded);
            return;
        }
        const subSetsFromRequest = await getSetDetail();
        if (subSetsFromRequest) {
            setExpanded(!expanded);
        }
    };

    const handleDiffClick = () => {
        // setNavigationProps({ voiceData, projectId });
        PATHS.editor.to && history.push(PATHS.editor.to);
    };
/*
    const onClickConfirmData = async () => {
        if (api?.voiceData && projectId && voiceData && !alreadyConfirmed) {
            setConfirmSegmentsLoading(true);
            closeConfirmDialog();
            const response = await api.voiceData.requestApproval(projectId, voiceData.id);
            let snackbarError: SnackbarError | undefined = {} as SnackbarError;
            if (response.kind === 'ok') {
                snackbarError = undefined;
                enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
                // to trigger the `useEffect` to fetch more
                setVoiceData(undefined);
            } else {
                log({
                    file: `EditorPage.tsx`,
                    caller: `confirmData - failed to confirm segments`,
                    value: response,
                    important: true,
                });
                snackbarError.isError = true;
                const { serverError } = response;
                if (serverError) {
                    snackbarError.errorText = serverError.message || "";
                }
            }
            snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
            setConfirmSegmentsLoading(false);
        }
    }*/

    React.useEffect(() => {
        if (expanded) {
            getSetDetail();
        }
    }, [expanded]);

    return (
        <TableRow
            className={classes.tableRow}
        >
            <TableCell>
                <Typography>{voiceData.originalFilename}</Typography>
            </TableCell>
            <TableCell>
                <Typography>{voiceData.modelConfigId}</Typography>
            </TableCell>
            <TableCell>
                {voiceData.length}
            </TableCell>
            <TableCell>
                <Typography>{voiceData.wordCount}</Typography>
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
                <Button
                    className={classes.button}
                    variant='contained'
                    color="primary"
                    size='small'
                    onClick={onClickConfirmData}>
                    {translate('common.confirm')}
                </Button>
                <Button
                    className={[classes.button, classes.buttonReject].join(' ')}
                    color='secondary'
                    variant='contained'
                    size='small'
                    onClick={onClickRejectData}>
                    {translate('common.reject')}
                </Button>
            </TableCell>
        </TableRow>
    );
}
