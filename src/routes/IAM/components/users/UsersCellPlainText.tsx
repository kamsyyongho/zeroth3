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
    onChange?: (value: string, index: number) => void;
    noteOrPhoneValue?: any;
}

export function UsersCellPlainText(props: UsersCellCheckboxProps) {
    const { cellData, onChange, noteOrPhoneValue } = props;
    const { user } = React.useContext(KeycloakContext);
    const [isDisabled, setIsDisabled] = React.useState(true);
    const [value, setValue] = React.useState();
    const { translate, language } = React.useContext(I18nContext);
    const editableTextRef = React.useRef();

    const cellValue = cellData.cell.value;
    const index = cellData.cell.row.index;
    const id = cellData.column.id;
    const header = cellData.column.Header;
    const key = `${index}-${header}:${cellValue}`;

    const handleChange = (event: SyntheticEvent) => {
        const value = event.target.value;
        setValue(value);

    }

    const handleBlur = () => {
        if(onChange) {
            onChange(value, index);
        }
        setIsDisabled(true);
    }

    React.useEffect(() => {
        if(id === 'firstName') {
            setValue(translate('profile.fullName', { family: cellData.data[index].lastName || '', given: cellData.data[index].firstName || '' }));
        } else {
            setValue(noteOrPhoneValue[index] || '')
        }
    },[]);

    if(id === 'firstName') return (<Typography key={key}>{value?.trim().length ? value : '-'}</Typography>);

    return <Textfield
                inputRef={editableTextRef}
                inputProps={{ style: {textAlign: 'center'} }}
                placeholder={value ? value : '-'}
                value={value ? value : ''}
                color="secondary"
                onClick={() => setIsDisabled(false)}
                onBlur={handleBlur}
                disabled={isDisabled}
                onChange={handleChange}
            />
}

