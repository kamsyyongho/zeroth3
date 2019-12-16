import React from 'react';
import { BulletList } from 'react-content-loader';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { DataSet } from '../../../types';
import log from '../../../util/log/logger';

interface SETProps {
  projectId: string;
  refreshCounter?: number;
}

export default function SET(props: SETProps) {
  const { projectId, refreshCounter } = props;
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [setsLoading, setSetsLoading] = React.useState(true);
  const [dataSets, setDataSets] = React.useState<DataSet[]>([]);


  const getDataSets = React.useCallback(async () => {
    if (api?.dataSet && projectId) {
      setSetsLoading(true);
      const response = await api.dataSet.getAll(projectId);
      if (response.kind === 'ok') {
        setDataSets(response.dataSets);
      } else {
        log({
          file: `SET.tsx`,
          caller: `getDataSets - failed to get data sets`,
          value: response,
          important: true,
        });
      }
      setSetsLoading(false);
    }
  }, [api, projectId]);

  /**
   * should fetch data on initial load and every time the counter changes
   */
  React.useEffect(() => {
    getDataSets();
  }, [refreshCounter]);

  return (
    <div>
      {setsLoading ? <BulletList /> : <div >
        {JSON.stringify(dataSets)}
      </div>}
    </div>
  );
};