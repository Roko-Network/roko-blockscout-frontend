export default function getNetworkUtilizationParams(value: number) {
  const load = (() => {
    if (value > 80) {
      return 'high';
    }

    if (value > 50) {
      return 'medium';
    }

    return 'low';
  })();

  const colors = {
    high: 'text.error',
    medium: 'text.warning',
    low: 'text.success',
  };
  const color = colors[load];

  return {
    load,
    color,
  };
}
