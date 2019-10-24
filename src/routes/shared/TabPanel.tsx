import { Container } from "@material-ui/core";
import React from "react";

interface TabPanelProps {
  children?: React.ReactNode;
  index: unknown;
  value: unknown;
}

/**
 * Used to hide the nested contents when the matching tab is not the active tab
 * @param props 
 */
export function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Container
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {children}
    </Container>
  );
}