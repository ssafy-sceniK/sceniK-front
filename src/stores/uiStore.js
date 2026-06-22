import { defineStore } from 'pinia';
import {
  clearAccessToken,
  exchangeOAuthCode,
  fetchMe,
  login as loginRequest,
  logout as logoutRequest,
  readAccessToken,
  saveAccessToken,
  signup as signupRequest,
  updateMe,
} from '../api/authApi.js';
import { getUserMessage } from '../api/error.js';
import {
  fetchContentDetail,
} from '../api/contentApi.js';
import {
  fetchPlaceDetail,
} from '../api/placeApi.js';
import {
  createRoute,
  deleteRoute,
  fetchMyRoutes,
  fetchRoute,
  serializeRoutePayload,
  updateRoute,
} from '../api/routeApi.js';
import {
  fetchMyLikes,
  fetchMyVisitStatus,
  likeContent,
  likePlace,
  setPlaceVisitStatus,
  unlikeContent,
  unlikePlace,
} from '../api/engagementApi.js';
import {
  createComment as createCommunityComment,
  createPost as createCommunityPost,
  deleteComment as deleteCommunityComment,
  deletePost as deleteCommunityPost,
  getPost as fetchCommunityPost,
  getPosts as fetchCommunityPosts,
  likeComment as likeCommunityComment,
  likePost as likeCommunityPost,
  normalizePost as normalizeCommunityPost,
  unlikeComment as unlikeCommunityComment,
  unlikePost as unlikeCommunityPost,
  updateComment as updateCommunityComment,
  updatePost as updateCommunityPost,
} from '../api/communityApi.js';
import {
  fetchFollowers,
  fetchMyFollowing,
  followUser as followUserRequest,
  unfollowUser as unfollowUserRequest,
} from '../api/followApi.js';
import { fetchMyReviews } from '../api/reviewApi.js';
import { contentPlaces, contents, courseTemplates, places } from '../data/mockData.js';
import { AI_ROUTE_VALIDATION_USER_MESSAGE, validateAiRoute } from '../adapters/routeValidation.js';
import { dateAfter, ensureDateRange, getTripDurationDays } from '../utils/tripDates.js';

const STORAGE_KEY = 'scenik-vue-mvp-state';

function formatWon(value) {
  const amount = Number(value) || 0;
  if (amount >= 10000) return `${Math.round(amount / 10000)}만원`;
  return `${amount.toLocaleString('ko-KR')}원`;
}

function formatBudgetRange(min, max) {
  return `${formatWon(min)} ~ ${formatWon(max)}`;
}

function flattenPreferences(preferences) {
  if (!preferences) return [];
  if (Array.isArray(preferences)) return preferences.filter(Boolean);
  return Object.values(preferences)
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter(Boolean);
}

function defaultState() {
  return {
    onboardingSeen: false,
    currentUser: null,
    users: [],
    likedContent: [],
    likedPlaces: [],
    likedContentDetails: [],
    likedPlaceDetails: [],
    plannedVisits: [],
    completedVisits: [],
    plannedVisitDetails: [],
    completedVisitDetails: [],
    recentViewedPlaces: [],
    recentViewedPlaceDetails: [],
    savedCourses: [],
    communityPosts: [],
    myReviews: [],
    followingUsers: [],
    followerUsers: [],
    selectedContentId: '',
    selectedContentIds: [],
    courseConditions: {
      region: '서울',
      regions: ['서울'],
      duration: 1,
      startDate: dateAfter(7),
      endDate: dateAfter(7),
      transport: '대중교통',
      companion: '친구',
      style: '감성 여행',
      travelStyles: ['감성 여행'],
      budgetMin: 100000,
      budgetMax: 300000,
      budget: '10만원 ~ 30만원',
      hotelAddress: '',
    },
    generatedRoute: null,
  };
}

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const state = raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
    state.selectedContentId = '';
    state.selectedContentIds = [];
    const dateRange = ensureDateRange(state.courseConditions);
    const conditionDefaults = defaultState().courseConditions;
    const budgetMin = Number(state.courseConditions?.budgetMin ?? conditionDefaults.budgetMin);
    const budgetMax = Number(state.courseConditions?.budgetMax ?? conditionDefaults.budgetMax);
    const normalizedBudgetMin = Math.min(budgetMin, budgetMax);
    const normalizedBudgetMax = Math.max(budgetMin, budgetMax);
    const storedRegions = Array.isArray(state.courseConditions?.regions)
      ? state.courseConditions.regions.filter(Boolean)
      : String(state.courseConditions?.region ?? conditionDefaults.region).split(/[,.·]/).map((item) => item.trim()).filter(Boolean);
    const storedStyles = Array.isArray(state.courseConditions?.travelStyles)
      ? state.courseConditions.travelStyles.filter(Boolean)
      : String(state.courseConditions?.style ?? conditionDefaults.style).split(/[,.·]/).map((item) => item.trim()).filter(Boolean);
    state.courseConditions = {
      ...conditionDefaults,
      ...state.courseConditions,
      ...dateRange,
      regions: storedRegions.length ? storedRegions : conditionDefaults.regions,
      region: (storedRegions.length ? storedRegions : conditionDefaults.regions).join(','),
      travelStyles: storedStyles.length ? storedStyles : conditionDefaults.travelStyles,
      style: (storedStyles.length ? storedStyles : conditionDefaults.travelStyles).join(', '),
      budgetMin: normalizedBudgetMin,
      budgetMax: normalizedBudgetMax,
      budget: formatBudgetRange(normalizedBudgetMin, normalizedBudgetMax),
      duration: getTripDurationDays({ ...state.courseConditions, ...dateRange }),
    };
    state.likedContent = [];
    state.likedPlaces = [];
    state.likedContentDetails = [];
    state.likedPlaceDetails = [];
    state.plannedVisits = [];
    state.completedVisits = [];
    state.plannedVisitDetails = [];
    state.completedVisitDetails = [];
    state.savedCourses = [];
    state.communityPosts = [];
    return state;
  } catch {
    return defaultState();
  }
}

function makeCandidatePlace(place, relatedContent) {
  return {
    placeId: place.placeId,
    name: place.placeName,
    region: place.region,
    category: place.category,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    relatedContentId: relatedContent?.contentId ?? place.relatedContentIds?.[0] ?? 'content-local',
    relatedContentTitle: relatedContent?.title ?? 'Saved course',
    sceneDescription: place.description ?? 'Verified sceniK place',
    verified: place.verified === true,
    imageUrl: place.imageUrl,
  };
}

