import { createRouter, createWebHistory } from 'vue-router';
import { readAccessToken } from '../api/authApi.js';
import { useUiStore } from '../stores/uiStore.js';
import SplashView from '../views/SplashView.vue';
import LoginView from '../views/LoginView.vue';
import SignupView from '../views/SignupView.vue';
import PreferencesView from '../views/PreferencesView.vue';
import HomeView from '../views/HomeView.vue';
import ContentListView from '../views/ContentListView.vue';
import ContentDetailView from '../views/ContentDetailView.vue';
import PlaceListView from '../views/PlaceListView.vue';
import PlaceDetailView from '../views/PlaceDetailView.vue';
import SearchView from '../views/SearchView.vue';
import CourseView from '../views/CourseView.vue';
import CourseConditionsView from '../views/CourseConditionsView.vue';
import CourseDetailView from '../views/CourseDetailView.vue';
import CourseEditView from '../views/CourseEditView.vue';
import AiLoadingView from '../views/AiLoadingView.vue';
import AiResultView from '../views/AiResultView.vue';
import MapView from '../views/MapView.vue';
import CommunityView from '../views/CommunityView.vue';
import CommunityWriteView from '../views/CommunityWriteView.vue';
import MyPageView from '../views/MyPageView.vue';
import MyProfileEditView from '../views/MyProfileEditView.vue';
import NoticeListView from '../views/NoticeListView.vue';
import SimpleListView from '../views/SimpleListView.vue';
import NotificationsView from '../views/NotificationsView.vue';
import SettingsView from '../views/SettingsView.vue';
import PublicUserProfileView from '../views/PublicUserProfileView.vue';
import AdminView from '../views/AdminView.vue';
import OAuthCallbackView from '../views/OAuthCallbackView.vue';
import ForgotPasswordView from '../views/ForgotPasswordView.vue';
import ResetPasswordView from '../views/ResetPasswordView.vue';

