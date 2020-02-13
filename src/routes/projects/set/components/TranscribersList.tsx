import { TableBody, TableCell, Typography } from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import React from 'reactn';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { TranscriberStats } from '../../../../types';
import { TranscribersListItem } from './TranscribersListItem';

interface TranscribersListProps {
  transcribers: TranscriberStats[];
  searching: boolean;
  onItemClick: (transcriberId: string) => void;
  selectedTranscriberIds: string[];
}

export function TranscribersList(props: TranscribersListProps) {
  const {
    transcribers,
    searching,
    onItemClick,
    selectedTranscriberIds,
  } = props;
  const { translate } = React.useContext(I18nContext);

  const renderTranscribers = () => transcribers.map((transcriber, index) => {
    const selected = selectedTranscriberIds.includes(transcriber.id);
    return (
      <TranscribersListItem
        key={index}
        selected={selected}
        transcriber={transcriber}
        onItemClick={onItemClick}
      />
    );
  }
  );

  const renderHeader = () => (<TableHead>
    <TableRow selected>
      <TableCell>
        <Typography>{translate('forms.email')}</Typography>
      </TableCell>
      <TableCell>
        <Typography align='center'>{translate('transcribers.count')}</Typography>
      </TableCell>
      <TableCell>
        <Typography align='center' >{translate('transcribers.rating')}</Typography>
      </TableCell>
    </TableRow>
  </TableHead>);

  const renderNoResults = () => (<TableRow >
    <TableCell colSpan={3}>
      <Typography align='center' >{translate(searching ? 'table.noResults' : 'transcribers.noTranscribers')}</Typography>
    </TableCell>
  </TableRow>);

  return (
    <Table>
      {renderHeader()}
      <TableBody>
        {(!transcribers.length) ? renderNoResults() : renderTranscribers()}
      </TableBody>
    </Table>
  );
}
