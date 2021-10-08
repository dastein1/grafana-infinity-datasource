import { forEach, get, toNumber } from 'lodash';
import { parseString } from 'xml2js';
import { InfinityParser } from './InfinityParser';
import { InfinityQuery, InfinityColumn, GrafanaTableRow } from './../../types';

export class XMLParser extends InfinityParser {
  constructor(XMLResponse: any | string, target: InfinityQuery, endTime?: Date) {
    super(target);
    this.formatInput(XMLResponse).then((xmlResponse: any) => {
      if (this.target.root_selector) {
        xmlResponse = get(xmlResponse, this.target.root_selector);
      }
      if (Array.isArray(xmlResponse)) {
        this.constructTableData(xmlResponse);
        this.constructTimeSeriesData(xmlResponse, endTime);
      } else {
        this.constructSingleTableData(xmlResponse);
      }
    });
  }
  private formatInput(XMLResponse: string) {
    return new Promise((resolve, reject) => {
      parseString(XMLResponse, (err, res) => {
        resolve(res);
      });
    });
  }
  private constructTableData(XMLResponse: any[]) {
    forEach(XMLResponse, (r) => {
      const row: GrafanaTableRow = [];
      this.target.columns.forEach((c: InfinityColumn) => {
        let value = get(r, c.selector, '');
        if (c.type === 'timestamp') {
          value = new Date(value + '');
        } else if (c.type === 'timestamp_epoch') {
          value = new Date(parseInt(value, 10));
        } else if (c.type === 'timestamp_epoch_s') {
          value = new Date(parseInt(value, 10) * 1000);
        } else if (c.type === 'number') {
          value = value === '' ? null : +value;
        }
        if (typeof r === 'string') {
          row.push(r);
        } else {
          if (['string', 'number', 'boolean'].includes(typeof value)) {
            row.push(value);
          } else if (value && typeof value.getMonth === 'function') {
            row.push(value);
          } else {
            if (value && Array.isArray(value)) {
              row.push(value.join(','));
            } else {
              row.push(JSON.stringify(value));
            }
          }
        }
      });
      this.rows.push(row);
    });
  }
  private constructTimeSeriesData(XMLResponse: object, endTime: Date | undefined) {
    this.NumbersColumns.forEach((metricColumn: InfinityColumn) => {
      forEach(XMLResponse, (r) => {
        let seriesName = this.StringColumns.map((c) => r[c.selector]).join(' ');
        if (this.NumbersColumns.length > 1) {
          seriesName += ` ${metricColumn.text}`;
        }
        if (this.NumbersColumns.length === 1 && seriesName === '') {
          seriesName = `${metricColumn.text}`;
        }
        seriesName = seriesName.trim();
        let timestamp = endTime ? endTime.getTime() : new Date().getTime();
        if (this.TimeColumns.length >= 1) {
          const FirstTimeColumn = this.TimeColumns[0];
          if (FirstTimeColumn.type === 'timestamp') {
            timestamp = new Date(get(r, FirstTimeColumn.selector) + '').getTime();
          } else if (FirstTimeColumn.type === 'timestamp_epoch') {
            timestamp = new Date(parseInt(get(r, FirstTimeColumn.selector), 10)).getTime();
          } else if (FirstTimeColumn.type === 'timestamp_epoch_s') {
            timestamp = new Date(parseInt(get(r, FirstTimeColumn.selector), 10) * 1000).getTime();
          }
        }
        let metric = toNumber(get(r, metricColumn.selector));
        this.series.push({
          target: seriesName,
          datapoints: [[metric, timestamp]],
        });
      });
    });
  }
  private constructSingleTableData(XMLResponse: object) {
    const row: GrafanaTableRow = [];
    this.target.columns.forEach((c: InfinityColumn) => {
      row.push(get(XMLResponse, c.selector, ''));
    });
    this.rows.push(row);
  }
}