function routePlaceIdsFromDays(days = []) {
  return [...new Set(days.flatMap((day) => day.places ?? []).map((place) => place.placeId).filter(Boolean))];
}

function relatedContentForPlace(place, preferredContentIds = []) {
  const preferred = preferredContentIds.find((contentId) => place.relatedContentIds?.includes(contentId));
  return contents.find((content) => content.contentId === preferred)
    ?? contents.find((content) => place.relatedContentIds?.includes(content.contentId));
}

function inferCourseContentIds(course = {}, placeIds = []) {
  const ids = new Set();
  if (course.contentId) ids.add(course.contentId);
  (course.contentIds ?? []).forEach((contentId) => ids.add(contentId));
  (course.candidatePlaces ?? []).forEach((candidate) => {
    if (candidate.relatedContentId) ids.add(candidate.relatedContentId);
  });
  placeIds.forEach((placeId) => {
    const place = places.find((item) => item.placeId === placeId);
    (place?.relatedContentIds ?? []).forEach((contentId) => ids.add(contentId));
  });
  return [...ids].filter(Boolean);
}

function relatedVerifiedPlacesForCourse(course = {}, placeIds = []) {
  const contentIds = inferCourseContentIds(course, placeIds);
  const courseRegions = Array.isArray(course.regions) && course.regions.length
    ? course.regions
    : String(course.region ?? '').split(/[,.·]/).map((region) => region.trim()).filter(Boolean);
  const mappedPlaceIds = new Set();

  contentPlaces.forEach((item) => {
    if (contentIds.includes(item.contentId)) mappedPlaceIds.add(item.placeId);
  });

  places.forEach((place) => {
    if ((place.relatedContentIds ?? []).some((contentId) => contentIds.includes(contentId))) {
      mappedPlaceIds.add(place.placeId);
    }
  });

  const relatedPlaces = [...mappedPlaceIds]
    .map((placeId) => places.find((place) => place.placeId === placeId))
    .filter((place) => place?.verified === true);

  if (!courseRegions.length) return relatedPlaces;
  return relatedPlaces.filter((place) => courseRegions.includes(place.region));
}

function buildCandidatePlaces(placeIds = [], course = {}) {
  const existing = new Map((course.candidatePlaces ?? []).map((place) => [place.placeId, place]));
  const candidates = new Map();
  const preferredContentIds = inferCourseContentIds(course, placeIds);

  function addCandidate(candidate) {
    if (candidate?.placeId && !candidates.has(candidate.placeId)) {
      candidates.set(candidate.placeId, candidate);
    }
  }

  (course.candidatePlaces ?? []).forEach(addCandidate);

  [...new Set(placeIds)].forEach((placeId) => {
    const candidate = existing.get(placeId);
    if (candidate) {
      addCandidate(candidate);
      return;
    }

    const place = places.find((item) => item.placeId === placeId);
    if (!place) return;

    addCandidate(makeCandidatePlace(place, relatedContentForPlace(place, preferredContentIds)));
  });

  const usedPlaceIds = [...new Set(placeIds)];
  const generatedCandidatesCoverRoute = usedPlaceIds.length > 0
    && usedPlaceIds.every((placeId) => candidates.has(placeId));

  if (generatedCandidatesCoverRoute && Array.isArray(course.candidatePlaces) && course.candidatePlaces.length) {
    return [...candidates.values()];
  }

  relatedVerifiedPlacesForCourse(course, placeIds).forEach((place) => {
    addCandidate(makeCandidatePlace(place, relatedContentForPlace(place, preferredContentIds)));
  });

  return [...candidates.values()];
}

function summarizeRoutePayload(payload = {}) {
  const days = Array.isArray(payload.days) ? payload.days : [];
  const stops = days.flatMap((day) => day.places ?? []);
  return {
    title: payload.title,
    region: payload.region,
    regions: payload.regions,
    durationDays: payload.durationDays,
    candidateCount: payload.candidatePlaces?.length ?? 0,
    dayCount: days.length,
    stopCount: stops.length,
    stopPlaceIds: stops.map((stop) => stop.placeId),
  };
}

function normalizeDays(days = []) {
  return days.map((day, dayIndex) => ({
    ...day,
    dayNumber: dayIndex + 1,
    places: (day.places ?? []).map((stop, stopIndex) => {
      const place = places.find((item) => item.placeId === stop.placeId);
      return {
        ...stop,
        placeId: stop.placeId,
        placeName: stop.placeName ?? stop.name ?? place?.placeName ?? '검증 장소',
        category: stop.category ?? stop.placeCategory ?? stop.type ?? place?.category ?? '장소',
        address: stop.address ?? place?.address,
        latitude: stop.latitude ?? place?.latitude,
        longitude: stop.longitude ?? place?.longitude,
        dayNumber: dayIndex + 1,
        visitOrder: stopIndex + 1,
        recommendedTime: stop.recommendedTime ?? '10:00',
        reason: stop.reason ?? `${place?.placeName ?? '이 장소'}는 선택한 콘텐츠와 연결된 검증 장소입니다.`,
        travelTip: stop.travelTip ?? '',
      };
    }),
  }));
}

