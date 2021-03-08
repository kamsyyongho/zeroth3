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

const master1data = [{x: "13:01", y: 20}, {x: "13:02", y: 30}, {x: "13:03", y: 20}, {x: "13:04", y: 40}, {x: "13:05", y: 20}];
const master2data = [{x: "13:01", y: 30}, {x: "13:02", y: 10}, {x: "13:03", y: 50}, {x: "13:04", y: 20}, {x: "13:05", y: 10}];

export function Home() {
  const { translate } = React.useContext(I18nContext);
  const classes = useStyles();

  React.useEffect(() => {
    setPageTitle(translate('common.zeroth'));
  }, []);

  return (
    
   <Container> 
      <Grid container xs={10} spacing={3} >
        <Grid xs={3} className={classes.useAge}>
          <Paper>master1</Paper>
          <Paper> 20 / 80 </Paper>
        </Grid>
        <Grid xs={3} className={classes.useAge}>
          <Paper>master2</Paper>
          <Paper> 20 / 80 </Paper>
        </Grid>
      </Grid>
      <Grid xs={10}>
        <VictoryChart height={350} width={1500} maxDomain={{y : 100}} minDomain={{y : 0}}>
          
          <VictoryLine 
          data={master1data}
          style={{
            data: {
              stroke: "#02B875"
            }
          }}
          />

          <VictoryLine 
          data={master2data}
          style={{
            data: {
              stroke: "#5882FA"
            }
          }}
          />

        </VictoryChart>          
      </Grid>
      <Grid container xs={12}>
          <Grid xs={6}>
            <Grid>
              <Paper className={classes.useAge}>CPU useAge</Paper>
            </Grid>
            <Grid>
              <VictoryChart height={350} width={1500} maxDomain={{y : 100}} minDomain={{y : 0}}>
            
                <VictoryLine 
                data={master1data}
                style={{
                  data: {
                    stroke: "#02B875"
                  }
                }}
                />

                <VictoryLine 
                data={master2data}
                style={{
                  data: {
                    stroke: "#5882FA"
                  }
                }}
                />

              </VictoryChart>                
            </Grid>
          </Grid>
          <Grid xs={6}>
            <Grid>
              <Paper className={classes.useAge}>memoryUseAge</Paper>
            </Grid>
            <Grid>
              <VictoryChart height={350} width={1500} maxDomain={{y : 100}} minDomain={{y : 0}}>
            
                <VictoryLine 
                data={master1data}
                style={{
                  data: {
                    stroke: "#02B875"
                  }
                }}
                />

                <VictoryLine 
                data={master2data}
                style={{
                  data: {
                    stroke: "#5882FA"
                  }
                }}
                />

              </VictoryChart>                
            </Grid>
          </Grid>
      </Grid>
  </Container>
  );
}
