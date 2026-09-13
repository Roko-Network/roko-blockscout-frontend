// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Flex, Text } from '@chakra-ui/react';
import React from 'react';

import { Link } from 'src/toolkit/chakra/link';

interface Guide { title: string; description: string; focus: string; help: string }

export const ADDRESS_TAB_GUIDES: Record<string, Guide> = {
  index: {
    title: 'Your starting point',
    description: 'See what this address holds and explore its recorded activity. You can browse without connecting a wallet.',
    focus: 'Check the full address and network before using these details in a wallet.',
    help: 'The native balance and token holdings are separate. A balance is an explorer observation, not a guarantee that ' +
      'every amount is transferable. The last balance update identifies the recorded block, not the current chain height.',
  },
  txs: {
    title: 'Follow a transaction from start to result',
    description: 'Transactions involving this address, including transfers and interactions with contracts.',
    focus: 'Start with status, then check the sender, recipient, amount, and fee.',
    help: 'Open a transaction hash for its receipt. Pending means a result is not yet confirmed here; failed means execution ' +
      'did not complete successfully and a fee may still have been charged. Native chain calls appear separately in Native ' +
      'calls when indexed.',
  },
  token_transfers: {
    title: 'Track tokens moving in and out',
    description: 'Transfer events for tokens and NFTs involving this address.',
    focus: 'Compare the token contract address as well as its name and symbol.',
    help: 'One transaction can produce several transfer events. A transfer event is not the same as a current holding; use ' +
      'Tokens for the latest indexed balances. Unsolicited tokens can appear without any action from this account.',
  },
  tokens: {
    title: 'Explore the tokens held here',
    description: 'Indexed token balances and NFT holdings for this address.',
    focus: 'Use the token contract address to distinguish assets with similar names.',
    help: 'Native ROKO is shown in the address balance separately. Tokens can have different decimal places, and market prices ' +
      'may be unavailable. An empty result means no holdings were returned for the selected view; it is not proof that the ' +
      'account has no assets.',
  },
  pwroko: {
    title: 'Understand pwROKO activity',
    description: 'Recent indexed events for locking, unlocking, and moving pwROKO.',
    focus: 'An event records an action. It does not by itself prove current stake or validator eligibility.',
    help: 'Amount is the pwROKO quantity recorded by the event; backing is its recorded native ROKO quantity. A blank ' +
      'counterparty means no other account was recorded. Unlock requests and completed unlocks are different stages. This ' +
      'view shows up to 100 recent events, not a lifetime total.',
  },
  substrate_calls: {
    title: 'Follow native chain actions',
    description: 'Recent signed native calls, such as staking and session-key registration. These are also called extrinsics.',
    focus: 'Read the pallet and method to identify the action, then open its result.',
    help: 'A pallet is a runtime module, such as staking; the method is its action. These records are separate from EVM ' +
      'transactions. This view shows up to 100 recent indexed calls. Registration does not by itself prove election or ' +
      'block production.',
  },
  internal_txns: {
    title: 'Look inside contract execution',
    description: 'Internal calls and value movements produced while transactions execute.',
    focus: 'Open the parent transaction to understand the complete action and its outcome.',
    help: 'An internal call is not a separately signed transaction and does not mean someone accessed a private wallet. ' +
      'Several internal records can belong to one transaction. An empty list means no matching indexed internal activity ' +
      'was returned.',
  },
  coin_balance_history: {
    title: 'See how the native balance changed',
    description: 'Recorded changes to this address’s native coin balance over time.',
    focus: 'Compare the change and block with the transaction activity around it.',
    help: 'Fees and multiple actions can contribute to a balance change. This history is not a token portfolio chart, and gaps ' +
      'between recorded changes do not necessarily indicate missing funds.',
  },
  contract: {
    title: 'Understand the contract before interacting',
    description: 'Inspect available code, verification information, and contract interfaces.',
    focus: 'Read calls inspect state; write calls can submit transactions and change it.',
    help: 'Verified source helps connect published code to deployed bytecode. It is not a security audit or endorsement. For ' +
      'proxies, check the implementation too. Review the method, parameters, network, and wallet confirmation before any ' +
      'write.',
  },
  logs: {
    title: 'Read the events a contract emitted',
    description: 'Indexed event logs produced during contract execution.',
    focus: 'Use the transaction link to place each event in context.',
    help: 'Topics identify events and indexed fields; data contains the remaining encoded values. Several events may come from ' +
      'one transaction. An event label alone does not establish the safety or meaning of the whole transaction.',
  },
  blocks_validated: {
    title: 'Explore recorded block participation',
    description: 'Blocks attributed to this address by the explorer.',
    focus: 'Open a block to inspect its height, time, and included activity.',
    help: 'Historical block participation does not prove current validator membership, uptime, or rewards. Check the current ' +
      'validator view for present participation.',
  },
  account_history: {
    title: 'Read an activity summary',
    description: 'A human-readable interpretation of account activity.',
    focus: 'Use the underlying transaction receipt to confirm important details.',
    help: 'Interpretations may be incomplete or provided by another service. The transaction and its recorded result remain ' +
      'the reference for the action.',
  },
  user_ops: {
    title: 'Explore smart-account requests',
    description: 'User operations submitted through account-abstraction infrastructure.',
    focus: 'Check both the operation result and the transaction that included it.',
    help: 'Several operations can share a transaction. Operation and transaction hashes identify different records.',
  },
  deposits: {
    title: 'Review consensus deposits',
    description: 'Indexed deposits associated with this address.',
    focus: 'Check the destination and deposit record before drawing conclusions about participation.',
    help: 'A deposit record is distinct from a current validator balance or active status.',
  },
  withdrawals: {
    title: 'Review consensus withdrawals',
    description: 'Indexed withdrawals associated with this address.',
    focus: 'Check the recipient, amount, and block for each withdrawal.',
    help: 'These records are distinct from ordinary token transfers and from initiating a staking exit.',
  },
  epoch_rewards: {
    title: 'Review recorded epoch rewards',
    description: 'Reward records associated with this account and their epochs.',
    focus: 'Compare the reward amount, asset, and epoch.',
    help: 'Historical reward records do not predict future rewards or guarantee that a displayed amount is immediately spendable.',
  },
  widgets: {
    title: 'Explore additional account insights',
    description: 'Supplementary views provided by integrated services.',
    focus: 'Check the source and context of each metric.',
    help: 'Third-party data can update at a different pace from the explorer. Compare important claims with the underlying chain records.',
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
      <Box as="details" mt={ 3 } fontSize="sm">
        <Box as="summary" cursor="pointer" width="fit-content" color="link.primary" borderRadius="sm"
          _focusVisible={{ outline: '2px solid', outlineColor: 'blue.400', outlineOffset: '4px' }}>
          How to read this view
        </Box>
        <Text mt={ 3 } color="text.secondary" lineHeight="1.7" maxW="90ch">{ guide.help }</Text>
      </Box>
      { (tabId === 'pwroko' || tabId === 'substrate_calls') && (
        <Link href="https://docs.roko.network/pages/prepare-validator.html" display="inline-block" mt={ 3 } fontSize="sm">
          Validator setup and address guide
        </Link>
      ) }
    </Box>
  );
};

export default React.memo(AddressTabGuide);
