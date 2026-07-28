import { chakra, Flex, Text } from '@chakra-ui/react';
import React from 'react';

import { route } from 'nextjs-routes';

import { Image } from 'toolkit/chakra/image';

const ROKO_LOGO_SRC = '/roko-logo.png';

const LogoFallback = () => {
  return (
    <Flex
      w="36px"
      h="36px"
      alignItems="center"
      justifyContent="center"
      border="2px solid"
      borderColor="border"
      borderRadius="full"
      aria-label="Network logo placeholder"
    >
      <Text fontFamily="heading" fontWeight={ 700 }>R</Text>
    </Flex>
  );
};

type Props = {
  className?: string;
};

const NetworkLogo = ({ className }: Props) => {
  return (
    <chakra.a
      className={ className }
      href={ route({ pathname: '/' }) }
      aria-label="Link to main page"
    >
      <Flex alignItems="center" gap={ 2 }>
        <Image
          h="36px"
          w="36px"
          skeletonWidth="36px"
          src={ ROKO_LOGO_SRC }
          alt="Roko Network logo"
          fallback={ <LogoFallback/> }
          objectFit="contain"
          objectPosition="center"
          flexShrink={ 0 }
        />
        <Text
          fontSize="md"
          fontWeight={ 500 }
          lineHeight="24px"
          letterSpacing="0.08em"
          textTransform="uppercase"
          whiteSpace="nowrap"
        >
          Roko Network
        </Text>
      </Flex>
    </chakra.a>
  );
};

export default React.memo(chakra(NetworkLogo));
