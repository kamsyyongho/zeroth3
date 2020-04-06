import { Container } from "@material-ui/core";
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from "reactn";

interface TabPanelProps {
  children?: React.ReactNode;
  index: unknown;
  value: unknown;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    hidden: {
      display: 'none',
    },
  }),
);

/**
 * Used to hide the nested contents when the matching tab is not the active tab
 * @param props 
 */
export function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  const classes = useStyles();

  return (
    <Container
      className={value === index ? undefined : classes.hidden}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {children}
    </Container>
  );
}