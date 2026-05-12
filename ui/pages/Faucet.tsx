import { Box, Flex, Text, Input, VStack } from '@chakra-ui/react';
import React from 'react';

import { route } from 'nextjs-routes';

import config from 'configs/app';
import { Button } from 'toolkit/chakra/button';
import { Heading } from 'toolkit/chakra/heading';
import { Link } from 'toolkit/chakra/link';
import { Skeleton } from 'toolkit/chakra/skeleton';

const FAUCET_API = '/api/v2/faucet';

// 0x-prefixed 20-byte hex; matches what roko-admin's faucet validates server-side.
const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

interface FaucetStatus {
  enabled: boolean;
  balance: string;
  maxAmount: string;
  cooldownMs: number;
}

interface FaucetResult {
  success: boolean;
  transactionHash?: string;
  amount?: string;
  recipient?: string;
}

const Faucet = () => {
  const [ address, setAddress ] = React.useState('');
  const [ amount, setAmount ] = React.useState('100');
  const [ requesting, setRequesting ] = React.useState(false);
  const [ result, setResult ] = React.useState<FaucetResult | null>(null);
  const [ error, setError ] = React.useState<string | null>(null);
  const [ status, setStatus ] = React.useState<FaucetStatus | null>(null);
  const [ statusLoading, setStatusLoading ] = React.useState(true);

  const handleAddressChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  }, []);

  const handleAmountChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  }, []);

  React.useEffect(() => {
    fetch(`${ FAUCET_API }/status`)
      .then((res) => res.json() as Promise<FaucetStatus>)
      .then((data) => setStatus(data))
      .catch(() => setStatus(null))
      .finally(() => setStatusLoading(false));
  }, []);

  const handleRequest = React.useCallback(async(e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation: 0x + 40 hex chars. The server validates this
    // too, but failing fast saves a network round-trip and a confusing 400.
    if (!ADDRESS_REGEX.test(address)) {
      setError('Invalid address format. Expected 0x followed by 40 hex characters.');
      setResult(null);
      return;
    }

    setRequesting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${ FAUCET_API }/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, amount }),
      });

      const data = await response.json() as FaucetResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${ response.status })`);
      }

      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request tokens');
    } finally {
      setRequesting(false);
    }
  }, [ address, amount ]);

  return (
    <Box>
      <Heading as="h1" fontSize="2xl" mb={ 2 }>{ config.chain.name } testnet faucet</Heading>
      <Text color="text.secondary" mb={ 6 }>
        Get free { config.chain.currency.symbol } tokens for testing.
      </Text>

      <Flex direction={{ base: 'column', lg: 'row' }} gap={ 6 }>
        <Box flex={ 1 } maxW={{ lg: '560px' }}>
          <Box
            bg="dialog.bg"
            borderWidth="1px"
            borderColor="divider"
            borderRadius="xl"
            p={ 6 }
          >
            <form onSubmit={ handleRequest }>
              <VStack gap={ 4 } alignItems="stretch">
                <Box>
                  <Text fontSize="sm" fontWeight={ 500 } mb={ 1 }>Wallet Address</Text>
                  <Input
                    value={ address }
                    onChange={ handleAddressChange }
                    placeholder="0x..."
                    fontFamily="mono"
                    pattern="^0x[0-9a-fA-F]{40}$"
                    required
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight={ 500 } mb={ 1 }>Amount ({ config.chain.currency.symbol })</Text>
                  <Input
                    type="number"
                    value={ amount }
                    onChange={ handleAmountChange }
                    placeholder="100"
                    fontFamily="mono"
                    min="1"
                    required
                  />
                </Box>
                <Button
                  type="submit"
                  loading={ requesting }
                  loadingText="Requesting..."
                  size="lg"
                  w="100%"
                >
                  Request Tokens
                </Button>
              </VStack>
            </form>

            { error && (
              <Box mt={ 4 } p={ 3 } bg="red.500/10" borderWidth="1px" borderColor="red.500/20" borderRadius="lg">
                <Text color="red.500" fontSize="sm">{ error }</Text>
              </Box>
            ) }

            { result && (
              <Box mt={ 4 } p={ 4 } bg="green.500/10" borderWidth="1px" borderColor="green.500/20" borderRadius="lg" textAlign="center">
                <Text color="green.500" fontWeight={ 700 } fontSize="lg" mb={ 1 }>Tokens sent</Text>
                { result.amount && (
                  <Text fontSize="sm" color="text.secondary" mb={ 2 }>
                    { result.amount } { config.chain.currency.symbol } sent to { result.recipient }
                  </Text>
                ) }
                { result.transactionHash && (
                  <Box bg="bg.base" p={ 2 } borderRadius="md">
                    <Text fontSize="xs" fontFamily="mono" wordBreak="break-all" color="text.secondary">
                      tx:&nbsp;
                      <Link href={ route({ pathname: '/tx/[hash]', query: { hash: result.transactionHash } }) }>
                        { result.transactionHash }
                      </Link>
                    </Text>
                  </Box>
                ) }
              </Box>
            ) }
          </Box>
        </Box>

        <Box w={{ base: '100%', lg: '280px' }}>
          <Box
            bg="dialog.bg"
            borderWidth="1px"
            borderColor="divider"
            borderRadius="xl"
            p={ 6 }
          >
            <Text fontSize="sm" fontWeight={ 600 } mb={ 3 }>Faucet info</Text>
            <VStack gap={ 2 } alignItems="stretch" fontSize="sm">
              <Flex justifyContent="space-between">
                <Text color="text.secondary">Status</Text>
                <Skeleton loading={ statusLoading }>
                  <Text color={ status?.enabled ? 'green.500' : 'red.500' } fontWeight={ 600 }>
                    { status?.enabled ? 'Active' : 'Disabled' }
                  </Text>
                </Skeleton>
              </Flex>
              <Flex justifyContent="space-between">
                <Text color="text.secondary">Max per request</Text>
                <Skeleton loading={ statusLoading }>
                  <Text fontFamily="mono">{ status?.maxAmount ?? '—' } { config.chain.currency.symbol }</Text>
                </Skeleton>
              </Flex>
              <Flex justifyContent="space-between">
                <Text color="text.secondary">Cooldown</Text>
                <Skeleton loading={ statusLoading }>
                  <Text>{ status ? `${ status.cooldownMs / 1000 }s` : '—' }</Text>
                </Skeleton>
              </Flex>
              <Flex justifyContent="space-between">
                <Text color="text.secondary">Network</Text>
                <Text>{ config.chain.isTestnet ? 'Testnet' : 'Mainnet' }</Text>
              </Flex>
            </VStack>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default Faucet;
