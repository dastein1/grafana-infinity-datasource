import React, { useState } from 'react';
import { Checkbox, Drawer, Button } from '@grafana/ui';
import { InfinityQuery, InfinityJSONQueryOptions } from '../types';

export const JSONOptionsEditor = (props: { query: InfinityQuery; onChange: (value: InfinityQuery) => void; onRunQuery: () => void }) => {
  const [popupStatus, setPopupStatus] = useState(false);
  const { query, onChange } = props;
  if (query.type !== 'json') {
    return <></>;
  }
  const { json_options = {} } = query;
  const onJsonOptionsChange = <T extends keyof InfinityJSONQueryOptions, V extends InfinityJSONQueryOptions[T]>(key: T, value: V) => {
    onChange({ ...query, json_options: { ...json_options, [key]: value } });
  };
  return (
    <>
      <div style={{ padding: 'auto 15px;' }}>
        <Button
          variant="secondary"
          size="sm"
          icon="cog"
          style={{ margin: '5px' }}
          onClick={(e) => {
            setPopupStatus(!popupStatus);
            e.preventDefault();
          }}
        >
          JSON options
        </Button>
      </div>
      {popupStatus === true && (
        <Drawer title="Advanced JSON parsing options" onClose={() => setPopupStatus(!popupStatus)}>
          <div className="gf-form">
            <label className="gf-form-label query-keyword width-14">Root returns object instead array?</label>
            <div style={{ margin: '5px' }}>
              <Checkbox css={{}} value={json_options.root_is_not_array} onChange={(e) => onJsonOptionsChange('root_is_not_array', e.currentTarget.checked)}></Checkbox>
            </div>
          </div>
          <div className="gf-form">
            <label className="gf-form-label query-keyword width-14">Is data in columnar format?</label>
            <div style={{ margin: '5px' }}>
              <Checkbox css={{}} value={json_options.columnar} onChange={(e) => onJsonOptionsChange('columnar', e.currentTarget.checked)}></Checkbox>
            </div>
          </div>
        </Drawer>
      )}
    </>
  );
};
