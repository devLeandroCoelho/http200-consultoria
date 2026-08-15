/**
 * HTTP200.TI Consultoria — Mock compartilhado do @supabase/supabase-js
 *
 * Os handlers usam `createClient(...)` no topo do módulo e depois encadeiam
 * queries do PostgREST (`.from(...).select().eq().order()`, `.upsert()`,
 * `.insert().select().single()`, `.update().eq()` etc.).
 *
 * Este mock devolve um client cujo builder é *thenable*: as chamadas
 * encadeadas são gravadas em `supabaseState` e o resultado final
 * (resolve de `{ data, error }`) é controlado pelo teste via
 * `supabaseState.selectResult` / `insertResult` / `updateResult` / `upsertResult`.
 *
 * Cada `createClient(url, key)` recebe a key do ambiente e a grava em
 * `supabaseState.clients`; toda chamada ao "banco" é etiquetada com
 * `clientKey` para os testes verificarem que leituras usam a anon key e
 * escritas usam a service_role key (fix MAJOR RLS — separação de papéis).
 *
 * NUNCA toca em rede/Supabase real.
 */

export const supabaseState = {
  /** Resultados controlados pelo teste */
  selectResult: { data: [], error: null },
  insertResult: { data: null, error: null },
  updateResult: { data: null, error: null },
  deleteResult: { data: null, error: null },
  upsertResult: { data: null, error: null },
  /** Clientes criados: [{ url, key }] */
  clients: [],
  /** Chamadas gravadas para asserções (data/opts enviados ao "banco") */
  selectCalls: [],
  insertCalls: [],
  updateCalls: [],
  deleteCalls: [],
  upsertCalls: [],

  reset() {
    this.selectResult = { data: [], error: null };
    this.insertResult = { data: null, error: null };
    this.updateResult = { data: null, error: null };
    this.deleteResult = { data: null, error: null };
    this.upsertResult = { data: null, error: null };
    this.clients = [];
    this.selectCalls = [];
    this.insertCalls = [];
    this.updateCalls = [];
    this.deleteCalls = [];
    this.upsertCalls = [];
  },
};

/**
 * Escolhe o resultado conforme o tipo de operação mais recente da cadeia.
 * Regra: insert/update/delete têm prioridade sobre select (porque o código
 * usa `.insert().select().single()` e `.update().eq().select().single()`).
 */
function resolveResult(ops) {
  for (let i = ops.length - 1; i >= 0; i -= 1) {
    const op = ops[i];
    if (op.type === 'insert') return supabaseState.insertResult;
    if (op.type === 'update') return supabaseState.updateResult;
    if (op.type === 'delete') return supabaseState.deleteResult;
  }
  return supabaseState.selectResult;
}

/** Cria um client mockado; cada `from(table)` devolve um builder thenable. */
export function createMockClient(url, key) {
  supabaseState.clients.push({ url, key });
  const ops = [];
  const clientKey = key;

  const builder = {
    select(columns) {
      supabaseState.selectCalls.push({ columns, clientKey });
      ops.push({ type: 'select' });
      return builder;
    },
    eq(column, value) {
      ops.push({ type: 'eq', column, value });
      return builder;
    },
    order() {
      return builder;
    },
    single() {
      return builder;
    },
    upsert(data, opts) {
      supabaseState.upsertCalls.push({ data, opts, clientKey });
      return Promise.resolve(supabaseState.upsertResult);
    },
    insert(data) {
      supabaseState.insertCalls.push({ data, clientKey });
      ops.push({ type: 'insert', data });
      return builder;
    },
    update(data) {
      supabaseState.updateCalls.push({ data, clientKey });
      ops.push({ type: 'update', data });
      return builder;
    },
    delete() {
      ops.push({ type: 'delete' });
      return builder;
    },
    then(resolve, reject) {
      return Promise.resolve(resolveResult(ops)).then(resolve, reject);
    },
  };

  return {
    from() {
      return builder;
    },
  };
}
