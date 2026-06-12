let kakaoMapsPromise;

export function loadKakaoMaps(appKey) {
  if (window.kakao?.maps) {
    return new Promise((resolve) => window.kakao.maps.load(() => resolve(window.kakao.maps)));
  }

  if (!appKey) {
    return Promise.reject(new Error('KAKAO_MAP_KEY_MISSING'));
  }

  if (kakaoMapsPromise) return kakaoMapsPromise;

  kakaoMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'kakao-maps-sdk';
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.onload = () => {
      if (!window.kakao?.maps) {
        reject(new Error('KAKAO_MAP_SDK_UNAVAILABLE'));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao.maps));
    };
    script.onerror = () => reject(new Error('KAKAO_MAP_SDK_LOAD_FAILED'));
    document.head.appendChild(script);
  }).catch((error) => {
    kakaoMapsPromise = undefined;
    throw error;
  });

  return kakaoMapsPromise;
}
