// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Flex, Text } from '@chakra-ui/react';
import React from 'react';

import { Link } from 'src/toolkit/chakra/link';

interface Guide { title: string; description: string; focus: string }

export const ADDRESS_TAB_GUIDES: Record<string, Guide> = {
  index: {
    title: 'Your starting point',
    description: 'See what this address holds and explore its recorded activity. You can browse without connecting a wallet.',
    focus: 'Check the full address and network before using these details in a wallet.',
  },
  txs: {
    title: 'Follow a transaction from start to result',
    description: 'Transactions involving this address, including transfers and interactions with contracts.',
    focus: 'Start with status, then check the sender, recipient, amount, and fee.',
  },
  token_transfers: {
    title: 'Track tokens moving in and out',
    description: 'Transfer events for tokens and NFTs involving this address.',
    focus: 'Compare the token contract address as well as its name and symbol.',
  },
  tokens: {
    title: 'Explore the tokens held here',
    description: 'Indexed token balances and NFT holdings for this address.',
    focus: 'Use the token contract address to distinguish assets with similar names.',
  },
  pwroko: {
    title: 'Understand pwROKO activity',
    description: 'Up to 100 recent indexed events for locking, unlocking, and moving pwROKO.',
    focus: 'An event records an action. It does not by itself prove current stake or validator eligibility.',
  },
  substrate_calls: {
    title: 'Follow native chain actions',
    description: 'Up to 100 recent signed native calls, such as staking and session-key registration. These are also called extrinsics.',
    focus: 'Read the pallet and method to identify the action, then open its result.',
  },
  internal_txns: {
    title: 'Look inside contract execution',
    description: 'Internal calls and value movements produced while transactions execute.',
    focus: 'Open the parent transaction to understand the complete action and its outcome.',
  },
  coin_balance_history: {
    title: 'See how the native balance changed',
    description: 'Recorded changes to this address’s native coin balance over time.',
    focus: 'Compare the change and block with the transaction activity around it.',
  },
  contract: {
    title: 'Understand the contract before interacting',
    description: 'Inspect available code, verification information, and contract interfaces.',
    focus: 'Read calls inspect state; write calls can submit transactions and change it.',
  },
  logs: {
    title: 'Read the events a contract emitted',
    description: 'Indexed event logs produced during contract execution.',
    focus: 'Use the transaction link to place each event in context.',
  },
  blocks_validated: {
    title: 'Explore recorded block participation',
    description: 'Blocks attributed to this address by the explorer.',
    focus: 'Open a block to inspect its height, time, and included activity.',
  },
  account_history: {
    title: 'Read an activity summary',
    description: 'A human-readable interpretation of account activity.',
    focus: 'Use the underlying transaction receipt to confirm important details.',
  },
  user_ops: {
    title: 'Explore smart-account requests',
    description: 'User operations submitted through account-abstraction infrastructure.',
    focus: 'Check both the operation result and the transaction that included it.',
  },
  deposits: {
    title: 'Review consensus deposits',
    description: 'Indexed deposits associated with this address.',
    focus: 'Check the destination and deposit record before drawing conclusions about participation.',
  },
  withdrawals: {
    title: 'Review consensus withdrawals',
    description: 'Indexed withdrawals associated with this address.',
    focus: 'Check the recipient, amount, and block for each withdrawal.',
  },
  epoch_rewards: {
    title: 'Review recorded epoch rewards',
    description: 'Reward records associated with this account and their epochs.',
    focus: 'Compare the reward amount, asset, and epoch.',
  },
  widgets: {
    title: 'Explore additional account insights',
    description: 'Supplementary views provided by integrated services.',
    focus: 'Check the source and context of each metric.',
  },
};

const AddressTabGuide = ({ tabId }: { tabId: string }) => {
  const guide = ADDRESS_TAB_GUIDES[tabId];
  if (!guide) {
    return null;
  }
  return (
    <Box mb={ 6 } p={{ base: 4, md: 5 }} borderWidth="1px" borderColor="border.divider" borderRadius="xl"
      bg={{ _light: 'blue.50', _dark: 'whiteAlpha.50' }} borderLeftWidth="3px" borderLeftColor="teal.400">
      <Text as="h2" fontSize="lg" fontWeight="semibold" mb={ 1 }>{ guide.title }</Text>
      <Text color="text.secondary" fontSize="sm" lineHeight="1.7">{ guide.description }</Text>
      <Flex gap={ 2 } mt={ 3 } alignItems="baseline" flexWrap="wrap">
        <Text fontSize="xs" fontWeight="bold" color={{ _light: 'blue.700', _dark: 'blue.200' }}>START HERE</Text>
        <Text fontSize="sm">{ guide.focus }</Text>
      </Flex>
      { (tabId === 'pwroko' || tabId === 'substrate_calls') && (
        <Link href="https://docs.roko.network/pages/prepare-validator.html" display="inline-block" mt={ 3 } fontSize="sm">
          Validator setup and address guide
        </Link>
      ) }
    </Box>
  );
};

export default React.memo(AddressTabGuide);
