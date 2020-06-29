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

interface TranscriptionTableItemProps {
    dataSet: DataSet;
    dataSetIndex: number;
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

export function TranscriptionTableItem(props: TranscriptionTableItemProps) {
    const { dataSet, dataSetIndex } = props;
    const { transcribers, total, processed, name, wordCount, createdAt, rejected } = dataSet;
    // const { transcribers, total, processed, name } = dataSet;
    // const numberOfTranscribers = transcribers.length;
    const history = useHistory();
    const api = React.useContext(ApiContext);
    const { enqueueSnackbar } = useSnackbar();
    const { translate, formatDate } = React.useContext(I18nContext);
    const [downloadLinkPending, setDownloadLinkPending] = React.useState(false);
    const [downloadLink, setDownloadLink] = React.useState('');
    const [expanded, setExpanded] = React.useState(false);
    const [isCreateTrainingSetLoading, setIsCreateTrainingSetLoading] = React.useState(false);
    const [setDetailLoading, setSetDetailLoading] = React.useState(false);
    const [subSets, setSubSets] = React.useState<DataSet[]>([]);

    const classes = useStyles();
    const theme: CustomTheme = useTheme();

    // must be a number from 0 to 100
    const progress = processed / total * 100;

    let processedText = (
        <Typography className={classes.processedText} >
            {processed}
            <Typography component='span' color='textPrimary' >
                {` / ${total}`}
            </Typography>
        </Typography>
    );

    if (!total || isNaN(progress)) {
        processedText = (<Typography color='textSecondary' >
            {translate('common.noData')}
        </Typography>);
    }

    return (
        <TableRow
            className={classes.tableRow}
        >
            <TableCell>
                <Typography>{name}</Typography>
            </TableCell>
            <TableCell>
                <Typography>{wordCount}</Typography>
            </TableCell>
            <TableCell>
                {dataSet.highRiskRatio + '%'}
            </TableCell>
            <TableCell>
                <Typography>{rejected}</Typography>
            </TableCell>
            <TableCell>
                <Typography>{formatDate(new Date(createdAt))}</Typography>
            </TableCell>
            <TableCell>
                <Typography>
                    {processedText}
                    <ProgressBar value={progress} maxWidth={200} />
                </Typography>
            </TableCell>
            <TableCell>
            </TableCell>
        </TableRow>
    );
}
