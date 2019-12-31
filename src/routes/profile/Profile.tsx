import { Box, Button, CardHeader, Container } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import EditIcon from '@material-ui/icons/Edit';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import { useSnackbar } from 'notistack';
import React from "react";
import { List } from 'react-content-loader';
import MoonLoader from 'react-spinners/MoonLoader';
import { PERMISSIONS } from '../../constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { GlobalStateContext } from '../../hooks/global-state/GlobalStateContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { CustomTheme } from '../../theme';
import { ICONS } from '../../theme/icons';
import { SnackbarError } from '../../types/snackbar.types';
import log from '../../util/log/logger';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { RenameOrganizationDialog } from '../shared/RenameOrganizationDialog';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    card: {
      backgroundColor: theme.palette.background.default,
    },
    cardContent: {
      padding: 0,
    },
    userCard: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },
    organizationLoader: {
      paddingTop: theme.spacing(3),
      paddingLeft: theme.spacing(3),
      backgroundColor: theme.palette.background.paper,
    },
    pageTitle: {
      fontFamily: 'Muli',
      fontWeight: 'bold',
      color: theme.header.lightBlue,
    },
    cardTitle: {
      fontFamily: 'Muli',
      fontWeight: 'bold',
      color: theme.palette.primary.main,
    },
  }),
);

export function Profile() {
  const { user, hasPermission } = React.useContext(KeycloakContext);
  const { translate } = React.useContext(I18nContext);
  const { globalState, setGlobalState } = React.useContext(GlobalStateContext);
  const { organization } = globalState;
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar } = useSnackbar();
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [organizationLoading, setOrganizationLoading] = React.useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const theme: CustomTheme = useTheme();
  const classes = useStyles();

  const showDialog = () => setIsOpen(true);
  const hideDialog = () => setIsOpen(false);
  const confirmReset = () => setConfirmationOpen(true);
  const closeConfirmation = () => setConfirmationOpen(false);

  const hasRenamePermissions = hasPermission(PERMISSIONS.organization);

  const { givenName, familyName, preferredUsername, email, organizationId } = user;

  const getOrganization = async () => {
    if (api?.organizations) {
      setOrganizationLoading(true);
      const response = await api.organizations.getOrganization();
      if (response.kind === 'ok') {
        setGlobalState({ organization: response.organization });
      } else {
        log({
          file: `Profile.tsx`,
          caller: `getOrganization - failed to get organization`,
          value: response,
          important: true,
        });
      }
      setOrganizationLoading(false);
    }
  };

  const resetPassword = async () => {
    if (api?.user) {
      closeConfirmation();
      setPasswordResetLoading(true);
      const response = await api.user.resetPassword();
      const snackbarError: SnackbarError = {} as SnackbarError;
      if (response.kind === 'ok') {
        api.logout();
      } else {
        log({
          file: `UserProfile.tsx`,
          caller: `resetPassword - failed to reset password`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setPasswordResetLoading(false);
    }
  };

  React.useEffect(() => {
    if (organizationId && !organization) {
      getOrganization();
    }
  }, []);

  const renderUserCard = () => <Grid item xs component={Card} elevation={0} >
    <CardHeader
      title={translate('profile.user')}
      titleTypographyProps={{
        variant: 'h6',
        className: classes.cardTitle,
      }}
    />
    <CardContent>
      <Grid
        container
        direction='row'
        justify='flex-start'
        alignItems='center'
        alignContent='center'
        spacing={2}
      >
        <Grid item >
          <ICONS.Profile style={{ color: theme.header.lightBlue }} fontSize='large' />
        </Grid>
        <Grid item >
          <Typography color="textPrimary" gutterBottom >
            {translate('profile.fullName', { family: familyName || '', given: givenName || '' })}
          </Typography>
          <Typography color="textSecondary" >
            {`${preferredUsername}  •  ${email}`}
          </Typography>
        </Grid>
      </Grid>
    </CardContent>
    <CardActions>
      <Button
        variant='contained'
        color='secondary'
        size="small"
        onClick={confirmReset}
        disabled={passwordResetLoading}
        startIcon={passwordResetLoading ?
          <MoonLoader
            sizeUnit={"px"}
            size={15}
            color={theme.palette.secondary.main}
            loading={true}
          /> : <VpnKeyIcon />}
      >
        {translate('profile.resetPassword')}
      </Button>
    </CardActions>
  </Grid>;

  const renderOrganizationCard = () => <Grid item xs component={Card} elevation={0} >
    <CardHeader
      title={translate('profile.organization')}
      titleTypographyProps={{
        variant: 'h6',
        className: classes.cardTitle,
      }}
    />
    <Box borderLeft={1} borderColor={theme.table.border} >
      <CardContent>
        <Grid
          container
          direction='row'
          justify='flex-start'
          alignItems='center'
          alignContent='center'
          spacing={2}
        >
          <Grid item >
            <ICONS.Organization style={{ color: theme.header.lightBlue }} fontSize='large' />
          </Grid>
          <Grid item >
            <Typography color="textPrimary" gutterBottom >
              {organization?.name}
            </Typography>
            <Typography color="textSecondary" >
              {organization?.id}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Box>
    {hasRenamePermissions && (<CardActions onClick={showDialog}>
      <Button
        variant='contained'
        color='primary'
        size="small"
        startIcon={<EditIcon />}
      >{translate('organization.rename')}</Button>
    </CardActions>)}
  </Grid>;

  return (
    <Container >
      <Card elevation={0} className={classes.card} >
        <CardHeader title={translate('menu.profile')}
          titleTypographyProps={{
            className: classes.pageTitle,
          }} />
        <CardContent className={classes.cardContent} >
          <Box border={1} borderColor={theme.table.border} className={classes.userCard} >
            <Grid
              container
              direction='row'
              justify='center'
              alignItems='flex-start'
              alignContent='center'
            >
              {renderUserCard()}

              {(organizationLoading || !organization || !organization.name) ? (
                <Grid item xs className={classes.organizationLoader} >
                  <List />
                </Grid>
              ) :
                renderOrganizationCard()}
            </Grid>
          </Box>
        </CardContent>
      </Card>
      <RenameOrganizationDialog name={(organization && organization.name) ? organization.name : ''} open={isOpen} onSuccess={getOrganization} onClose={hideDialog} />
      <ConfirmationDialog
        destructive
        titleText={`${translate('profile.resetPassword')}?`}
        submitText={translate('common.reset')}
        open={confirmationOpen}
        onSubmit={resetPassword}
        onCancel={closeConfirmation}
      />
    </Container>
  );
}
