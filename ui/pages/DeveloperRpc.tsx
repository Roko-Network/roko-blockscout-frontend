/* eslint-disable react/jsx-no-bind */
import { Box, Code, Flex, Grid, Input, Text, chakra } from '@chakra-ui/react';
import React from 'react';

import { usePolkadotApi } from 'lib/polkadot/useApi';
import { Button } from 'toolkit/chakra/button';
import { Skeleton } from 'toolkit/chakra/skeleton';
import PageTitle from 'ui/shared/Page/PageTitle';

interface RpcMethod {
  namespace: string;
  method: string;
  full: string;
  description?: string;
}

/**
 * Curated short-list of frequently-useful RPC entries. The full list is
 * discovered from the chain on connect (via `rpc_methods`) and shown below.
 */
const CURATED: Array<RpcMethod> = [
  { namespace: 'system', method: 'chain', full: 'system_chain', description: 'Network name.' },
  { namespace: 'system', method: 'health', full: 'system_health', description: 'Sync state, peer count.' },
  { namespace: 'system', method: 'name', full: 'system_name', description: 'Node binary name.' },
  { namespace: 'system', method: 'version', full: 'system_version', description: 'Node binary version.' },
  { namespace: 'chain', method: 'getFinalizedHead', full: 'chain_getFinalizedHead' },
  { namespace: 'chain', method: 'getHeader', full: 'chain_getHeader', description: 'Latest header (or specific hash).' },
  { namespace: 'temporal', method: 'getWatermarkInfo', full: 'temporal_getWatermarkInfo', description: 'Current temporal watermark.' },
  { namespace: 'temporal', method: 'getConsensusTime', full: 'temporal_getConsensusTime', description: 'Mesh time + quality.' },
  { namespace: 'temporal', method: 'getMeshState', full: 'temporal_getMeshState', description: 'Pairwise validator offsets.' },
  { namespace: 'temporal', method: 'getCheckpoint', full: 'temporal_getCheckpoint', description: 'Latest time-health checkpoint.' },
  { namespace: 'temporal', method: 'getQueueStats', full: 'temporal_getQueueStats', description: 'Fee-priority queue depth + waits.' },
];

const DeveloperRpc = () => {
  const apiQuery = usePolkadotApi();
  const [ method, setMethod ] = React.useState<string>('');
  const [ paramsJson, setParamsJson ] = React.useState<string>('[]');
  const [ result, setResult ] = React.useState<string | null>(null);
  const [ error, setError ] = React.useState<string | null>(null);
  const [ isQuerying, setIsQuerying ] = React.useState(false);

  const handleSubmit = React.useCallback(async() => {
    if (!apiQuery.data?.api || !method) return;
    setIsQuerying(true);
    setError(null);
    setResult(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const api: any = apiQuery.data.api;
      const parsed = JSON.parse(paramsJson);
      if (!Array.isArray(parsed)) throw new Error('Params must be a JSON array');
      // method is "namespace_method" or "namespace.method"; normalize to "namespace_method"
      const normalized = method.replace('.', '_');
      const res = await api.rpc.send(normalized, parsed);
      setResult(JSON.stringify(res, null, 2));
    } catch (err) {
      // Fall back to typed rpc namespace if direct send isn't allowed.
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const api: any = apiQuery.data?.api;
        const parts = method.includes('.') ? method.split('.') : method.split('_');
        const ns = parts[0];
        const m = parts[1];
        const parsed: unknown = JSON.parse(paramsJson);
        if (!Array.isArray(parsed)) throw new Error('Params must be a JSON array');
        const res = await api.rpc[ns][m](...(parsed as Array<unknown>));
        const rendered = typeof res?.toHuman === 'function' ? JSON.stringify(res.toHuman(), null, 2) : String(res);
        setResult(rendered);
      } catch (err2) {
        const msg2 = err2 instanceof Error ? err2.message : null;
        const msg1 = err instanceof Error ? err.message : null;
        setError(msg2 ?? msg1 ?? 'Unknown error');
      }
    } finally {
      setIsQuerying(false);
    }
  }, [ apiQuery.data, method, paramsJson ]);

  if (apiQuery.isLoading) return <Skeleton loading={ true } w="100%" h="300px"/>;
  if (apiQuery.isError) return <Box p={ 6 } color="red.500">Failed to connect to chain RPC.</Box>;

  return (
    <>
      <PageTitle
        title="RPC Calls"
        secondRow={ (
          <chakra.span fontSize="sm" color="text.secondary">
            Call standard substrate RPCs + Roko's custom temporal_* runtime APIs.
          </chakra.span>
        ) }
      />

      <Box mb={ 4 }>
        <Text fontWeight={ 600 } fontSize="sm" mb={ 2 }>Curated</Text>
        <Flex gap={ 2 } wrap="wrap">
          { CURATED.map((m) => (
            <chakra.button
              key={ m.full }
              type="button"
              onClick={ () => setMethod(m.full) }
              px={ 3 }
              py={ 1 }
              borderRadius="md"
              borderWidth="1px"
              fontSize="xs"
              fontFamily="mono"
              bg={ method === m.full ? 'blue.50' : 'transparent' }
              _dark={{ bg: method === m.full ? 'blue.900/30' : 'transparent' }}
              _hover={{ borderColor: 'blue.400' }}
              title={ m.description }
            >
              { m.full }
            </chakra.button>
          )) }
        </Flex>
      </Box>

      <Grid templateColumns={{ base: '1fr', md: '1fr 2fr' }} gap={ 4 } mb={ 4 }>
        <Box>
          <Text fontSize="sm" mb={ 1 } color="text.secondary">Method (namespace_method)</Text>
          <Input value={ method } onChange={ (e) => setMethod(e.target.value) } fontFamily="mono" fontSize="sm"/>
        </Box>
        <Box>
          <Text fontSize="sm" mb={ 1 } color="text.secondary">Params (JSON array)</Text>
          <Input
            value={ paramsJson }
            onChange={ (e) => setParamsJson(e.target.value) }
            placeholder="[]"
            fontFamily="mono"
            fontSize="sm"
          />
        </Box>
      </Grid>

      <Flex mb={ 4 } gap={ 3 }>
        <Button onClick={ handleSubmit } disabled={ !method || isQuerying } loading={ isQuerying }>Call</Button>
        { result && (
          <Button
            variant="outline"
            onClick={ () => {
              setResult(null);
              setError(null);
            } }
          >
            Clear
          </Button>
        ) }
      </Flex>

      { error && (
        <Box p={ 4 } mb={ 4 } borderWidth="1px" borderRadius="md" color="red.500">
          <Text fontSize="sm" fontFamily="mono">{ error }</Text>
        </Box>
      ) }

      { result && (
        <Code display="block" whiteSpace="pre" p={ 3 } borderRadius="md" fontSize="xs" overflowX="auto">
          { result }
        </Code>
      ) }
    </>
  );
};

export default DeveloperRpc;
