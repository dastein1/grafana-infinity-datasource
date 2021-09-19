import { PluginType } from '@grafana/data';
import { InfinityDatasource } from './datasource';

function TemplateSrvStub(this: any) {
  this.replace = (text: string) => {
    return text;
  };
}

//@ts-ignore
const templateSrv = new TemplateSrvStub();

jest.mock('@grafana/runtime', () => ({
  ...(jest.requireActual('@grafana/runtime') as unknown as object),
  getTemplateSrv: () => templateSrv,
}));

const DummyDatasource = {
  id: 1,
  uid: '',
  name: '',
  type: 'yesoreyeram-infinity-datasource',
  meta: {
    id: '',
    name: '',
    module: '',
    type: PluginType.datasource,
    baseUrl: '',
    info: {
      description: '',
      screenshots: [],
      updated: '',
      version: '',
      links: [],
      logos: {
        small: '',
        large: '',
      },
      author: {
        name: '',
      },
    },
  },
  jsonData: {},
};

describe('metricFindQuery - Random Variable', () => {
  it('Random', () => {
    expect.assertions(1);
    new InfinityDatasource(DummyDatasource)
      .metricFindQuery({
        query: 'Random(A,B,C,D)',
        queryType: 'legacy',
      })
      .then((res) => {
        expect(['A', 'B', 'C', 'D']).toContain(res[0].text);
      })
      .catch((ex) => {
        expect(ex).toEqual(new Error());
      });
  });
});

describe('metricFindQuery - Join', () => {
  it('Join', () => {
    expect.assertions(1);
    new InfinityDatasource(DummyDatasource)
      .metricFindQuery({
        query: 'Join(A,B,C,D)',
        queryType: 'legacy',
      })
      .then((res) => {
        expect(res[0].text).toBe('ABCD');
      })
      .catch((ex) => {
        expect(ex).toEqual(new Error());
      });
  });
});

describe('metricFindQuery - Collection', () => {
  it('Collection', () => {
    expect.assertions(5);
    new InfinityDatasource(DummyDatasource)
      .metricFindQuery({
        query: 'Collection(A,B,C,D)',
        queryType: 'legacy',
      })
      .then((res) => {
        expect(res.length).toBe(2);
        expect(res[0].text).toBe('A');
        expect(res[0].value).toBe('B');
        expect(res[1].text).toBe('C');
        expect(res[1].value).toBe('D');
      })
      .catch((ex) => {
        expect(ex).toEqual(new Error());
      });
  });
});

describe('metricFindQuery - CollectionLookup', () => {
  it('CollectionLookup', () => {
    expect.assertions(3);
    new InfinityDatasource(DummyDatasource)
      .metricFindQuery({
        query: 'CollectionLookup(pd,prod-server,np,nonprod-server,dev,dev-server,np)',
        queryType: 'legacy',
      })
      .then((res) => {
        expect(res.length).toBe(1);
        expect(res[0].value).toBe('nonprod-server');
        expect(res[0].text).toBe('nonprod-server');
      })
      .catch((ex) => {
        expect(ex).toEqual(new Error());
      });
  });
  it('CollectionLookup', () => {
    expect.assertions(3);
    new InfinityDatasource(DummyDatasource)
      .metricFindQuery({
        query: 'CollectionLookup(A,a,B,b,C,c,D,d,C)',
        queryType: 'legacy',
      })
      .then((res) => {
        expect(res.length).toBe(1);
        expect(res[0].value).toBe('c');
        expect(res[0].text).toBe('c');
      })
      .catch((ex) => {
        expect(ex).toEqual(new Error());
      });
  });
  it('CollectionLookup', () => {
    expect.assertions(1);
    new InfinityDatasource(DummyDatasource)
      .metricFindQuery({
        query: 'CollectionLookup(A,a,B,b,C,c,D,d,E)',
        queryType: 'legacy',
      })
      .then((res) => {
        expect(res.length).toBe(0);
      })
      .catch((ex) => {
        expect(ex).toEqual(new Error());
      });
  });
});
