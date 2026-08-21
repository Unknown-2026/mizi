export function getDistanceMessage(distance: number, arrivalRangeMeters = 100) {
  if (distance <= arrivalRangeMeters) {
    return {
      detail: '목적지에 도착했어요. 사진을 남길 준비를 해주세요.',
      short: '이곳이 목적지예요!',
      title: '도착 신호를 확인했어요',
    };
  }

  if (distance <= Math.max(arrivalRangeMeters + 4, 10)) {
    return {
      detail: '목적지 바로 근처예요. 화살표 방향을 맞춰 조금만 이동해보세요.',
      short: '거의 다 왔어요!',
      title: '목적지가 코앞이에요',
    };
  }

  if (distance <= 250) {
    return {
      detail: '거의 다 왔어요. 주변을 둘러보며 정확한 위치를 찾아보세요.',
      short: '조금만 더 가면 도착해요!',
      title: '목적지가 가까워졌어요',
    };
  }

  if (distance <= 800) {
    return {
      detail: '화살표가 가리키는 방향으로 조금 더 이동해보세요.',
      short: '목적지에 가까워지고 있어요.',
      title: '방향을 따라 이동해요',
    };
  }

  return {
    detail: '이 방향이 맞는지 주변을 둘러보며 이동해보세요.',
    short: '조금만 더 가면 도착해요!',
    title: '신호를 추적하고 있어요',
  };
}

export function formatDistance(distance: number) {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)} km`;
  }

  return `${distance} m`;
}
