// SPDX-License-Identifier: LicenseRef-Blockscout

import { chakra, Flex, Text } from '@chakra-ui/react';
import { route } from 'nextjs-routes';
import React from 'react';

import config from 'src/config';
import SpriteIcon from 'src/sprite/SpriteIcon';

import { useColorModeValue } from 'src/toolkit/chakra/color-mode';
import { Image } from 'src/toolkit/chakra/image';

import { INVERT_FILTER } from './consts';

const LogoFallback = () => {
  return (
    <SpriteIcon
      name="networks/logo-placeholder"
      width="24px"
      height="24px"
      color={{ base: 'blue.600', _dark: 'white' }}
      aria-label="Network logo placeholder"
    />
  );
};

type Props = {
  className?: string;
};

const NetworkLogo = ({ className }: Props) => {

  const logoSrc = useColorModeValue(config.chain.logo.default, config.chain.logo.dark || config.chain.logo.default);

  return (
    <chakra.a
      className={ className }
      href={ route({ pathname: '/' }) }
      aria-label="Link to main page"
    >
      <Flex alignItems="center" gap={ 2 }>
        <Image
          h="24px"
          w="24px"
          skeletonWidth="24px"
          src={ logoSrc }
          alt={ `${ config.chain.name } network logo` }
          fallback={ <LogoFallback/> }
          filter={{ _dark: !config.chain.logo.dark ? INVERT_FILTER : undefined }}
          objectFit="contain"
          objectPosition="left"
          flexShrink={ 0 }
        />
        <Text fontSize="lg" fontWeight={ 700 } lineHeight="24px" whiteSpace="nowrap">
          { config.chain.name }
        </Text>
      </Flex>
    </chakra.a>
  );
};

export default React.memo(chakra(NetworkLogo));
