import { Flex, chakra } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';

import { route } from 'nextjs-routes';

import { Link } from 'toolkit/chakra/link';

type DeveloperPath =
  | '/developer' |
  '/developer/chain-state' |
  '/developer/constants' |
  '/developer/rpc' |
  '/developer/metadata';

interface SubNavItem {
  href: DeveloperPath;
  label: string;
}

const ITEMS: Array<SubNavItem> = [
  { href: '/developer', label: 'Console' },
  { href: '/developer/chain-state', label: 'Chain State' },
  { href: '/developer/constants', label: 'Constants' },
  { href: '/developer/rpc', label: 'RPC Calls' },
  { href: '/developer/metadata', label: 'Metadata' },
];

/**
 * Sub-navigation shown at the top of every /developer/* page so users can
 * jump between Chain State / Constants / RPC / Metadata without going back
 * to the landing page each time.
 */
const DeveloperSubNav = () => {
  const router = useRouter();

  return (
    <Flex
      mb={ 6 }
      gap={ 1 }
      borderBottomWidth="1px"
      borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.300' }}
      overflowX="auto"
    >
      { ITEMS.map((item) => {
        const isActive = router.pathname === item.href;
        return (
          <Link key={ item.href } href={ route({ pathname: item.href }) } _hover={{ textDecoration: 'none' }}>
            <chakra.span
              px={ 4 }
              py={ 2 }
              fontSize="sm"
              fontWeight={ isActive ? 700 : 500 }
              color={ isActive ? undefined : 'text.secondary' }
              borderBottomWidth="2px"
              borderColor={ isActive ? 'blue.500' : 'transparent' }
              display="inline-block"
              whiteSpace="nowrap"
            >
              { item.label }
            </chakra.span>
          </Link>
        );
      }) }
    </Flex>
  );
};

export default DeveloperSubNav;