const routes = [
  { path: '/', name: 'splash', component: SplashView, meta: { public: true } },
  { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
  { path: '/oauth/callback', name: 'oauth-callback', component: OAuthCallbackView, meta: { public: true } },
  { path: '/signup', name: 'signup', component: SignupView, meta: { public: true } },
  { path: '/forgot-password', name: 'forgot-password', component: ForgotPasswordView, meta: { public: true } },
  { path: '/password-reset', name: 'password-reset', component: ResetPasswordView, meta: { public: true } },
  { path: '/preferences', name: 'preferences', component: PreferencesView },
  { path: '/home', name: 'home', component: HomeView },
  { path: '/home/recent-all', name: 'home-recent-all', component: SimpleListView, meta: { titleKey: 'my.activity.title.recent', type: 'recent' } },
  { path: '/home/content-all', name: 'home-content-all', component: ContentListView },
  { path: '/home/routes-all', name: 'home-routes-all', component: SimpleListView, meta: { titleKey: 'my.activity.title.routes', type: 'routes' } },
  { path: '/contents', name: 'contents', component: ContentListView },
  { path: '/contents/:id', name: 'content-detail', component: ContentDetailView },
  { path: '/places', name: 'places', component: PlaceListView },
  { path: '/places/:id', name: 'place-detail', component: PlaceDetailView },
  { path: '/search', name: 'search', component: SearchView },
  { path: '/ai', name: 'ai-course', component: CourseView },
  { path: '/ai/conditions', name: 'ai-conditions', component: CourseConditionsView },
  { path: '/ai/loading', name: 'ai-loading', component: AiLoadingView },
  { path: '/ai/courses/:routeId', name: 'course-detail', component: CourseDetailView },
  { path: '/ai/result', name: 'ai-result', component: AiResultView },
  { path: '/ai/save-share', name: 'ai-save-share', component: AiResultView },
  { path: '/ai/edit', name: 'ai-edit', component: CourseEditView },
  { path: '/explore', name: 'explore', component: ContentListView },
  { path: '/explore/search-empty', name: 'explore-search-empty', component: SearchView },
  { path: '/explore/search-results', name: 'explore-search-results', component: SearchView },
  { path: '/explore/content-detail/:id?', name: 'explore-content-detail', component: ContentDetailView },
  { path: '/explore/place-detail/:id?', name: 'explore-place-detail', component: PlaceDetailView },
  { path: '/explore/place/reviews', name: 'place-reviews', component: SimpleListView, meta: { titleKey: 'reviews.title', type: 'reviews' } },
  { path: '/explore/place/review/write', name: 'review-write', component: SimpleListView, meta: { titleKey: 'reviews.writeTitle', type: 'review-write' } },
  { path: '/explore/map', name: 'explore-map', component: MapView },
  { path: '/explore/map/search-recent', name: 'explore-map-search-recent', component: SearchView },
  { path: '/explore/map-search', name: 'explore-map-search', component: PlaceListView },
  { path: '/community', name: 'community', component: CommunityView },
  { path: '/community/post/:id?', name: 'community-post', component: CommunityView },
  { path: '/community/write', name: 'community-write', component: CommunityWriteView },
  { path: '/community/boards', name: 'community-boards', component: CommunityView },
  { path: '/community/drama-board', name: 'community-drama-board', component: CommunityView },
  { path: '/community/search', name: 'community-search', component: CommunityView, meta: { search: true } },
  { path: '/community/edit', name: 'community-edit', component: CommunityWriteView },
  { path: '/users/:userId', name: 'user-profile', component: PublicUserProfileView },
  { path: '/my', name: 'my', component: MyPageView },
  { path: '/my/activity/liked-content', name: 'my-liked-content', component: SimpleListView, meta: { titleKey: 'my.menu.likedContent', type: 'liked-content' } },
  { path: '/my/activity/liked-places', name: 'my-liked-places', component: SimpleListView, meta: { titleKey: 'my.menu.likedPlaces', type: 'liked-places' } },
  { path: '/my/activity/saved-routes', name: 'my-saved-routes', component: SimpleListView, meta: { titleKey: 'my.menu.savedCourses', type: 'saved-routes' } },
  { path: '/my/activity/reviews', name: 'my-reviews', component: SimpleListView, meta: { titleKey: 'my.menu.myReviews', type: 'reviews' } },
  { path: '/my/following', name: 'my-following', component: SimpleListView, meta: { titleKey: 'my.menu.following', type: 'following' } },
  { path: '/my/followers', name: 'my-followers', component: SimpleListView, meta: { titleKey: 'my.menu.followers', type: 'followers' } },
  { path: '/my/visit-planned', name: 'my-visit-planned', component: SimpleListView, meta: { titleKey: 'my.visits.planned', type: 'planned' } },
  { path: '/my/visit-completed', name: 'my-visit-completed', component: SimpleListView, meta: { titleKey: 'my.visits.completed', type: 'completed' } },
  { path: '/my/visit-map', name: 'my-visit-map', component: MapView },
  { path: '/my/course-manage/add-place', name: 'my-course-add-place', component: PlaceListView },
  { path: '/my/course-manage/:routeId/edit', name: 'my-course-edit-with-id', component: CourseEditView },
  { path: '/my/course-manage/edit', name: 'my-course-edit', component: CourseEditView },
  { path: '/my/course-manage/:routeId?', name: 'my-course-manage', component: CourseDetailView },
  { path: '/my/posts', name: 'my-posts', component: SimpleListView, meta: { titleKey: 'my.menu.myPosts', type: 'posts' } },
  { path: '/my/comments', name: 'my-comments', component: SimpleListView, meta: { titleKey: 'my.menu.commentedPosts', type: 'comments' } },
  { path: '/my/scraps', name: 'my-scraps', component: SimpleListView, meta: { titleKey: 'my.menu.scraps', type: 'scraps' } },
  { path: '/my/profile-edit', name: 'my-profile-edit', component: MyProfileEditView },
  { path: '/my/settings', name: 'my-settings', component: SimpleListView, meta: { titleKey: 'settings.title', type: 'settings' } },
  { path: '/notifications', name: 'notifications', component: NotificationsView },
  { path: '/settings', name: 'settings', component: SettingsView },
  { path: '/notice', name: 'notice', component: NoticeListView },
  { path: '/notice/:noticeId', name: 'notice-detail', component: NoticeListView },
  { path: '/admin', redirect: '/admin/contents' },
  { path: '/admin/contents', name: 'admin-contents', component: AdminView },
  { path: '/admin/places', name: 'admin-places', component: AdminView },
  { path: '/:pathMatch(.*)*', redirect: '/home' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const uiStore = useUiStore();
  const hasToken = Boolean(readAccessToken());
  const isPublic = to.matched.some((record) => record.meta.public);

  if (to.name === 'oauth-callback') return true;
  if (isPublic) return true;

  if (!uiStore.currentUser && hasToken && !uiStore.authLoading) {
    await uiStore.syncSessionFromServer();
  }

  if (!uiStore.currentUser && !readAccessToken()) {
    return {
      name: 'splash',
      query: to.fullPath && to.fullPath !== '/' ? { redirect: to.fullPath } : {},
    };
  }

  if (to.name !== 'preferences' && uiStore.currentUser && !uiStore.preferencesCompleted) {
    return {
      name: 'preferences',
      query: to.fullPath && to.fullPath !== '/preferences' ? { redirect: to.fullPath } : {},
    };
  }

  return true;
});

export default router;
