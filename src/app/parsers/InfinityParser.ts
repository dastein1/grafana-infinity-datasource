import { uniq, flatten } from 'lodash';
import { FieldColorMode, toDataFrame } from '@grafana/data';
import { filterResults } from './filter';
import { normalizeColumns } from './utils';
import { isDataQuery } from './../utils';
import { InfinityQuery, InfinityColumn, GrafanaTableRow, timeSeriesResult } from './../../types';

export class InfinityParser<T extends InfinityQuery> {
  target: T;
  rows: GrafanaTableRow[];
  series: timeSeriesResult[];
  AutoColumns: InfinityColumn[] = [];
  StringColumns: InfinityColumn[] = [];
  NumbersColumns: InfinityColumn[] = [];
  TimeColumns: InfinityColumn[] = [];
  constructor(target: T) {
    this.rows = [];
    this.series = [];
    this.target = target;
    if (isDataQuery(target)) {
      this.AutoColumns = target.columns || [];
      this.StringColumns = target.columns.filter((t) => t.type === 'string');
      this.NumbersColumns = target.columns.filter((t) => t.type === 'number');
      this.TimeColumns = target.columns.filter((t) => t.type === 'timestamp' || t.type === 'timestamp_epoch' || t.type === 'timestamp_epoch_s');
    }
  }
  private canAutoGenerateColumns(): boolean {
    return ['csv', 'tsv', 'json', 'graphql'].includes(this.target.type) && isDataQuery(this.target) && this.target.columns.length === 0;
  }
  toTable() {
    let columns = isDataQuery(this.target) ? this.target.columns : [];
    if (this.canAutoGenerateColumns()) {
      columns = this.AutoColumns;
    }
    return {
      name: this.target.refId,
      rows: this.rows.filter((row) => row.length > 0),
      columns: normalizeColumns(columns),
    };
  }
  toTimeSeries() {
    const targets = uniq(this.series.map((s) => s.target));
    return targets.map((t) => {
      return {
        target: t,
        name: this.target.refId,
        datapoints: flatten(this.series.filter((s) => s.target === t).map((s) => s.datapoints)),
      };
    });
  }
  getResults() {
    if (isDataQuery(this.target) && this.target.filters && this.target.filters.length > 0 && this.target.columns && this.target.columns.length > 0) {
      this.rows = filterResults(this.rows, this.target.columns, this.target.filters);
    }
    if (isDataQuery(this.target) && this.target.format === 'timeseries') {
      return this.toTimeSeries();
    } else if (isDataQuery(this.target) && this.target.format === 'dataframe') {
      const frame = toDataFrame(this.toTable());
      frame.name = this.target.refId;
      return frame;
    } else {
      if (isDataQuery(this.target) && this.target.format === 'node-graph-nodes') {
        const frame = toDataFrame(this.toTable());
        frame.name = this.target.refId;
        frame.fields = frame.fields
          .map((field) => {
            if (field.name.startsWith('arc__')) {
              let matching_color_field = frame.fields.find((f) => f.name.startsWith(field.name) && f.name.endsWith('_color'));
              if (matching_color_field) {
                field.config = {
                  displayName: field.name.replace('arc__', ''),
                  color: {
                    mode: FieldColorMode?.Fixed || 'fixed',
                    fixedColor: matching_color_field.values.get(0) || '',
                  },
                };
              }
            } else if (field.name.startsWith('detail__')) {
              field.config = {
                ...field.config,
                displayName: field.values.get(0),
              };
            }
            return field;
          })
          .filter((f) => {
            return !(f.name.startsWith('arc__') && f.name.endsWith('_color'));
          });
        return frame;
      } else if (isDataQuery(this.target) && this.target.format === 'node-graph-edges') {
        const frame = toDataFrame(this.toTable());
        frame.name = this.target.refId;
        frame.fields = frame.fields.map((field) => {
          if (field.name.startsWith('detail__')) {
            field.config = {
              ...field.config,
              displayName: field.values.get(0),
            };
          }
          return field;
        });
        return frame;
      } else {
        return this.toTable();
      }
    }
  }
}