function normalizeCourseToRoute(course) {
  if (!course) return null;
  if (Array.isArray(course.days) && course.days.length) {
    const days = normalizeDays(course.days);
    const placeIds = routePlaceIdsFromDays(days);
    return {
      ...course,
      routeId: course.routeId ?? `course-${Date.now()}`,
      summary: course.summary ?? `${course.region ?? 'Korea'} verified places connected into a sceniK travel course.`,
      duration: course.duration ?? course.durationDays ?? days.length,
      durationDays: days.length,
      transport: course.transport ?? 'Transit',
      region: course.region ?? course.regions?.join(',') ?? 'Korea',
      regions: course.regions ?? String(course.region ?? '').split(/[,.·]/).map((item) => item.trim()).filter(Boolean),
      style: course.style ?? course.travelStyles?.join(', ') ?? course.tags?.[0] ?? 'K-content travel',
      travelStyles: course.travelStyles ?? String(course.style ?? course.tags?.[0] ?? 'K-content travel').split(/[,.·]/).map((item) => item.trim()).filter(Boolean),
      trustMessage: course.trustMessage ?? 'This course uses only verified sceniK places.',
      places: placeIds,
      candidatePlaces: buildCandidatePlaces(placeIds, course),
      days,
    };
  }

  const placeIds = Array.isArray(course.places) ? course.places : [];
  const routePlaces = placeIds.map((id) => places.find((place) => place.placeId === id)).filter(Boolean);
  const dayCount = Math.max(1, Math.min(Number(course.durationDays ?? course.duration ?? 1), routePlaces.length || 1));
  const candidatePlaces = routePlaces.map((place) => {
    const relatedContent = contents.find((content) => place.relatedContentIds?.includes(content.contentId));
    return makeCandidatePlace(place, relatedContent);
  });
  const groups = Array.from({ length: dayCount }, () => []);

  candidatePlaces.forEach((place, index) => {
    groups[index % dayCount].push(place);
  });

  return {
    ...course,
    routeId: course.routeId ?? `course-${Date.now()}`,
    summary: course.summary ?? `${course.region ?? 'Korea'} verified places connected into a sceniK travel course.`,
    durationDays: dayCount,
    transport: course.transport ?? 'Transit',
    region: course.region ?? course.regions?.join(',') ?? 'Korea',
    regions: course.regions ?? String(course.region ?? '').split(/[,.·]/).map((item) => item.trim()).filter(Boolean),
    style: course.style ?? course.tags?.[0] ?? 'K-content travel',
    travelStyles: course.travelStyles ?? String(course.style ?? course.tags?.[0] ?? 'K-content travel').split(/[,.·]/).map((item) => item.trim()).filter(Boolean),
    trustMessage: course.trustMessage ?? 'This course uses only verified sceniK places.',
    candidatePlaces,
    days: groups.map((group, dayIndex) => ({
      dayNumber: dayIndex + 1,
      estimatedTravelTime: dayIndex === 0 ? 'About 60 min' : 'About 75 min',
      places: group.map((place, placeIndex) => ({
        placeId: place.placeId,
        placeName: place.name,
        dayNumber: dayIndex + 1,
        visitOrder: placeIndex + 1,
        recommendedTime: placeIndex === 0 ? '10:00' : placeIndex === 1 ? '14:00' : '17:30',
        reason: `${place.relatedContentTitle} 분위기와 연결된 검증 장소입니다.`,
        travelTip: '',
      })),
    })),
  };
}

function validateRoute(route) {
  if (!route) {
    return { ok: false, errors: ['Course route was not found.'] };
  }

  return validateAiRoute(route, route.candidatePlaces, {
    region: route.region,
    durationDays: route.durationDays,
  });
}

function sameId(left, right) {
  return String(left) === String(right);
}

function apiErrorMessage(error, fallback = '요청을 처리하지 못했습니다.') {
  return getUserMessage(error, fallback);
}

async function loadContentDetails(contentIds = []) {
  const uniqueIds = [...new Set(contentIds.filter(Boolean))];
  const results = await Promise.allSettled(uniqueIds.map((contentId) => fetchContentDetail(contentId)));
  return results
    .filter((result) => result.status === 'fulfilled' && result.value)
    .map((result) => result.value);
}

async function loadPlaceDetails(placeIds = []) {
  const uniqueIds = [...new Set(placeIds.filter(Boolean))];
  const results = await Promise.allSettled(uniqueIds.map((placeId) => fetchPlaceDetail(placeId)));
  return results
    .filter((result) => result.status === 'fulfilled' && result.value)
    .map((result) => result.value);
}

function mergeCommunityPost(posts, post) {
  const normalized = normalizeCommunityPost(post);
  const key = normalized.postId ?? normalized.id;
  const existingIndex = posts.findIndex((item) => sameId(item.postId ?? item.id, key));
  if (existingIndex < 0) return [normalized, ...posts];
  return posts.map((item, index) => (index === existingIndex ? normalized : item));
}

function withCommunityCommentCount(post, comments) {
  const nextCount = comments.length;
  return {
    ...post,
    comments,
    commentCount: nextCount,
    commentsCount: nextCount,
  };
}

