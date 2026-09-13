// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import React from 'react';

import PwRokoIcon from 'src/features/pwroko/components/PwRokoIcon';

import { Button } from 'src/toolkit/chakra/button';
import { Heading } from 'src/toolkit/chakra/heading';
import { Link } from 'src/toolkit/chakra/link';
import { Skeleton } from 'src/toolkit/chakra/skeleton';

import { PWROKO } from './rpc';

function readableSupply(value: string) {
  const [ whole, fraction ] = value.split('.');
  return { whole: whole.replace(/\B(?=(?:\d{3})+(?!\d))/g, ','), fraction };
}

export const PwRokoWelcome = ({ onConnect }: { onConnect: () => void }) => (
  <Grid templateColumns={{ base: '1fr', lg: '1.1fr 1fr' }} gap={{ base: 6, lg: 12 }}
    borderWidth="1px" borderColor="divider" borderRadius="2xl" bg="dialog.bg" p={{ base: 6, md: 8 }}>
    <Flex direction="column" alignItems="flex-start" justifyContent="center">
      <Text fontSize="xs" fontWeight={ 600 } color="text.secondary" mb={ 3 }>YOUR WALLET</Text>
      <Heading as="h2" fontSize="xl" mb={ 3 }>Ready to wrap your ROKO?</Heading>
      <Text color="text.secondary" fontSize="sm" lineHeight="tall" maxW="360px" mb={ 6 }>
        Connect your wallet to see your balances, wrap ROKO, and manage your unlock requests.
      </Text>
      <Button onClick={ onConnect } size="lg" borderRadius="lg" w={{ base: '100%', sm: 'auto' }}>Connect MetaMask</Button>
      <Text fontSize="xs" color="text.secondary" mt={ 3 }>Connecting your wallet does not submit a transaction.</Text>
    </Flex>
    <Box borderLeftWidth={{ base: '0', lg: '1px' }} borderTopWidth={{ base: '1px', lg: '0' }} borderColor="divider"
      pl={{ base: 0, lg: 8 }} pt={{ base: 6, lg: 0 }}>
      <Text fontSize="sm" fontWeight={ 600 } mb={ 5 }>From ROKO to validator bonding</Text>
      <Flex direction="column" gap={ 5 }>
        { [
          { title: 'Wrap ROKO', description: 'Lock native ROKO to receive pwROKO at a 1:1 ratio.' },
          { title: 'Bond with pwROKO', description: 'Use your wrapped tokens for validator bonding.' },
          { title: 'Unwrap when ready', description: 'Request an unlock, wait for the cooldown, then claim your ROKO.' },
        ].map((step, index) => (
          <Flex key={ step.title } gap={ 3 }>
            <Flex boxSize={ 7 } flexShrink={ 0 } alignItems="center" justifyContent="center" borderRadius="full"
              bg="blue.500/10" color="link.primary" fontSize="xs" fontWeight={ 600 } aria-hidden="true">{ index + 1 }</Flex>
            <Box>
              <Text fontWeight={ 600 } fontSize="sm" mb={ 1 }>{ step.title }</Text>
              <Text color="text.secondary" fontSize="xs" lineHeight="tall">{ step.description }</Text>
            </Box>
          </Flex>
        )) }
      </Flex>
    </Box>
  </Grid>
);

const PwRokoOverview = ({ supply, hasError }: { supply?: string; hasError: boolean }) => {
  const formatted = supply ? readableSupply(supply) : undefined;

  return (
    <Box mb={ 6 }>
      <Flex gap={ 4 } alignItems="center" mb={ 6 }>
        <PwRokoIcon boxSize={{ base: 12, md: 16 }} flexShrink={ 0 }/>
        <Box>
          <Flex gap={ 3 } alignItems="center" flexWrap="wrap" mb={ 1 }>
            <Heading as="h1" fontSize={{ base: '2xl', md: '3xl' }}>pwROKO Token</Heading>
            <Text fontSize="xs" fontWeight={ 500 } color="link.primary" bg="blue.500/10" px={ 2 } py={ 1 }
              borderRadius="full">Validator bonding</Text>
          </Flex>
          <Text color="text.secondary" fontSize="sm" lineHeight="tall">Wrap native ROKO. Bond with pwROKO. Unwrap after cooldown.</Text>
        </Box>
      </Flex>

      <Box borderWidth="1px" borderColor="divider" borderRadius="2xl" overflow="hidden" bg="dialog.bg">
        <Box px={{ base: 5, md: 8 }} py={{ base: 6, md: 8 }} bgGradient="to-r" gradientFrom="blue.500/10" gradientTo="transparent">
          <Text fontSize="sm" color="text.secondary" mb={ 3 }>Total supply</Text>
          <Box aria-label="Total supply">
            <Skeleton loading={ !supply && !hasError } minH="48px" w={ !supply && !hasError ? '70%' : 'auto' }>
              <Flex alignItems="baseline" gap={ 2 } flexWrap="wrap">
                <Text fontSize={{ base: '2xl', md: '4xl' }} fontWeight={ 600 } letterSpacing="tight" lineHeight="short"
                  css={{ fontVariantNumeric: 'tabular-nums' }} overflowWrap="anywhere">
                  { formatted?.whole ?? (hasError ? 'Unavailable' : '—') }
                  { formatted?.fraction && <Text as="span" fontSize={{ base: 'md', md: 'xl' }} color="text.secondary">.{ formatted.fraction }</Text> }
                </Text>
                { supply && <Text fontSize="sm" fontWeight={ 500 } color="text.secondary">pwROKO</Text> }
              </Flex>
            </Skeleton>
          </Box>
        </Box>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} borderTopWidth="1px" borderColor="divider">
          { [ { label: 'Wrap ratio', value: '1 ROKO = 1 pwROKO' }, { label: 'Transfers', value: 'Non-transferable' } ].map(item => (
            <Box key={ item.label } px={{ base: 5, md: 8 }} py={ 4 } borderBottomWidth={{ base: '1px', md: '0' }}
              borderRightWidth={{ base: '0', md: '1px' }} borderColor="divider">
              <Text color="text.secondary" fontSize="xs" mb={ 1 }>{ item.label }</Text>
              <Text fontSize="sm" fontWeight={ 500 }>{ item.value }</Text>
            </Box>
          )) }
          <Box px={{ base: 5, md: 8 }} py={ 4 }>
            <Text color="text.secondary" fontSize="xs" mb={ 1 }>Token contract</Text>
            <Link href={ `/address/${ PWROKO }` } color="link.primary" fontSize="sm" fontFamily="mono"
              aria-label={ `View pwROKO token contract ${ PWROKO }` } title={ PWROKO }>0x0000…0500 <span aria-hidden="true">↗</span></Link>
          </Box>
        </Grid>
      </Box>
    </Box>
  );
};

export default PwRokoOverview;
