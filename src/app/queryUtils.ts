import { getTemplateSrv } from '@grafana/runtime';
import { ScopedVars } from '@grafana/data';
import { InfinityQuery, InfinityInstanceSettings } from '../types';

const replaceVariable = (input: string, scopedVars: ScopedVars): string => {
  return getTemplateSrv().replace(input || '', scopedVars, 'glob');
};

export const replaceVariables = (query: InfinityQuery, scopedVars: ScopedVars): InfinityQuery => {
  return {
    ...query,
    url: replaceVariable(query.url, scopedVars),
    data: replaceVariable(query.data, scopedVars),
    url_options: {
      ...query.url_options,
      data: replaceVariable(query.url_options?.data || '', scopedVars),
      params: query.url_options?.params?.map((param) => {
        return {
          ...param,
          value: getTemplateSrv().replace(param?.value || '', scopedVars, 'glob'),
        };
      }),
      headers: query.url_options?.headers?.map((header) => {
        return {
          ...header,
          value: getTemplateSrv().replace(header?.value || '', scopedVars, 'glob'),
        };
      }),
    },
    filters: (query.filters ? [...query.filters] : []).map((filter) => {
      filter.value = filter.value.map((val) => {
        return getTemplateSrv().replace(val || '', scopedVars, 'glob');
      });
      return filter;
    }),
  };
};

export const IsValidInfinityQuery = (query: InfinityQuery): boolean => {
  if (query && query.type !== undefined && ['csv', 'json', 'xml'].includes(query.type) && query.source === 'url') {
    return query.url !== undefined && query.url !== '';
  } else if (query && query.type !== undefined && ['csv', 'json', 'xml'].includes(query.type) && query.source === 'inline') {
    return query.data !== undefined && query.data !== '';
  } else {
    return query !== undefined && query.type !== undefined;
  }
};

export const getDefaultGlobalQueryID = (ins: InfinityInstanceSettings): string => {
  let queries = ins.jsonData.global_queries;
  return queries && queries.length > 0 ? queries[0].id : '';
};
