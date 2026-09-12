// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Flex, Text, Input, VStack, HStack } from '@chakra-ui/react';
import React from 'react';
import { formatUnits } from 'viem';

import PwRokoIcon from 'src/features/pwroko/components/PwRokoIcon';

import config from 'src/config';

import { Button } from 'src/toolkit/chakra/button';
import { Heading } from 'src/toolkit/chakra/heading';
import { Skeleton } from 'src/toolkit/chakra/skeleton';

import { ethCall, ethSendTx, EXPECTED_CHAIN_ID_HEX, getProvider, publicRpc, waitForReceipt } from './rpc';

// Function selectors
const SEL = {
  totalSupply: '0x18160ddd',
  balanceOf: '0x70a08231',
  lock: '0xf83d08ba',
  unlockRequest: '0x8a4b732f',
  completeUnlock: '0x648e94a1',
  pendingUnlockAmount: '0xb52c8714',
  readyUnlockAmount: '0x719f25e8',
  stakedBalanceOf: '0x821f56a5',
} as const;

function padAddress(addr: string): string {
  return addr.slice(2).toLowerCase().padStart(64, '0');
}

function padUint256(val: bigint): string {
  return val.toString(16).padStart(64, '0');
}

function padUint32(val: number): string {
  return val.toString(16).padStart(64, '0');
}

function hexToBigInt(hex: string): bigint {
  if (!hex || hex === '0x') return BigInt(0);
  return BigInt(hex);
}

// Format wei → human-readable, using viem's exact-precision conversion and
// trimming to a sensible display width. The previous hand-rolled version
// silently truncated all sub-1-ROKO amounts to four decimals, so 0.00001 ROKO
// rendered identically to 0 (see audit / TICKET-08). This version preserves
// up to 6 fractional digits, trims trailing zeros, and falls back to "<0.000001"
// for nonzero amounts smaller than that to make non-zero-ness visible.
const DISPLAY_DECIMALS = 6;
function formatWei(wei: bigint): string {
  const full = formatUnits(wei, 18);
  const [ intPart, fracPart = '' ] = full.split('.');
  if (fracPart.length === 0) return intPart;
  const truncated = fracPart.slice(0, DISPLAY_DECIMALS).replace(/0+$/, '');
  if (truncated.length === 0) {
    // Sub-display-precision but non-zero → make it visible.
    if (wei !== BigInt(0) && fracPart.length > 0) {
      return `<0.${ '0'.repeat(DISPLAY_DECIMALS - 1) }1`;
    }
    return intPart;
  }
  return `${ intPart }.${ truncated }`;
}

function parseWei(amount: string): bigint {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(amount) || Number(amount) <= 0) {
    throw new Error('Enter a positive amount with no more than 18 decimal places.');
  }
  const parts = amount.split('.');
  const whole = parts[0] || '0';
  const frac = (parts[1] || '').padEnd(18, '0').slice(0, 18);
  return BigInt(whole) * BigInt(10) ** BigInt(18) + BigInt(frac);
}

type TokenInfo = {
  totalSupply: string;
};

type AccountInfo = {
  nativeBalance: string;
  pwrokoBalance: string;
  stakedBalance: string;
  pendingUnlock: string;
  readyUnlock: string;
};

