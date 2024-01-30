import { useQuery } from '@tanstack/react-query';
import _groudBy from 'lodash/groupBy';
import React from 'react';

import type { MarketplaceAppOverview } from 'types/client/marketplace';

import config from 'configs/app';
import type { ResourceError } from 'lib/api/resources';
import useFeatureValue from 'lib/growthbook/useFeatureValue';
import useApiFetch from 'lib/hooks/useFetch';

const feature = config.features.marketplace;
const categoriesUrl = (feature.isEnabled && feature.categoriesUrl) || '';

const categoriesStub = Array(9).fill('Bridge').map((c, i) => c + i);

export default function useMarketplaceCategories(apps: Array<MarketplaceAppOverview> | undefined, isAppsPlaceholderData: boolean) {
  const apiFetch = useApiFetch();
  const { value: isExperiment } = useFeatureValue('marketplace_exp', false);

  const { isPlaceholderData, data } = useQuery<unknown, ResourceError<unknown>, Array<string>>({
    queryKey: [ 'marketplace-categories' ],
    queryFn: async() => apiFetch(categoriesUrl, undefined, { resource: 'marketplace-categories' }),
    placeholderData: categoriesUrl ? categoriesStub : undefined,
    staleTime: Infinity,
    enabled: Boolean(categoriesUrl),
  });

  const categories = React.useMemo(() => {
    if (isAppsPlaceholderData || isPlaceholderData) {
      return categoriesStub.map(category => ({ name: category, count: 0 }));
    }

    let categoryNames: Array<string> = [];
    const grouped = _groudBy(apps, app => app.categories);

    if (data?.length && !isPlaceholderData && isExperiment) {
      categoryNames = data;
    } else {
      categoryNames = Object.keys(grouped);
    }

    return categoryNames
      .map(category => ({ name: category, count: grouped[category]?.length || 0 }))
      .filter(c => c.count > 0);
  }, [ apps, isAppsPlaceholderData, data, isPlaceholderData, isExperiment ]);

  return React.useMemo(() => ({
    isPlaceholderData: isAppsPlaceholderData || isPlaceholderData,
    data: categories,
  }), [ isPlaceholderData, isAppsPlaceholderData, categories ]);
}
