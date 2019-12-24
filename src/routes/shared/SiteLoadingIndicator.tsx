import { Grid } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import React from 'react';
import ScaleLoader from 'react-spinners/ScaleLoader';

export function SiteLoadingIndicator() {
  const theme = useTheme();
  return (<Grid
    container
    spacing={0}
    direction="column"
    alignItems="center"
    justify="center"
    style={{ minHeight: '100vh' }}
  >
    <Grid item xs={3}>
      <ScaleLoader
        height={50}
        width={10}
        radius={20}
        color={theme.palette.primary.main}
        loading={true}
      />
    </Grid>
  </Grid>);
}