const PwRoko = () => {
  const [ account, setAccount ] = React.useState<string | null>(null);
  const [ chainId, setChainId ] = React.useState<string | null>(null);
  const [ tokenInfo, setTokenInfo ] = React.useState<TokenInfo | null>(null);
  const [ accountInfo, setAccountInfo ] = React.useState<AccountInfo | null>(null);
  const [ loading, setLoading ] = React.useState(false);
  const [ tokenError, setTokenError ] = React.useState<string | null>(null);
  const [ loadError, setLoadError ] = React.useState<string | null>(null);
  const [ txPending, setTxPending ] = React.useState(false);
  const [ txHash, setTxHash ] = React.useState<string | null>(null);
  const [ txError, setTxError ] = React.useState<string | null>(null);
  const [ lockAmount, setLockAmount ] = React.useState('');
  const [ unlockAmount, setUnlockAmount ] = React.useState('');

  const wrongChain = chainId !== EXPECTED_CHAIN_ID_HEX;

  const refreshChainId = React.useCallback(async() => {
    const provider = getProvider();
    if (!provider) return;
    try {
      const id = await provider.request({ method: 'eth_chainId' }) as string;
      setChainId(id.toLowerCase());
    } catch {
      setChainId(null);
    }
  }, []);

  const connectWallet = React.useCallback(async() => {
    try {
      const provider = getProvider();
      if (!provider) {
        setTxError('MetaMask not detected. Please install MetaMask.');
        return;
      }
      const accounts = await provider.request({ method: 'eth_requestAccounts' }) as Array<string>;
      if (accounts[0]) {
        setAccount(accounts[0]);
      }
      await refreshChainId();

    } catch {
      setTxError('Failed to connect wallet.');
    }
  }, [ refreshChainId ]);

  React.useEffect(() => {
    const provider = getProvider();
    const onChain = (id: string) => setChainId(id.toLowerCase());
    const onAccounts = (addresses: Array<string>) => {
      setAccountInfo(null);
      setAccount(addresses[0] ?? null);
    };
    provider?.on?.('chainChanged', onChain);
    provider?.on?.('accountsChanged', onAccounts);
    return () => {
      provider?.removeListener?.('chainChanged', onChain);
      provider?.removeListener?.('accountsChanged', onAccounts);
    };
  }, []);

  const switchToExpectedChain = React.useCallback(async() => {
    const provider = getProvider();
    if (!provider) return;
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [ { chainId: EXPECTED_CHAIN_ID_HEX } ],
      });
      await refreshChainId();
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message : 'Failed to switch network');
    }
  }, [ refreshChainId ]);

  const loadTokenInfo = React.useCallback(async() => {
    try {
      const chain = await publicRpc<string>('eth_chainId');
      if (chain.toLowerCase() !== EXPECTED_CHAIN_ID_HEX) throw new Error('Explorer RPC network does not match this explorer.');
      const supply = hexToBigInt(await ethCall(SEL.totalSupply));
      setTokenInfo({ totalSupply: formatWei(supply) });
      setTokenError(null);
    } catch (err: unknown) {
      setTokenInfo(null);
      setTokenError(err instanceof Error ? `Failed to load token info: ${ err.message }` : 'Failed to load token info');
    }
  }, []);

  const loadAccountInfo = React.useCallback(async() => {
    if (!account) return;
    setLoading(true);
    try {
      const addr = padAddress(account);
      const [ nativeBal, balance, staked, pending, ready ] = await Promise.all([
        publicRpc<string>('eth_getBalance', [ account, 'latest' ]),
        ethCall(SEL.balanceOf + addr),
        ethCall(SEL.stakedBalanceOf + addr),
        ethCall(SEL.pendingUnlockAmount + addr),
        ethCall(SEL.readyUnlockAmount + addr),
      ]);
      setAccountInfo({
        nativeBalance: formatWei(hexToBigInt(nativeBal)),
        pwrokoBalance: formatWei(hexToBigInt(balance)),
        stakedBalance: formatWei(hexToBigInt(staked)),
        pendingUnlock: formatWei(hexToBigInt(pending)),
        readyUnlock: formatWei(hexToBigInt(ready)),
      });
      setLoadError(null);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? `Failed to load account info: ${ err.message }` : 'Failed to load account info');
    } finally {
      setLoading(false);
    }
  }, [ account ]);

  React.useEffect(() => {
    loadTokenInfo();
  }, [ loadTokenInfo ]);
  React.useEffect(() => {
    loadAccountInfo();
  }, [ loadAccountInfo ]);

  const sendTx = React.useCallback(async(data: string) => {
    if (!account) return;

    // Pre-flight: never broadcast onto the wrong chain. Without this guard
    // a user on Ethereum mainnet (or any other connected network) would have
    // submitted a transaction to the wrong network with real consequences.
    if (wrongChain) {
      setTxError(`Wallet is on chain ${ chainId }, expected ${ EXPECTED_CHAIN_ID_HEX } (${ config.chain.name }). Switch network and retry.`);
      return;
    }

    setTxPending(true);
    setTxHash(null);
    setTxError(null);
    try {
      const hash = await ethSendTx(account, data);
      setTxHash(hash);
      await waitForReceipt(hash);
      loadAccountInfo();
      loadTokenInfo();
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setTxPending(false);
    }
  }, [ account, chainId, wrongChain, loadAccountInfo, loadTokenInfo ]);

  const handleLockAmountChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLockAmount(e.target.value);
  }, []);

  const handleUnlockAmountChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUnlockAmount(e.target.value);
  }, []);

  const handleLock = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!lockAmount) return;
    try {
      sendTx(SEL.lock + padUint256(parseWei(lockAmount)));
    } catch (err) {
      setTxError((err as Error).message);
    }
  }, [ lockAmount, sendTx ]);

  const handleUnlockRequest = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockAmount) return;
    try {
      sendTx(SEL.unlockRequest + padUint256(parseWei(unlockAmount)));
    } catch (err) {
      setTxError((err as Error).message);
    }
  }, [ unlockAmount, sendTx ]);

  const COMPLETE_UNLOCK_BATCHES = 32;
  const handleCompleteUnlock = React.useCallback(() => {
    sendTx(SEL.completeUnlock + padUint32(COMPLETE_UNLOCK_BATCHES));
  }, [ sendTx ]);

  const hasReadyUnlocks = accountInfo && parseFloat(accountInfo.readyUnlock) > 0;
  const hasPendingUnlocks = accountInfo && parseFloat(accountInfo.pendingUnlock) > 0;

  return (
    <Box>
      <Flex alignItems="center" gap={ 3 } mb={ 2 }>
        <PwRokoIcon boxSize={ 10 } flexShrink={ 0 }/>
        <Heading as="h1" fontSize="2xl">pwROKO Token</Heading>
      </Flex>
      <Text color="text.secondary" mb={ 6 }>
        Wrap native { config.chain.currency.symbol } into pwROKO for validator bonding. Unwrap with a two-phase cooldown process.
      </Text>

      { account && wrongChain && (
        <Box mb={ 4 } p={ 4 } bg="orange.500/10" borderWidth="1px" borderColor="orange.500/30" borderRadius="lg">
          <Flex direction={{ base: 'column', sm: 'row' }} gap={ 3 } alignItems={{ sm: 'center' }} justifyContent="space-between">
            <Box>
              <Text color="orange.500" fontWeight={ 600 } fontSize="sm" mb={ 1 }>Wrong network</Text>
              <Text fontSize="xs" color="text.secondary">
                Connected to { chainId }; pwROKO lives on { config.chain.name } ({ EXPECTED_CHAIN_ID_HEX }). All actions are disabled until you switch.
              </Text>
            </Box>
            <Button onClick={ switchToExpectedChain } size="sm">Switch to { config.chain.name }</Button>
          </Flex>
        </Box>
      ) }

      { (tokenError || loadError) && (
        <Box mb={ 4 } p={ 3 } bg="red.500/10" borderWidth="1px" borderColor="red.500/20" borderRadius="lg">
          <Text color="red.500" fontSize="sm">{ tokenError || loadError }</Text>
        </Box>
      ) }

      { txError && (
        <Box p={ 3 } bg="red.500/10" borderWidth="1px" borderColor="red.500/20" borderRadius="lg">
          <Text color="red.500" fontSize="sm">{ txError }</Text>
        </Box>
      ) }

      { tokenInfo && (
        <Text mb={ 4 } color="text.secondary">Total supply: { tokenInfo.totalSupply } pwROKO · Precompile: 0x…0500</Text>
      ) }

      { !account ? (
        <Box bg="dialog.bg" borderWidth="1px" borderColor="divider" borderRadius="xl" p={ 8 } maxW="480px" textAlign="center">
          <Text mb={ 4 } color="text.secondary">Connect your wallet to manage pwROKO tokens</Text>
          <Button onClick={ connectWallet } size="lg">Connect MetaMask</Button>
        </Box>
      ) : (
        <Flex direction={{ base: 'column', lg: 'row' }} gap={ 6 }>
          <Box flex={ 1 } maxW={{ lg: '560px' }}>
            <VStack gap={ 4 } alignItems="stretch">
              <Box bg="dialog.bg" borderWidth="1px" borderColor="divider" borderRadius="xl" p={ 4 }>
                <Text fontSize="xs" color="text.secondary" mb={ 1 }>Connected Wallet</Text>
                <Text fontFamily="mono" fontSize="sm" wordBreak="break-all">{ account }</Text>
              </Box>

              { /* Lock */ }
              <Box bg="dialog.bg" borderWidth="1px" borderColor="divider" borderRadius="xl" p={ 6 }>
                <Heading as="h3" fontSize="md" mb={ 4 }>Lock { config.chain.currency.symbol } &rarr; pwROKO</Heading>
                <form onSubmit={ handleLock }>
                  <VStack gap={ 3 } alignItems="stretch">
                    <Box>
                      <Text fontSize="sm" fontWeight={ 500 } mb={ 1 }>Amount ({ config.chain.currency.symbol })</Text>
                      <Input type="number" value={ lockAmount } onChange={ handleLockAmountChange }
                        placeholder="0.0" fontFamily="mono" step="0.001" min="0" required/>
                    </Box>
                    <Button type="submit" loading={ txPending } loadingText="Locking..." w="100%" disabled={ wrongChain }>
                      Lock { config.chain.currency.symbol }
                    </Button>
                  </VStack>
                </form>
              </Box>

              { /* Unlock */ }
              <Box bg="dialog.bg" borderWidth="1px" borderColor="divider" borderRadius="xl" p={ 6 }>
                <Heading as="h3" fontSize="md" mb={ 1 }>Unlock pwROKO &rarr; { config.chain.currency.symbol }</Heading>
                <Text fontSize="xs" color="text.secondary" mb={ 4 }>
                  Two-phase process: request unlock (starts cooldown), then complete after cooldown.
                </Text>
                <form onSubmit={ handleUnlockRequest }>
                  <VStack gap={ 3 } alignItems="stretch">
                    <Box>
                      <Text fontSize="sm" fontWeight={ 500 } mb={ 1 }>Amount (pwROKO)</Text>
                      <Input type="number" value={ unlockAmount } onChange={ handleUnlockAmountChange }
                        placeholder="0.0" fontFamily="mono" step="0.001" min="0" required/>
                    </Box>
                    <Button type="submit" loading={ txPending } loadingText="Requesting..." variant="outline" w="100%" disabled={ wrongChain }>
                      Request Unlock
                    </Button>
                  </VStack>
                </form>

                { (hasPendingUnlocks || hasReadyUnlocks) && (
                  <Box mt={ 4 } p={ 3 } bg="bg.base" borderRadius="lg">
                    <Text fontSize="sm" fontWeight={ 600 } mb={ 2 }>Unlock Status</Text>
                    { hasPendingUnlocks && (
                      <HStack fontSize="sm" mb={ 1 }>
                        <Text color="orange.500">Pending:</Text>
                        <Text fontFamily="mono">{ accountInfo?.pendingUnlock } pwROKO</Text>
                        <Text color="text.secondary">(waiting)</Text>
                      </HStack>
                    ) }
                    { hasReadyUnlocks && (
                      <HStack fontSize="sm">
                        <Text color="green.500">Ready:</Text>
                        <Text fontFamily="mono">{ accountInfo?.readyUnlock } pwROKO</Text>
                      </HStack>
                    ) }
                  </Box>
                ) }

                { hasReadyUnlocks && (
                  <Box mt={ 4 }>
                    <Button onClick={ handleCompleteUnlock } loading={ txPending } loadingText="Completing..."
                      w="100%" colorPalette="green" disabled={ wrongChain }>
                      Complete Unlock &rarr; Get { config.chain.currency.symbol }
                    </Button>
                  </Box>
                ) }
              </Box>

              { txHash && (
                <Box p={ 3 } bg="green.500/10" borderWidth="1px" borderColor="green.500/20" borderRadius="lg">
                  <Text color="green.500" fontSize="sm" fontWeight={ 600 } mb={ 1 }>Transaction submitted</Text>
                  <Text fontSize="xs" fontFamily="mono" color="text.secondary" wordBreak="break-all">{ txHash }</Text>
                </Box>
              ) }
            </VStack>
          </Box>

          <Box w={{ base: '100%', lg: '300px' }}>
            <VStack gap={ 4 } alignItems="stretch">
              <Box bg="dialog.bg" borderWidth="1px" borderColor="divider" borderRadius="xl" p={ 6 }>
                <Text fontSize="sm" fontWeight={ 600 } mb={ 3 }>Your Balances</Text>
                <VStack gap={ 2 } alignItems="stretch" fontSize="sm">
                  <Flex justifyContent="space-between">
                    <Text color="text.secondary">{ config.chain.currency.symbol } (native)</Text>
                    <Skeleton loading={ loading }>
                      <Text fontFamily="mono" fontWeight={ 600 }>{ accountInfo?.nativeBalance ?? '---' }</Text>
                    </Skeleton>
                  </Flex>
                  <Box borderBottomWidth="1px" borderColor="divider"/>
                  <Flex justifyContent="space-between">
                    <Text color="text.secondary">pwROKO</Text>
                    <Skeleton loading={ loading }>
                      <Text fontFamily="mono" fontWeight={ 600 }>{ accountInfo?.pwrokoBalance ?? '---' }</Text>
                    </Skeleton>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text color="text.secondary">Staked (locked)</Text>
                    <Skeleton loading={ loading }>
                      <Text fontFamily="mono">{ accountInfo?.stakedBalance ?? '---' }</Text>
                    </Skeleton>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text color="text.secondary">Pending unlock</Text>
                    <Skeleton loading={ loading }>
                      <Text fontFamily="mono" color={ hasPendingUnlocks ? 'orange.500' : undefined }>
                        { accountInfo?.pendingUnlock ?? '---' }
                      </Text>
                    </Skeleton>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text color="text.secondary">Ready to claim</Text>
                    <Skeleton loading={ loading }>
                      <Text fontFamily="mono" color={ hasReadyUnlocks ? 'green.500' : undefined }>
                        { accountInfo?.readyUnlock ?? '---' }
                      </Text>
                    </Skeleton>
                  </Flex>
                </VStack>
                <Button mt={ 3 } variant="outline" size="sm" w="100%" onClick={ loadAccountInfo }>Refresh</Button>
              </Box>

              <Box bg="dialog.bg" borderWidth="1px" borderColor="divider" borderRadius="xl" p={ 6 }>
                <Flex alignItems="center" gap={ 2 } mb={ 3 }>
                  <PwRokoIcon boxSize={ 6 } flexShrink={ 0 }/>
                  <Text fontSize="sm" fontWeight={ 600 }>Token Info</Text>
                </Flex>
                <VStack gap={ 2 } alignItems="stretch" fontSize="sm">
                  <Flex justifyContent="space-between">
                    <Text color="text.secondary">Name</Text>
                    <Text>Wrapped { config.chain.currency.symbol }</Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text color="text.secondary">Symbol</Text>
                    <Text fontWeight={ 600 }>pwROKO</Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text color="text.secondary">Decimals</Text>
                    <Text>18</Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text color="text.secondary">Total supply</Text>
                    <Text fontFamily="mono">{ tokenInfo?.totalSupply ?? '---' }</Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text color="text.secondary">Precompile</Text>
                    <Text fontFamily="mono" fontSize="xs">0x...0500</Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text color="text.secondary">Transfers</Text>
                    <Text color="orange.500">Disabled</Text>
                  </Flex>
                </VStack>
              </Box>

              <Box bg="dialog.bg" borderWidth="1px" borderColor="divider" borderRadius="xl" p={ 6 }>
                <Text fontSize="sm" fontWeight={ 600 } mb={ 3 }>How it works</Text>
                <VStack gap={ 2 } alignItems="stretch" fontSize="xs" color="text.secondary">
                  <Text>1. <b>Lock</b> native { config.chain.currency.symbol } to mint pwROKO (1:1)</Text>
                  <Text>2. pwROKO is used for <b>validator bonding</b></Text>
                  <Text>3. <b>Request unlock</b> starts a cooldown period</Text>
                  <Text>4. After cooldown, <b>complete unlock</b> to get { config.chain.currency.symbol } back</Text>
                  <Text>Note: pwROKO transfers are disabled by design.</Text>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </Flex>
      ) }
    </Box>
  );
};

export default PwRoko;
