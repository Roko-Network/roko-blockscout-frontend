// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Input, Text, chakra } from '@chakra-ui/react';
import React from 'react';

import type { RpcGuide } from './rpc-guidance';

interface Props {
  methods: Array<string>;
  guides: Record<string, RpcGuide>;
  selected: string;
  onSelect: (method: string) => void;
}

const MethodRow = React.memo(function MethodRow({ name, selected, onSelect }: {
  name: string;
  selected: boolean;
  onSelect: Props['onSelect'];
}) {
  const select = React.useCallback(() => onSelect(name), [ name, onSelect ]);
  return (
    <chakra.button
      type="button"
      display="block"
      textAlign="left"
      w="100%"
      p={ 2 }
      fontSize="xs"
      fontFamily="mono"
      overflowWrap="anywhere"
      cursor="pointer"
      borderLeftWidth="3px"
      borderColor={ selected ? 'blue.500' : 'transparent' }
      fontWeight={ selected ? 'bold' : 'normal' }
      color={ selected ? 'blue.500' : 'inherit' }
      aria-pressed={ selected }
      bg={ selected ? 'bg.subtle' : 'transparent' }
      _hover={{ bg: 'bg.subtle' }}
      _focusVisible={{ outline: '2px solid', outlineColor: 'blue.500', outlineOffset: '-2px' }}
      onClick={ select }
    >
      { name }
    </chakra.button>
  );
});

const RpcMethodPicker = React.memo(function RpcMethodPicker({ methods, guides, selected, onSelect }: Props) {
  const [ search, setSearch ] = React.useState('');
  const updateSearch = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value), []);
  const choices = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return (methods.length ? methods : Object.keys(guides)).filter((name) =>
      `${ name } ${ guides[name]?.description ?? '' }`.toLowerCase().includes(query),
    );
  }, [ methods, guides, search ]);
  return (
    <Box>
      <chakra.label htmlFor="rpc-search">Find a method</chakra.label>
      <Input id="rpc-search" value={ search } placeholder="Search by name or description" onChange={ updateSearch } mb={ 3 }/>
      <Box maxH="440px" overflowY="auto" borderWidth="1px" borderRadius="md" p={ 2 } aria-label="RPC methods">
        { choices.map((name) => <MethodRow key={ name } name={ name } selected={ selected === name } onSelect={ onSelect }/>) }
        { !choices.length && <Text p={ 2 }>No matching methods.</Text> }
      </Box>
      <Text fontSize="xs" color="text.secondary" mt={ 2 }>
        Select a method to inspect its inputs. Switching methods does not send a request.
      </Text>
    </Box>
  );
});

export default RpcMethodPicker;
