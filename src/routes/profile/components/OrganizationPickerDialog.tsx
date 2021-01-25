import { DialogContent, Divider } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import clsx from 'clsx';
import React from 'reactn';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../theme/index';
import { Organization } from '../../../types';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    selected: {
      backgroundColor: theme.table.highlight,
    }
  }),
);

export interface OrganizationPickerDialogProps {
  open: boolean;
  currentOrganizationId?: string;
  onClose: () => void;
  onSuccess: (organization: Organization) => void;
  organizations: Organization[];
}

export function OrganizationPickerDialog(props: OrganizationPickerDialogProps) {
  const classes = useStyles();
  const { onClose, onSuccess, currentOrganizationId, open, organizations } = props;
  const { translate } = React.useContext(I18nContext);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const handleClose = () => {
    onClose();
  };

  const handleListItemClick = (organization: Organization) => {
    onSuccess(organization);
    handleClose();
  };

  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="organization-select"
      open={open}
      fullScreen={fullScreen}
    >
      <DialogTitle id="organization-select">{translate('profile.organization', { count: organizations.length })}</DialogTitle>
      <DialogContent >
        <List>
          {organizations.map((organization, index) => (
            <React.Fragment key={organization.id} >
              {index === 0 && <Divider />}
              <ListItem
                button
                onClick={() => handleListItemClick(organization)}
                className={clsx(organization.id === currentOrganizationId && classes.selected)}
              >
                <ListItemText primary={organization.name} />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
