// SPDX-License-Identifier: LicenseRef-Blockscout

// we use custom heading size for hero banner
// eslint-disable-next-line no-restricted-imports
import { Box, Flex, Heading } from '@chakra-ui/react';
import React from 'react';

import SearchBar from 'src/slices/search/components/search-bar/SearchBarDesktop';
import SearchBarMobile from 'src/slices/search/components/search-bar/SearchBarMobile';

import UserProfileDesktop from 'src/features/account/components/user-profile/UserProfileDesktop';
import AdBanner from 'src/features/ads/banner/components/AdBanner';
import RewardsButton from 'src/features/rewards/components/RewardsButton';

import config from 'src/config';
import useIsMobile from 'src/shared/hooks/useIsMobile';

export const BACKGROUND_DEFAULT =
  'var(--chakra-colors-bg-hero)';
const TEXT_COLOR_DEFAULT = 'var(--chakra-colors-heading)';
const BORDER_DEFAULT = '2px solid var(--chakra-colors-border)';

const HeroBanner = () => {

  const isMobile = useIsMobile();

  const background = {
    _light:
      config.slices.home.heroBanner?.background?.[0] ||
      BACKGROUND_DEFAULT,
    _dark:
      config.slices.home.heroBanner?.background?.[1] ||
      config.slices.home.heroBanner?.background?.[0] ||
      BACKGROUND_DEFAULT,
  };

  const textColor = {
    _light:
      // light mode
      config.slices.home.heroBanner?.text_color?.[0] ||
      TEXT_COLOR_DEFAULT,
    // dark mode
    _dark:
      config.slices.home.heroBanner?.text_color?.[1] ||
      config.slices.home.heroBanner?.text_color?.[0] ||
      TEXT_COLOR_DEFAULT,
  };

  const border = {
    _light:
      config.slices.home.heroBanner?.border?.[0] || BORDER_DEFAULT,
    _dark:
      config.slices.home.heroBanner?.border?.[1] || config.slices.home.heroBanner?.border?.[0] || BORDER_DEFAULT,
  };

  const text = (() => {
    if (config.slices.home.heroBanner?.text) {
      return config.slices.home.heroBanner.text;
    }

    return `${ config.chain.name } explorer`;
  })();

  return (
    <Flex
      w="100%"
      background={ background }
      border={ border }
      borderRadius="base"
      p={{ base: 4, lg: 8 }}
      columnGap={ 8 }
      alignItems="center"
    >
      <Box flexGrow={ 1 }>
        <Flex mb={{ base: 2, lg: 3 }} justifyContent="space-between" alignItems="center" columnGap={ 2 }>
          <Heading
            as="h1"
            textStyle={{ base: 'heading.md', lg: 'heading.xl' }}
            color={ textColor }
          >
            { text }
          </Heading>
          { config.shell.navigation.layout === 'vertical' && (
            <Box display={{ base: 'none', lg: 'flex' }} gap={ 2 }>
              { config.features.rewards.isEnabled && <RewardsButton variant="hero"/> }
              <UserProfileDesktop buttonVariant="hero"/>
            </Box>
          ) }
        </Flex>
        <Box display={{ base: 'flex', lg: 'none' }}>
          <SearchBarMobile isHeroBanner/>
        </Box>
        <Box display={{ base: 'none', lg: 'flex' }}>
          <SearchBar isHeroBanner/>
        </Box>
      </Box>
      { !isMobile && <AdBanner format="mobile" w="fit-content" flexShrink={ 0 } borderRadius="md" overflow="hidden"/> }
    </Flex>
  );
};

export default React.memo(HeroBanner);
