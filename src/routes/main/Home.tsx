import { Container, Grid, Link, Paper, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from "reactn";
import { CONTACT_EMAIL } from '../../constants/misc.constants';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { ICONS } from '../../theme/icons';
import { IMAGES } from '../../theme/images';
import { CustomTheme } from '../../theme/index';
import { setPageTitle } from '../../util/misc';
import {  VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryStack, VictoryArea, VictoryLine } from 'victory';
import { ApiContext } from '../../hooks/api/ApiContext';
import log from '../../util/log/logger';
import { array } from 'yup';

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
        
const master1data = [{x: " ", y: 70},{x: "2", y: 20},{x: "4", y: 20},{x: "6", y: 20},{x: "8", y: 20},{x: "10", y: 20},{x: "12", y: 20},{x: "14", y: 20}, {x: "16", y: 30}, {x: "18", y: 20}, {x: "20", y: 40}, {x: "22", y: 20}];
//const master2data = [{x: "13:01", y: 30}, {x: "13:02", y: 10}, {x: "13:03", y: 50}, {x: "13:04", y: 20}, {x: "13:05", y: 10}];

let grap1 = [];

export function Home() {

  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);
  
  const classes = useStyles();

  function aa(){
    console.log("++");
    
    //getVoiceDataInReview();

    getUsers();
  }

  const getUsers = async () => {

    if (api?.IAM) {
      const response = await api.IAM.getWorkData();
      
      console.log(new Date().setDate(new Date().getDate() -1));
      console.log(new Date().getTime());
      
      if(response.kind==='ok'){
        response.grap.data.result[0].values.forEach(item => {
          
          grap1.push({x:"",y:String(item[1])});
          
        });
      }
    
    }
  };  

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

  return (
    
   <Container> 
      <div className="test">test</div>
      <Grid container xs={10} spacing={3} >
        <Grid item xs={3} className={classes.useAge} >
          <Paper>master1</Paper>
          <Paper> 20 / 80 </Paper>
        </Grid>
        <Grid item xs={3} className={classes.useAge}>
          <Paper>master2</Paper>
          <Paper> 20 / 80 </Paper>
        </Grid>
      </Grid>
      <Grid>
        <svg height={350} width={1280}>
          <VictoryChart height={350} width={1232} maxDomain={{y : 100}} minDomain={{y : 0}} standalone={false}>
            
            <VictoryLine 
            data={master1data}
            style={{
              data: {
                stroke: "#02B875"
              }
            }}
            />

          </VictoryChart>  
        </svg>        
      </Grid>
      
  </Container>
  );
}

