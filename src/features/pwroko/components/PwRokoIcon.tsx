// SPDX-License-Identifier: LicenseRef-Blockscout

import { chakra } from '@chakra-ui/react';
import React from 'react';

import TokenIconPlaceholder from 'src/slices/token/components/icon/TokenIconPlaceholder';

import { Image } from 'src/toolkit/chakra/image';

interface Props {
  className?: string;
}

const PwRokoIcon = ({ className }: Props) => (
  <Image
    className={ className }
    src="/assets/token-icons/pwroko.svg"
    alt="pwROKO token logo"
    borderRadius="full"
    fallback={ <TokenIconPlaceholder/> }
  />
);

export default chakra(PwRokoIcon);
