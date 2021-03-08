import { Container, Grid, Link, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from "reactn";
import { CONTACT_EMAIL } from '../../constants/misc.constants';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { ICONS } from '../../theme/icons';
import { IMAGES } from '../../theme/images';
import { CustomTheme } from '../../theme/index';
import { setPageTitle } from '../../util/misc';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    header: {
      marginTop: theme.spacing(5),
      margin: theme.spacing(4),
    },
    headerText: {
      fontFamily: 'Muli',
      fontWeight: 'bold',
      color: theme.header.lightBlue,
    },
    text: {
      fontFamily: 'NotoSansKR',
      fontWeight: 'bold',
    },
    textBlock: {
      maxWidth: 300,
    },
    textBlockBottomMargin: {
      marginBottom: theme.spacing(4),
    }
  }),
);

export function Home() {
  const { translate } = React.useContext(I18nContext);
  const classes = useStyles();

  React.useEffect(() => {
    setPageTitle(translate('common.zeroth'));
  }, []);

  return (
    <Container >
      <Grid
        container
        direction='column'
        justify='center'
        alignItems='center'
        alignContent='center'
        spacing={2}
      >
        <Grid item className={classes.header}>
          <Typography variant='h4' className={classes.headerText} >{translate('home.header')}</Typography>
        </Grid>
        <Grid item >
          <Typography align='center' className={classes.text} >{translate('home.textBlocks.1')}</Typography>
        </Grid>
        <Grid item>
          <img src={IMAGES.HomePage.drawer.jpg['1x']} />
        </Grid>
        <Grid item>
          <ICONS.Number1 />
        </Grid>
        <Grid item className={clsx(classes.textBlock, classes.textBlockBottomMargin)} >
          <Typography align='center' className={classes.text} >{translate('home.textBlocks.2')}</Typography>
        </Grid>
        <Grid item>
          <img src={IMAGES.HomePage.header.jpg['1x']} />
        </Grid>
        <Grid item>
          <ICONS.Number2 />
        </Grid>
        <Grid item className={clsx(classes.textBlock, classes.textBlockBottomMargin)}>
          <Typography align='center' className={classes.text} >{translate('home.textBlocks.3')}</Typography>
        </Grid>
        <Grid item className={classes.textBlock}>
          <Typography align='center' className={classes.text} >{translate('home.textBlocks.4')}</Typography>
        </Grid>
        <Grid item>
          <Link color='inherit' className={classes.text} href={`mailto:${CONTACT_EMAIL}`} >{CONTACT_EMAIL}</Link>
        </Grid>
      </Grid>
    </Container>
  );
}