function mergeCommunityComment(posts, comment) {
  const key = comment?.commentId ?? comment?.id;
  if (!key) return posts;
  return posts.map((post) => {
    const comments = post.comments ?? [];
    const hasComment = comments.some((item) => sameId(item.commentId ?? item.id, key));
    if (!hasComment) return post;
    return withCommunityCommentCount(
      post,
      comments.map((item) => (
        sameId(item.commentId ?? item.id, key)
          ? {
              ...item,
              ...comment,
              id: comment.id ?? key,
              commentId: comment.commentId ?? key,
            }
          : item
      ))
    );
  });
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    ...defaultState(),
    toast: '',
    toastTone: 'info',
    loginRequiredMessage: '',
    authLoading: false,
    authError: '',
    savedCoursesLoading: false,
    routeActionLoading: false,
    routeError: '',
    communityLoading: false,
    communityError: '',
    myReviewsLoading: false,
    myReviewsError: '',
    followLoading: false,
    followError: '',
    pendingContentLikes: [],
    pendingPlaceLikes: [],
    pendingVisitStatuses: [],
    pendingPostLikes: [],
    pendingCommentLikes: [],
    followActionLoadingIds: [],
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.currentUser),
    likedContentItems: (state) => state.likedContentDetails,
    likedPlaceItems: (state) => state.likedPlaceDetails,
    plannedVisitItems: (state) => state.plannedVisitDetails,
    completedVisitItems: (state) => state.completedVisitDetails,
    recentPlaceItems: (state) => state.recentViewedPlaceDetails,
    followingIds: (state) => state.followingUsers.map((user) => user.userId).filter(Boolean),
  },
  actions: {
    restore() {
      Object.assign(this, readState());
      this.users = [];
      if (!readAccessToken()) {
        this.currentUser = null;
        return;
      }
      this.syncSessionFromServer();
    },
    persist() {
      const {
        toast,
        toastTone,
        loginRequiredMessage,
        authLoading,
        authError,
        savedCoursesLoading,
        routeActionLoading,
        routeError,
        savedCourses,
        likedContent,
        likedPlaces,
        likedContentDetails,
        likedPlaceDetails,
        plannedVisits,
        completedVisits,
        plannedVisitDetails,
        completedVisitDetails,
        recentViewedPlaceDetails,
        communityPosts,
        communityLoading,
        communityError,
        myReviews,
        myReviewsLoading,
        myReviewsError,
        followingUsers,
        followerUsers,
        followLoading,
        followError,
        pendingContentLikes,
        pendingPlaceLikes,
        pendingVisitStatuses,
        pendingPostLikes,
        pendingCommentLikes,
        followActionLoadingIds,
        selectedContentId,
        selectedContentIds,
        ...persisted
      } = this.$state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    },
    notify(message, tone = 'info') {
      this.toast = message;
      this.toastTone = tone;
      window.setTimeout(() => {
        if (this.toast === message) {
          this.toast = '';
          this.toastTone = 'info';
        }
      }, 2400);
    },
    requireAuth(message) {
      if (this.currentUser) return true;
      this.loginRequiredMessage = message;
      return false;
    },
    async syncSessionFromServer() {
      if (!readAccessToken()) return;
      this.authLoading = true;
      try {
        this.currentUser = await fetchMe();
        this.onboardingSeen = true;
        await this.loadSavedCourses();
        await this.loadEngagementState();
        await this.loadFollowState();
        this.persist();
      } catch {
        clearAccessToken();
        this.currentUser = null;
        this.savedCourses = [];
        this.persist();
      } finally {
        this.authLoading = false;
      }
    },
    async loadSavedCourses() {
      if (!this.currentUser || !readAccessToken()) return [];
      this.savedCoursesLoading = true;
      this.routeError = '';
      try {
        const routes = await fetchMyRoutes();
        this.savedCourses = routes.map((route) => normalizeCourseToRoute(route)).filter(Boolean);
        this.persist();
        return this.savedCourses;
      } catch (error) {
        this.routeError = apiErrorMessage(error, '저장한 코스를 불러오지 못했습니다.');
        this.savedCourses = [];
        this.persist();
        return [];
      } finally {
        this.savedCoursesLoading = false;
      }
    },
    async loadCommunityPosts(params = {}) {
      this.communityLoading = true;
      this.communityError = '';
      try {
        this.communityPosts = await fetchCommunityPosts(params);
        return this.communityPosts;
      } catch (error) {
        this.communityError = apiErrorMessage(error, '커뮤니티 글을 불러오지 못했습니다.');
        this.communityPosts = [];
        return [];
      } finally {
        this.communityLoading = false;
      }
    },
    async loadCommunityPost(postId) {
      if (!postId) return null;
      this.communityLoading = true;
      this.communityError = '';
      try {
        const post = await fetchCommunityPost(postId);
        this.communityPosts = mergeCommunityPost(this.communityPosts, post);
        return post;
      } catch (error) {
        this.communityError = apiErrorMessage(error, '게시글을 불러오지 못했습니다.');
        return null;
      } finally {
        this.communityLoading = false;
      }
    },
    async loadEngagementState() {
      if (!this.currentUser || !readAccessToken()) return;
      try {
        const [likes, visitStatuses] = await Promise.all([
          fetchMyLikes(),
          fetchMyVisitStatus(),
        ]);
        this.likedContent = likes.contentIds ?? [];
        this.likedPlaces = likes.placeIds ?? [];
        this.likedContentDetails = await loadContentDetails(this.likedContent);
        this.likedPlaceDetails = await loadPlaceDetails(this.likedPlaces);
        this.plannedVisits = visitStatuses
          .filter((item) => item.status === 'planned')
          .map((item) => item.placeId);
        this.completedVisits = visitStatuses
          .filter((item) => item.status === 'completed')
          .map((item) => item.placeId);
        this.plannedVisitDetails = await loadPlaceDetails(this.plannedVisits);
        this.completedVisitDetails = await loadPlaceDetails(this.completedVisits);
        this.persist();
      } catch (error) {
        this.notify(apiErrorMessage(error, '좋아요와 방문 상태를 불러오지 못했습니다.'));
      }
    },
    async loadCourseDetail(routeId) {
      if (!routeId || !this.currentUser || !readAccessToken()) return this.resolveCourseDetail(routeId);
      this.savedCoursesLoading = true;
      this.routeError = '';
      try {
        const loaded = normalizeCourseToRoute(await fetchRoute(routeId));
        if (loaded) {
          this.savedCourses = [loaded, ...this.savedCourses.filter((item) => item.routeId !== loaded.routeId)];
          this.persist();
        }
        return this.resolveCourseDetail(routeId);
      } catch (error) {
        this.routeError = apiErrorMessage(error, '코스 상세를 불러오지 못했습니다.');
        return null;
      } finally {
        this.savedCoursesLoading = false;
      }
    },
    async signUp({ email, password, nickname }) {
      const safeEmail = email?.trim() ?? '';
      const safeNickname = nickname?.trim() ?? '';
      if (!safeEmail) throw new Error('이메일을 입력해 주세요.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) throw new Error('올바른 이메일 형식이 아닙니다.');
      if (!password) throw new Error('비밀번호를 입력해 주세요.');
      if (password.length < 8) throw new Error('비밀번호는 8자 이상이어야 합니다.');
      if (!safeNickname) throw new Error('닉네임을 입력해 주세요.');
      this.authLoading = true;
      this.authError = '';
      try {
        const session = await signupRequest({ email: safeEmail, password, nickname: safeNickname });
        saveAccessToken(session.accessToken, session.refreshToken);
        this.currentUser = session.user;
        this.onboardingSeen = true;
        await this.loadSavedCourses();
        await this.loadEngagementState();
        await this.loadFollowState();
        this.persist();
        this.notify('회원가입이 완료되었습니다.', 'success');
        return this.currentUser;
      } catch (error) {
        const message = apiErrorMessage(error, '회원가입에 실패했습니다.');
        this.authError = message;
        error.userMessage = message;
        throw error;
      } finally {
        this.authLoading = false;
      }
    },
    async login({ email, password }) {
      const safeEmail = email?.trim() ?? '';
      if (!safeEmail) throw new Error('이메일을 입력해 주세요.');
      if (!password) throw new Error('비밀번호를 입력해 주세요.');
      this.authLoading = true;
      try {
        const session = await loginRequest({ email: safeEmail, password });
        saveAccessToken(session.accessToken, session.refreshToken);
        this.currentUser = session.user;
        this.onboardingSeen = true;
        await this.loadSavedCourses();
        await this.loadEngagementState();
        await this.loadFollowState();
        this.persist();
        this.notify('로그인되었습니다.', 'success');
        return this.currentUser;
      } catch (error) {
        throw new Error(apiErrorMessage(error, '로그인에 실패했습니다.'));
      } finally {
        this.authLoading = false;
      }
    },
    async completeOAuthLogin(code, provider = 'oauth') {
      if (!code) throw new Error('OAuth 로그인 코드가 없습니다.');
      this.authLoading = true;
      try {
        const session = await exchangeOAuthCode(code);
        if (!session.accessToken) throw new Error('로그인 토큰을 받지 못했습니다.');
        saveAccessToken(session.accessToken, session.refreshToken);
        this.currentUser = session.user;
        this.onboardingSeen = true;
        await Promise.all([
          this.loadSavedCourses(),
          this.loadEngagementState(),
          this.loadFollowState(),
        ]);
        this.persist();
        const providerName = ({ google: 'Google', kakao: '카카오' })[provider] ?? '소셜';
        this.notify(`${providerName} 계정으로 로그인되었습니다.`, 'success');
        return this.currentUser;
      } catch (error) {
        clearAccessToken();
        this.currentUser = null;
        this.persist();
        const providerName = ({ google: 'Google', kakao: '카카오' })[provider] ?? '소셜';
        throw new Error(apiErrorMessage(error, `${providerName} 로그인에 실패했습니다.`));
      } finally {
        this.authLoading = false;
      }
    },
    async logout() {
      try {
        if (readAccessToken()) await logoutRequest();
      } catch {
        // Local logout should still clear client state if the token is already invalid.
      }
      clearAccessToken();
      this.currentUser = null;
      this.savedCourses = [];
      this.myReviews = [];
      this.followingUsers = [];
      this.followerUsers = [];
      this.persist();
      this.notify('로그아웃되었습니다.', 'success');
    },
    async savePreferences(preferences) {
      if (this.currentUser) {
        try {
          const updated = readAccessToken()
            ? await updateMe({
                nickname: this.currentUser.nickname,
                preferences: flattenPreferences(preferences),
              })
            : {};
          this.currentUser = {
            ...this.currentUser,
            ...updated,
            preferences,
          };
        } catch (error) {
          this.currentUser.preferences = preferences;
          this.notify(apiErrorMessage(error, '취향 설정을 서버에 저장하지 못했습니다.'));
        }
      }
      this.onboardingSeen = true;
      this.persist();
    },
    async updateProfile({ nickname, bio, preferences }) {
      if (!this.requireAuth('로그인하면 프로필을 수정할 수 있습니다.')) return false;
      const safeNickname = nickname?.trim();
      if (!safeNickname || safeNickname.length < 2) {
        this.notify('닉네임은 2자 이상 입력해 주세요.');
        return false;
      }

      this.authLoading = true;
      this.authError = '';
      try {
        const updated = await updateMe({
          nickname: safeNickname,
          bio: bio?.trim() ?? '',
          preferences: flattenPreferences(preferences ?? this.currentUser.preferences),
        });
        this.currentUser = {
          ...this.currentUser,
          ...updated,
          nickname: updated.nickname ?? safeNickname,
          bio: updated.bio ?? bio?.trim() ?? '',
          preferences: preferences ?? updated.preferences ?? this.currentUser.preferences ?? {},
        };
        this.persist();
        this.notify('프로필을 저장했습니다.');
        return true;
      } catch (error) {
        this.authError = apiErrorMessage(error, '프로필을 저장하지 못했습니다.');
        this.notify(this.authError);
        return false;
      } finally {
        this.authLoading = false;
      }
    },
    async toggleContentLike(contentId) {
      if (!this.requireAuth('로그인하면 콘텐츠를 좋아요로 저장할 수 있습니다.')) return;
      if (this.pendingContentLikes.includes(contentId)) return;
      this.pendingContentLikes = [...this.pendingContentLikes, contentId];
      const liked = this.likedContent.includes(contentId);
      try {
        if (liked) await unlikeContent(contentId);
        else await likeContent(contentId);
        this.likedContent = liked
          ? this.likedContent.filter((id) => id !== contentId)
          : [...this.likedContent, contentId];
        if (liked) {
          this.likedContentDetails = this.likedContentDetails.filter((item) => item.contentId !== contentId);
        } else {
          const detail = await fetchContentDetail(contentId).catch(() => null);
          if (detail) this.likedContentDetails = [detail, ...this.likedContentDetails.filter((item) => item.contentId !== contentId)];
        }
        this.persist();
      } catch (error) {
        this.notify(apiErrorMessage(error, '콘텐츠 좋아요를 저장하지 못했습니다.'));
      } finally {
        this.pendingContentLikes = this.pendingContentLikes.filter((id) => id !== contentId);
      }
    },
    toggleSelectedContent(contentId) {
      const current = Array.isArray(this.selectedContentIds) ? this.selectedContentIds : [this.selectedContentId].filter(Boolean);
      this.selectedContentIds = current.includes(contentId)
        ? current.filter((id) => id !== contentId)
        : [...current, contentId];
      this.selectedContentId = this.selectedContentIds[0] ?? '';
    },
    setAiSelection(contentIds) {
      this.selectedContentIds = [...new Set(contentIds.filter(Boolean))];
      this.selectedContentId = this.selectedContentIds[0] ?? '';
    },
    resetAiSelection() {
      this.selectedContentId = '';
      this.selectedContentIds = [];
    },
    async togglePlaceLike(placeId) {
      if (!this.requireAuth('로그인하면 장소를 좋아요로 저장할 수 있습니다.')) return;
      if (this.pendingPlaceLikes.includes(placeId)) return;
      this.pendingPlaceLikes = [...this.pendingPlaceLikes, placeId];
      const liked = this.likedPlaces.includes(placeId);
      try {
        if (liked) await unlikePlace(placeId);
        else await likePlace(placeId);
        this.likedPlaces = liked
          ? this.likedPlaces.filter((id) => id !== placeId)
          : [...this.likedPlaces, placeId];
        if (liked) {
          this.likedPlaceDetails = this.likedPlaceDetails.filter((item) => item.placeId !== placeId);
        } else {
          const detail = await fetchPlaceDetail(placeId).catch(() => null);
          if (detail) this.likedPlaceDetails = [detail, ...this.likedPlaceDetails.filter((item) => item.placeId !== placeId)];
        }
        this.persist();
      } catch (error) {
        this.notify(apiErrorMessage(error, '장소 좋아요를 저장하지 못했습니다.'));
      } finally {
        this.pendingPlaceLikes = this.pendingPlaceLikes.filter((id) => id !== placeId);
      }
    },
    async setVisit(placeId, status) {
      if (!this.requireAuth('로그인하면 방문 상태를 저장할 수 있습니다.')) return;
      if (this.pendingVisitStatuses.some((id) => sameId(id, placeId))) return;
      this.pendingVisitStatuses = [...this.pendingVisitStatuses, placeId];
      try {
        await setPlaceVisitStatus(placeId, status);
        this.plannedVisits = this.plannedVisits.filter((id) => id !== placeId);
        this.completedVisits = this.completedVisits.filter((id) => id !== placeId);
        this.plannedVisitDetails = this.plannedVisitDetails.filter((item) => item.placeId !== placeId);
        this.completedVisitDetails = this.completedVisitDetails.filter((item) => item.placeId !== placeId);
        const detail = await fetchPlaceDetail(placeId).catch(() => null);
        if (status === 'planned') this.plannedVisits.push(placeId);
        if (status === 'completed') this.completedVisits.push(placeId);
        if (status === 'planned' && detail) this.plannedVisitDetails = [detail, ...this.plannedVisitDetails];
        if (status === 'completed' && detail) this.completedVisitDetails = [detail, ...this.completedVisitDetails];
        this.persist();
        this.notify(status === 'completed' ? '방문 완료로 저장했습니다.' : '방문 예정으로 저장했습니다.');
      } catch (error) {
        this.notify(apiErrorMessage(error, '방문 상태를 저장하지 못했습니다.'));
      } finally {
        this.pendingVisitStatuses = this.pendingVisitStatuses.filter((id) => !sameId(id, placeId));
      }
    },
    markViewedPlace(placeId, placeDetail = null) {
      this.recentViewedPlaces = [placeId, ...this.recentViewedPlaces.filter((id) => id !== placeId)].slice(0, 12);
      if (placeDetail) {
        this.recentViewedPlaceDetails = [placeDetail, ...this.recentViewedPlaceDetails.filter((item) => item.placeId !== placeId)].slice(0, 12);
      }
      this.persist();
    },
    async saveCourse(route) {
      if (!this.requireAuth('로그인하면 AI 코스를 저장할 수 있습니다.')) {
        this.routeError = '로그인이 필요합니다.';
        return null;
      }
      const normalized = normalizeCourseToRoute(route);
      const validation = validateRoute(normalized);
      if (!validation.ok) {
        const detail = validation.errors[0] ?? AI_ROUTE_VALIDATION_USER_MESSAGE;
        this.routeError = `저장 전 검증 실패: ${detail}`;
        console.warn('Route validation failed before save', {
          errors: validation.errors,
          payload: summarizeRoutePayload(normalized),
        });
        this.notify(this.routeError);
        return null;
      }
      this.routeActionLoading = true;
      this.routeError = '';
      try {
        const savingGeneratedRoute = this.generatedRoute?.routeId === normalized.routeId;
        const placeIds = normalized.places ?? routePlaceIdsFromDays(normalized.days);
        const requestPayload = {
          ...normalized,
          duration: normalized.duration ?? normalized.durationDays,
          places: placeIds,
          tags: normalized.tags ?? ['AI 코스', normalized.region, normalized.style].filter(Boolean),
        };
        console.info('AI route save request payload', summarizeRoutePayload(serializeRoutePayload(requestPayload)));
        const saved = normalizeCourseToRoute(await createRoute(requestPayload));
        this.savedCourses = [saved, ...this.savedCourses.filter((item) => item.routeId !== saved.routeId)];
        if (savingGeneratedRoute || this.generatedRoute?.routeId === saved.routeId) this.generatedRoute = saved;
        this.persist();
        this.notify('AI 코스를 저장했습니다.');
        return saved;
      } catch (error) {
        console.error('AI route save failed', error?.response?.data ?? error);
        this.routeError = apiErrorMessage(error, 'AI 코스를 저장하지 못했습니다.');
        this.notify(this.routeError);
        return null;
      } finally {
        this.routeActionLoading = false;
      }

    },
    resolveCourseDetail(routeId) {
      const source = this.savedCourses.find((course) => course.routeId === routeId)
        ?? courseTemplates.find((course) => course.routeId === routeId)
        ?? (this.generatedRoute?.routeId === routeId ? this.generatedRoute : null)
        ?? (!routeId ? this.savedCourses[0] ?? this.generatedRoute ?? null : null);

      const route = normalizeCourseToRoute(source);
      if (!route) return null;

      return {
        route,
        validation: validateRoute(route),
        source: this.savedCourses.some((course) => course.routeId === route.routeId) ? 'saved' : 'template',
      };
    },
    async updateSavedCourse(route) {
      if (!this.requireAuth('로그인하면 저장한 코스를 수정할 수 있습니다.')) return false;

      const normalized = normalizeCourseToRoute(route);
      const validation = validateRoute(normalized);
      if (!validation.ok) {
        console.warn('Route validation failed before update', validation.errors);
        this.notify(AI_ROUTE_VALIDATION_USER_MESSAGE);
        return false;
      }

      const existing = this.savedCourses.find((course) => course.routeId === normalized.routeId);
      if (!existing) {
        this.notify('저장한 코스를 찾을 수 없습니다.');
        return false;
      }

      this.routeActionLoading = true;
      this.routeError = '';
      try {
        const saved = normalizeCourseToRoute(await updateRoute(normalized.routeId, {
          ...existing,
          ...normalized,
          places: normalized.places ?? routePlaceIdsFromDays(normalized.days),
          duration: normalized.duration ?? normalized.durationDays,
        }));
        this.savedCourses = this.savedCourses.map((course) => course.routeId === saved.routeId ? saved : course);
        if (this.generatedRoute?.routeId === saved.routeId) this.generatedRoute = saved;
        this.persist();
        this.notify('코스를 수정했습니다.');
        return true;
      } catch (error) {
        this.routeError = apiErrorMessage(error, '저장한 코스를 수정하지 못했습니다.');
        this.notify(this.routeError);
        return false;
      } finally {
        this.routeActionLoading = false;
      }
    },
    updateGeneratedRoute(route) {
      const normalized = normalizeCourseToRoute(route);
      const validation = validateRoute(normalized);
      if (!validation.ok) {
        console.warn('Generated route validation failed before update', validation.errors);
        this.notify(AI_ROUTE_VALIDATION_USER_MESSAGE);
        return false;
      }

      this.generatedRoute = normalized;
      this.persist();
      this.notify('AI 코스를 수정했습니다.');
      return true;
    },
    async deleteSavedCourse(routeId) {
      if (!this.requireAuth('로그인하면 저장한 코스를 삭제할 수 있습니다.')) return false;
      this.routeActionLoading = true;
      this.routeError = '';
      try {
        await deleteRoute(routeId);
      } catch (error) {
        this.routeError = apiErrorMessage(error, '저장한 코스를 삭제하지 못했습니다.');
        this.notify(this.routeError);
        this.routeActionLoading = false;
        return false;
      }
      const before = this.savedCourses.length;
      this.savedCourses = this.savedCourses.filter((course) => course.routeId !== routeId);
      if (this.generatedRoute?.routeId === routeId) this.generatedRoute = null;
      if (this.savedCourses.length === before) {
        this.routeActionLoading = false;
        return false;
      }
      this.persist();
      this.routeActionLoading = false;
      this.notify('코스를 삭제했습니다.');
      return true;
    },
    openCourse(course) {
      const route = normalizeCourseToRoute(course);
      if (!route) return false;
      this.generatedRoute = route;
      this.persist();
      return true;
    },
    async createPost(payload) {
      if (!this.requireAuth('로그인하면 커뮤니티 글을 작성할 수 있습니다.')) return null;
      try {
        const post = await createCommunityPost({
          title: payload.title || '커뮤니티 글',
          body: payload.body || payload.content || '',
          region: payload.region || this.courseConditions.region,
          duration: payload.duration || `${this.courseConditions.duration} days`,
          routeId: payload.routeId ?? null,
          imageUrl: payload.imageUrl ?? null,
          prefix: payload.prefix ?? '',
          attachments: payload.attachments ?? [],
          tags: payload.tags || ['AI 코스', this.courseConditions.region],
        });
        this.communityPosts = mergeCommunityPost(this.communityPosts, post);
        this.notify('게시글을 작성했습니다.');
        return post;
      } catch (error) {
        this.communityError = apiErrorMessage(error, '게시글을 작성하지 못했습니다.');
        this.notify(this.communityError);
        return null;
      }
    },
    async editPost(postId, payload) {
      if (!this.requireAuth('로그인하면 게시글을 수정할 수 있습니다.')) return null;
      try {
        const post = await updateCommunityPost(postId, payload);
        this.communityPosts = mergeCommunityPost(this.communityPosts, post);
        this.notify('게시글을 수정했습니다.', 'success');
        return post;
      } catch (error) {
        this.communityError = apiErrorMessage(error, '게시글을 수정하지 못했습니다.');
        this.notify(this.communityError);
        return null;
      }
    },
    async removePost(postId) {
      if (!this.requireAuth('로그인하면 게시글을 삭제할 수 있습니다.')) return false;
      try {
        await deleteCommunityPost(postId);
        this.communityPosts = this.communityPosts.filter((post) => !sameId(post.id, postId) && !sameId(post.postId, postId));
        this.notify('게시글을 삭제했습니다.', 'success');
        return true;
      } catch (error) {
        this.communityError = apiErrorMessage(error, '게시글을 삭제하지 못했습니다.');
        this.notify(this.communityError);
        return false;
      }
    },
    async togglePostLike(postId) {
      if (!this.requireAuth('로그인하면 게시글에 좋아요를 누를 수 있습니다.')) return;
      if (this.pendingPostLikes.some((id) => sameId(id, postId))) return;
      this.pendingPostLikes = [...this.pendingPostLikes, postId];
      const current = this.communityPosts.find((post) => sameId(post.id, postId) || sameId(post.postId, postId));
      if (!current) {
        this.pendingPostLikes = this.pendingPostLikes.filter((id) => !sameId(id, postId));
        return;
      }
      const likedBy = current.likedBy ?? [];
      const liked = current.isLiked || likedBy.includes(this.currentUser.userId);
      try {
        const updated = liked ? await unlikeCommunityPost(postId) : await likeCommunityPost(postId);
        const nextPost = updated ?? {
          ...current,
          isLiked: !liked,
          likedBy: liked ? likedBy.filter((id) => id !== this.currentUser.userId) : [...likedBy, this.currentUser.userId],
          likes: liked ? Math.max(0, current.likes - 1) : current.likes + 1,
        };
        this.communityPosts = mergeCommunityPost(this.communityPosts, nextPost);
        return;
      } catch (error) {
        this.communityError = apiErrorMessage(error, '게시글 좋아요를 변경하지 못했습니다.');
        this.notify(this.communityError);
        return;
      } finally {
        this.pendingPostLikes = this.pendingPostLikes.filter((id) => !sameId(id, postId));
      }
    },
    async toggleCommentLike(commentId) {
      if (!this.requireAuth('로그인이 필요합니다.')) return;
      if (this.pendingCommentLikes.some((id) => sameId(id, commentId))) return;

      const current = this.communityPosts
        .flatMap((post) => post.comments ?? [])
        .find((comment) => sameId(comment.commentId ?? comment.id, commentId));
      if (!current) return;

      this.pendingCommentLikes = [...this.pendingCommentLikes, commentId];
      const liked = Boolean(current.likedByMe || current.isLiked || current.liked);
      const currentCount = Number(current.likeCount ?? current.likes ?? 0);

      try {
        const updated = liked ? await unlikeCommunityComment(commentId) : await likeCommunityComment(commentId);
        const nextComment = updated ?? {
          ...current,
          likedByMe: !liked,
          isLiked: !liked,
          likeCount: liked ? Math.max(0, currentCount - 1) : currentCount + 1,
          likes: liked ? Math.max(0, currentCount - 1) : currentCount + 1,
        };
        this.communityPosts = mergeCommunityComment(this.communityPosts, nextComment);
        return nextComment;
      } catch (error) {
        this.communityError = apiErrorMessage(error, '댓글 좋아요를 변경하지 못했습니다.');
        this.notify(this.communityError);
        return null;
      } finally {
        this.pendingCommentLikes = this.pendingCommentLikes.filter((id) => !sameId(id, commentId));
      }
    },
    togglePostScrap(postId) {
      if (!this.requireAuth('로그인하면 커뮤니티 글을 스크랩할 수 있습니다.')) return;
      let scrappedPost = false;
      let changed = false;
      this.communityPosts = this.communityPosts.map((post) => {
        if (!sameId(post.id, postId) && !sameId(post.postId, postId)) return post;
        const scrappedBy = post.scrappedBy ?? [];
        const scrapped = scrappedBy.includes(this.currentUser.userId);
        scrappedPost = !scrapped;
        changed = true;
        return {
          ...post,
          scrappedBy: scrapped
            ? scrappedBy.filter((id) => id !== this.currentUser.userId)
            : [...scrappedBy, this.currentUser.userId],
        };
      });
      if (!changed) return;
      this.persist();
      this.notify(scrappedPost ? '게시글을 스크랩했습니다.' : '게시글 스크랩을 해제했습니다.');
    },
    async addComment(postId, text, parentCommentId = null) {
      if (!this.requireAuth('로그인하면 댓글을 작성할 수 있습니다.')) return null;
      if (!text?.trim()) {
        this.notify('댓글 내용을 입력해 주세요.');
        return null;
      }
      try {
        const comment = await createCommunityComment(postId, { text: text.trim(), parentCommentId });
        this.communityPosts = this.communityPosts.map((post) => (sameId(post.id, postId) || sameId(post.postId, postId))
          ? withCommunityCommentCount(post, [...(post.comments ?? []), comment])
          : post);
        return comment;
      } catch (error) {
        this.communityError = apiErrorMessage(error, '댓글을 등록하지 못했습니다.');
        this.notify(this.communityError);
        return null;
      }
    },
    async editComment(postId, commentId, text) {
      if (!this.requireAuth('로그인하면 댓글을 수정할 수 있습니다.')) return null;
      if (!text?.trim()) {
        this.notify('댓글 내용을 입력해 주세요.');
        return null;
      }
      try {
        const updated = await updateCommunityComment(postId, commentId, { text: text.trim() });
        this.communityPosts = this.communityPosts.map((post) => {
          if (!sameId(post.id, postId) && !sameId(post.postId, postId)) return post;
          return withCommunityCommentCount(
            post,
            (post.comments ?? []).map((comment) => (
              sameId(comment.id, commentId) || sameId(comment.commentId, commentId) ? updated : comment
            ))
          );
        });
        return updated;
      } catch (error) {
        this.communityError = apiErrorMessage(error, '댓글을 수정하지 못했습니다.');
        this.notify(this.communityError);
        return null;
      }
    },
    async removeComment(postId, commentId) {
      if (!this.requireAuth('로그인하면 댓글을 삭제할 수 있습니다.')) return false;
      try {
        await deleteCommunityComment(postId, commentId);
        this.communityPosts = this.communityPosts.map((post) => {
          if (!sameId(post.id, postId) && !sameId(post.postId, postId)) return post;
          const comments = (post.comments ?? []).filter((comment) => (
            !sameId(comment.id, commentId)
              && !sameId(comment.commentId, commentId)
              && !sameId(comment.parentCommentId, commentId)
          ));
          return withCommunityCommentCount(post, comments);
        });
        return true;
      } catch (error) {
        this.communityError = apiErrorMessage(error, '댓글을 삭제하지 못했습니다.');
        this.notify(this.communityError);
        return false;
      }
    },
    async loadMyReviews() {
      if (!this.currentUser || !readAccessToken()) return [];
      this.myReviewsLoading = true;
      this.myReviewsError = '';
      try {
        this.myReviews = await fetchMyReviews();
        return this.myReviews;
      } catch (error) {
        this.myReviews = [];
        this.myReviewsError = apiErrorMessage(error, '내 리뷰를 불러오지 못했습니다.');
        return [];
      } finally {
        this.myReviewsLoading = false;
      }
    },
    async loadFollowState() {
      if (!this.currentUser || !readAccessToken()) return [];
      this.followLoading = true;
      this.followError = '';
      try {
        const [following, followers] = await Promise.all([
          fetchMyFollowing(),
          fetchFollowers(this.currentUser.userId),
        ]);
        this.followingUsers = following;
        this.followerUsers = followers;
        return following;
      } catch (error) {
        this.followingUsers = [];
        this.followerUsers = [];
        this.followError = apiErrorMessage(error, '팔로우 정보를 불러오지 못했습니다.');
        return [];
      } finally {
        this.followLoading = false;
      }
    },
    async followUser(userId) {
      if (!this.requireAuth('로그인하면 작성자를 팔로우할 수 있습니다.')) return false;
      if (sameId(userId, this.currentUser.userId)) {
        this.notify('자기 자신은 팔로우할 수 없습니다.');
        return false;
      }
      if (this.followActionLoadingIds.some((id) => sameId(id, userId))) return false;
      this.followActionLoadingIds = [...this.followActionLoadingIds, userId];
      try {
        await followUserRequest(userId);
        await this.loadFollowState();
        this.notify('작성자를 팔로우했습니다.', 'success');
        return true;
      } catch (error) {
        const message = apiErrorMessage(error, '팔로우하지 못했습니다.');
        if (message.includes('이미 팔로우')) await this.loadFollowState();
        this.notify(message);
        return false;
      } finally {
        this.followActionLoadingIds = this.followActionLoadingIds.filter((id) => !sameId(id, userId));
      }
    },
    async unfollowUser(userId) {
      if (!this.requireAuth('로그인하면 팔로우를 해제할 수 있습니다.')) return false;
      if (this.followActionLoadingIds.some((id) => sameId(id, userId))) return false;
      this.followActionLoadingIds = [...this.followActionLoadingIds, userId];
      try {
        await unfollowUserRequest(userId);
        this.followingUsers = this.followingUsers.filter((user) => !sameId(user.userId, userId));
        this.notify('팔로우를 해제했습니다.', 'success');
        return true;
      } catch (error) {
        this.notify(apiErrorMessage(error, '팔로우를 해제하지 못했습니다.'));
        return false;
      } finally {
        this.followActionLoadingIds = this.followActionLoadingIds.filter((id) => !sameId(id, userId));
      }
    },
  },
});
