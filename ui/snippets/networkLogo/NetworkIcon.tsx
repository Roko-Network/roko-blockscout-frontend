import { chakra, Flex, Text } from '@chakra-ui/react';
import React from 'react';

import { route } from 'nextjs-routes';

import { Image } from 'toolkit/chakra/image';

const ROKO_ICON_SRC = '/roko-logo.png';

const IconFallback = () => {
  return (
    <Flex
      w="36px"
      h="36px"
      alignItems="center"
      justifyContent="center"
      border="2px solid"
      borderColor="border"
      borderRadius="full"
      aria-label="Network icon placeholder"
    >
      <Text fontFamily="heading" fontWeight={ 700 }>R</Text>
    </Flex>
  );
};

type Props = {
  className?: string;
};

const NetworkIcon = ({ className }: Props) => {
  return (
    <chakra.a
      className={ className }
      href={ route({ pathname: '/' }) }
      aria-label="Link to main page"
    >
      <Image
        w="36px"
        h="36px"
        skeletonWidth="36px"
        src={ ROKO_ICON_SRC }
        alt="Roko Network icon"
        fallback={ <IconFallback/> }
        objectFit="contain"
        objectPosition="center"
      />
    </chakra.a>
  );
};

export default React.memo(chakra(NetworkIcon));
