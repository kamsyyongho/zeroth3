import { Select } from '@material-ui/core';
import FormControl from '@material-ui/core/FormControl';
import IconButton from '@material-ui/core/IconButton';
import MenuItem from '@material-ui/core/MenuItem';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { TablePaginationActionsProps } from '@material-ui/core/TablePagination/TablePaginationActions';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import LastPageIcon from '@material-ui/icons/LastPage';
import React from 'reactn';

const useStyles = makeStyles(theme => ({
  root: {
    flexShrink: 0,
    marginLeft: theme.spacing(2.5)
  },
  select: {
    paddingTop: 8.
  }
}));

interface PaginationProps extends TablePaginationActionsProps {
  pageCount: number;
}

export function Pagination(props: PaginationProps) {
  const classes = useStyles();
  const theme = useTheme();
  const {
    pageCount,
    count,
    page,
    rowsPerPage,
    onChangePage
  } = props;

  const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    onChangePage(event as any, 0);
  };

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    onChangePage(event as any, page - 1);
  };

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    onChangePage(event as any, page + 1);
  };

  const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    onChangePage(event as any, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  const handlePageChange = (event: any) => {
    onChangePage(event, event.target.value);
  };


  const pageSelectItems = React.useMemo(() => {
    const tempPageSelectItems: JSX.Element[] = [];
    for (let i = 0; i < pageCount; i++) {
      const display = i + 1;
      tempPageSelectItems.push(<MenuItem key={i} value={i}>{display}</MenuItem>);
    }
    return tempPageSelectItems;
  }, [pageCount]);

  const backDisabled = page === 0;
  const forwardDisabled = page >= Math.ceil(count / rowsPerPage) - 1;


  return <div className={classes.root}>
    <IconButton onClick={handleFirstPageButtonClick} disabled={backDisabled} aria-label="first page">
      {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
    </IconButton>
    <IconButton onClick={handleBackButtonClick} disabled={backDisabled} aria-label="previous page">
      {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
    </IconButton>
    <FormControl>
      <Select
        id="page-select"
        value={page}
        onChange={handlePageChange}
        className={classes.select}
        style={{ paddingTop: 6 }}
      >
        {pageSelectItems}
      </Select>
    </FormControl>
    <IconButton onClick={handleNextButtonClick} disabled={forwardDisabled} aria-label="next page">
      {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
    </IconButton>
    <IconButton onClick={handleLastPageButtonClick} disabled={forwardDisabled} aria-label="last page">
      {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
    </IconButton>
  </div>;
}
