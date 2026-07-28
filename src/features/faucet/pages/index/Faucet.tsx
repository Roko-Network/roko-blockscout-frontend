// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import React from 'react';

import config from 'src/config';

import { Button } from 'src/toolkit/chakra/button';
import { Heading } from 'src/toolkit/chakra/heading';
import { Link } from 'src/toolkit/chakra/link';

const Faucet = () => {
  return (
    <Box>
      <Heading as="h1" fontSize="2xl" mb={ 2 }>{ config.chain.name } testnet faucet</Heading>
      <Text color="text.secondary" mb={ 6 }>
        Get free { config.chain.currency.symbol } tokens for testing from the official ROKO faucet.
      </Text>

      <Box
        maxW="680px"
        bg="dialog.bg"
        borderWidth="1px"
        borderColor="border.divider"
        borderRadius="xl"
        p={{ base: 5, md: 8 }}
      >
        <VStack gap={ 5 } alignItems="stretch">
          <Box>
            <Heading as="h2" fontSize="lg" mb={ 2 }>Prove wallet ownership, then claim</Heading>
            <Text color="text.secondary">
              The faucet opens as a dedicated, security-isolated service. Connect the destination wallet,
              sign its one-time message, and the faucet will send the current fixed testnet allowance.
              The signature cannot move funds or authorize a transaction.
            </Text>
          </Box>

          <Flex gap={ 3 } flexWrap="wrap">
            <Button asChild size="lg">
              <Link href={ config.misc.faucetUrl } external noIcon variant="plain">
                Open official faucet
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link
                href="https://docs.roko.network/getting-started/metamask-testnet/"
                external
                noIcon
                variant="plain"
              >
                MetaMask setup
              </Link>
            </Button>
          </Flex>

          <Text color="text.secondary" textStyle="sm">
            Requests are rate-limited by wallet and connection. New wallets are supported; the wallet
            signature protects against sending test funds to a mistyped address.
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default Faucet;
