import { Container, Grid, Link, Paper, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from "reactn";
import { I18nContext } from '../../hooks/i18n/I18nContext';
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
    useAge: {
      padding: theme.spacing(3),
      textAlign: 'center',
      color: theme.palette.text.primary,      
    },
    
  }),
);

export function Test() {

  //const api = React.useContext(ApiContext);
  //const { translate } = React.useContext(I18nContext);
  
  const classes = useStyles();

  function aa(){
    console.log("++");
    

  }
/*
  React.useEffect(() => {
    
    setPageTitle(translate('common.zeroth'));
    
    let secondInt = 0;
    
    const interval = setInterval(() => {
      
      secondInt ++;

      console.log(secondInt);
      
      aa();

    }, 5000);

    return () => clearInterval(interval);

  }, []);
*/
  return (
    
   <Container> 
      <div className="test">test</div>  
  </Container>
  );
}

