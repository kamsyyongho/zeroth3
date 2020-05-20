import { FormControlLabel, Typography } from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';
import Textfield from '@material-ui/core/TextField';
import { CellProps } from 'react-table';
import React from 'reactn';
import { KeycloakContext } from '../../../../hooks/keycloak/KeycloakContext';
import { User } from '../../../../types';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';

interface UsersCellCheckboxProps {
    cellData: CellProps<User>;
}

export function UsersCellPlainText(props: UsersCellCheckboxProps) {
    const { cellData } = props;
    const { user } = React.useContext(KeycloakContext);
    const [isDisabled, setIsDisabled] = React.useState(true);
    const [value, setValue] = React.useState();
    const { translate, language } = React.useContext(I18nContext);
    const editableTextRef = React.useRef();

    const cellValue = cellData.cell.value;
    const index = cellData.cell.row.index;
    const id = cellData.column.id;
    const key = `${index}-email:${cellValue}`;

    const handleChange = (event: SyntheticEvent) => {
        const value = event.target.value;

    }

    React.useEffect(() => {
        if(id === 'firstName') {
            setValue(translate('profile.fullName', { family: cellData.data[index].lastName || '', given: cellData.data[index].firstName || '' }));
        } else {
            setValue(cellData.cell.value);
        }
    },[cellData]);

    if(id === 'firstName') return (<Typography key={key}>{value?.trim().length ? value : '-'}</Typography>);

    return <FormControlLabel
        key={key}
        control={
            <Textfield
                inputRef={editableTextRef}
                inputProps={{ style: {textAlign: 'center'} }}
                value={value ? value : '-'}
                color="secondary"
                onClick={() => setIsDisabled(false)}
                onBlur={() => setIsDisabled(true)}
                disabled={isDisabled}
                // onChange={(event) => handleCheck(cellUser.id, event.target.checked)}
            />
        }
        label={value}
    />;

}

