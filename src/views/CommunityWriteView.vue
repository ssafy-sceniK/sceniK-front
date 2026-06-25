<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import CommunityBoardAccordion from '../components/community/CommunityBoardAccordion.vue';
import CommunityImageManager from '../components/community/CommunityImageManager.vue';
import { uploadPostImage } from '../api/communityApi.js';
import { getUserMessage } from '../api/error.js';
import { useUiStore } from '../stores/uiStore.js';
import { communityBoardTag, isCommunityBoardTag } from '../utils/communityBoardTags.js';
import { communityImageErrorKind, isCommunityImageCandidateFile, normalizeCommunityImageFile } from '../utils/communityImageFiles.js';
import { formatCourseMetadata } from '../utils/courseMetadata.js';
import { isGenericAiCourseTag, isInternalSystemTag } from '../utils/tags.js';

const MAX_HASHTAGS = 10;
const MAX_POST_IMAGES = 10;
const MAX_POST_BODY_LENGTH = 1000;
const COURSE_PICKER_PAGE_SIZE = 5;
const CREATE_DRAFT_PREFIX = 'community:create:';
const LEGACY_ROUTE_DRAFT_KEY = 'scenik-community-draft';
let createDraftFiles = [];

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const { t } = useI18n();

const boards = [
  { id: 'drama', icon: 'DR', labelKey: 'community.boardLabels.drama.short', fullLabelKey: 'community.boardLabels.drama.full', tagKey: 'content.category.drama' },
  { id: 'movie', icon: 'MV', labelKey: 'community.boardLabels.movie.short', fullLabelKey: 'community.boardLabels.movie.full', tagKey: 'content.category.movie' },
  { id: 'idol', icon: 'ID', labelKey: 'community.boardLabels.idol.short', fullLabelKey: 'community.boardLabels.idol.full', tagKey: 'content.category.idol' },
  { id: 'variety', icon: 'TV', labelKey: 'community.boardLabels.variety.short', fullLabelKey: 'community.boardLabels.variety.full', tagKey: 'content.category.variety' },
  { id: 'region', icon: 'RG', labelKey: 'community.boardLabels.region.short', fullLabelKey: 'community.boardLabels.region.full', tagKey: 'community.write.boards.region' },
];

const selectedBoard = ref('drama');
const selectedHashtags = ref([]);
const hashtagInput = ref('');
const title = ref('');
const body = ref('');
const postImageItems = ref([]);
const selectedRouteId = ref('');
const coursePickerOpen = ref(false);
const visibleCourseCount = ref(COURSE_PICKER_PAGE_SIZE);
const posting = ref(false);
const statusNotice = ref(null);

const boardOptions = computed(() => boards.map((board) => ({
  id: board.id,
  icon: board.icon,
  name: t(board.labelKey),
  description: t(board.fullLabelKey),
})));
const canSubmit = computed(() => title.value.trim().length >= 2 && body.value.trim().length >= 5 && body.value.length <= MAX_POST_BODY_LENGTH);
const courseOptions = computed(() => uiStore.savedCourses.filter((course) => course?.routeId));
const selectedCourse = computed(() => courseOptions.value.find((course) => course.routeId === selectedRouteId.value) ?? null);
const visibleCourseOptions = computed(() => courseOptions.value.slice(0, Math.min(visibleCourseCount.value, courseOptions.value.length)));
const hasMoreCourseOptions = computed(() => visibleCourseOptions.value.length < courseOptions.value.length);
const selectedCourseSummary = computed(() => {
  if (!selectedCourse.value) return t('community.write.courseLinkEmptyHelp');
  return courseSummaryMeta(selectedCourse.value) || t('community.write.selectedCourse');
});

function courseSummaryMeta(course) {
  return formatCourseMetadata(course, t);
}

onMounted(() => {
  if (uiStore.currentUser) void uiStore.loadSavedCourses();
  restoreDraft();
});

onBeforeUnmount(() => {
  persistDraft();
  revokeImagePreviews();
});

watch([
  selectedBoard,
  title,
  body,
  selectedRouteId,
  selectedHashtags,
  postImageItems,
], () => {
  persistDraft();
}, { deep: true });

watch(() => draftUserId(), (userId, previousUserId) => {
  if (previousUserId && userId !== previousUserId) {
    clearDraft(previousUserId);
    selectedBoard.value = 'drama';
    selectedHashtags.value = [];
    hashtagInput.value = '';
    title.value = '';
    body.value = '';
    selectedRouteId.value = '';
    revokeImagePreviews();
  }
});


function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function isSystemTag(tag) {
  const systemTags = boards.map((board) => t(board.tagKey));
  return isInternalSystemTag(tag) || systemTags.includes(tag) || isCommunityBoardTag(tag) || isGenericAiCourseTag(tag);
}

function normalizeHashtag(value) {
  return String(value ?? '').trim().replace(/^#+/, '').replace(/[\s,]+$/g, '').trim();
}

function hashtagText(rawValue, fallbackValue) {
  return typeof rawValue === 'string' ? rawValue : fallbackValue;
}

function addHashtag(rawValue = hashtagInput.value) {
  const tag = normalizeHashtag(hashtagText(rawValue, hashtagInput.value));
  hashtagInput.value = '';
  if (!tag) return;
  if (selectedHashtags.value.includes(tag)) return;
  if (selectedHashtags.value.length >= MAX_HASHTAGS) {
    statusNotice.value = {
      tone: 'warning',
      title: t('community.write.hashtagLimitTitle'),
      text: t('community.write.hashtagLimitText'),
    };
    return;
  }
  selectedHashtags.value = [...selectedHashtags.value, tag];
}

function handleHashtagKeydown(event) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault();
    addHashtag();
  }
}

function removeHashtag(tag) {
  selectedHashtags.value = selectedHashtags.value.filter((item) => item !== tag);
}

function hasDraftContent() {
  return Boolean(
    title.value.trim()
    || body.value.trim()
    || selectedRouteId.value
    || selectedHashtags.value.length
    || postImageItems.value.length
    || selectedBoard.value !== 'drama'
  );
}

function draftUserId() {
  return String(uiStore.currentUser?.userId ?? uiStore.currentUser?.email ?? '').trim();
}

function createDraftKey(userId = draftUserId()) {
  return userId ? `${CREATE_DRAFT_PREFIX}${userId}` : '';
}

function isBackNavigationEntry() {
  return typeof window !== 'undefined' && Boolean(window.history?.state?.forward);
}

function shouldRestoreStoredDraft() {
  if (typeof sessionStorage === 'undefined') return false;
  return Boolean(route.query.routeId || sessionStorage.getItem(LEGACY_ROUTE_DRAFT_KEY) || isBackNavigationEntry());
}

function draftPayload() {
  return {
    userId: draftUserId(),
    board: selectedBoard.value,
    title: title.value,
    body: body.value,
    routeId: selectedRouteId.value,
    tags: selectedHashtags.value,
    updatedAt: Date.now(),
  };
}

function persistDraft() {
  if (typeof sessionStorage === 'undefined') return;
  const draftKey = createDraftKey();
  if (!draftKey) return;
  createDraftFiles = postImageItems.value
    .filter((item) => item.kind === 'new' && item.file)
    .map((item) => item.file);
  if (!hasDraftContent()) {
    sessionStorage.removeItem(draftKey);
    createDraftFiles = [];
    return;
  }
  sessionStorage.setItem(draftKey, JSON.stringify(draftPayload()));
}

function clearDraft(userId = draftUserId()) {
  if (typeof sessionStorage !== 'undefined') {
    const draftKey = createDraftKey(userId);
    if (draftKey) sessionStorage.removeItem(draftKey);
    sessionStorage.removeItem(LEGACY_ROUTE_DRAFT_KEY);
  }
  createDraftFiles = [];
}

function restoreDraft() {
  if (typeof sessionStorage === 'undefined') return;
  const userId = draftUserId();
  if (!userId) {
    sessionStorage.removeItem(LEGACY_ROUTE_DRAFT_KEY);
    return;
  }
  if (!shouldRestoreStoredDraft()) {
    clearDraft(userId);
    return;
  }
  const draftKey = createDraftKey(userId);
  const legacyDraft = sessionStorage.getItem(LEGACY_ROUTE_DRAFT_KEY);
  const rawDraft = sessionStorage.getItem(draftKey) || legacyDraft;
  if (!rawDraft && !route.query.routeId) return;
  try {
    const draft = rawDraft ? JSON.parse(rawDraft) : {};
    if (draft.userId && String(draft.userId) !== userId) {
      clearDraft(userId);
      return;
    }
    if (legacyDraft) {
      sessionStorage.removeItem(LEGACY_ROUTE_DRAFT_KEY);
    }
    selectedBoard.value = draft.board || (draft.routeId || route.query.routeId ? 'region' : 'drama');
    title.value = draft.title || title.value;
    body.value = draft.body || body.value;
    selectedRouteId.value = draft.routeId || String(route.query.routeId || '');
    selectedHashtags.value = uniqueValues((draft.tags ?? [])
      .map(normalizeHashtag)
      .filter((tag) => tag && !isSystemTag(tag)))
      .slice(0, MAX_HASHTAGS);
    if (createDraftFiles.length) {
      postImageItems.value = createDraftFiles.map(createPostImageItem);
    }
  } catch {
    clearDraft(userId);
  }
}

function openCoursePicker() {
  if (uiStore.currentUser) void uiStore.loadSavedCourses();
  const selectedIndex = courseOptions.value.findIndex((course) => course.routeId === selectedRouteId.value);
  visibleCourseCount.value = Math.max(COURSE_PICKER_PAGE_SIZE, selectedIndex + 1);
  coursePickerOpen.value = true;
}

function closeCoursePicker() {
  coursePickerOpen.value = false;
}

function selectCourse(routeId) {
  selectedRouteId.value = routeId;
  closeCoursePicker();
}

function clearSelectedCourse() {
  selectedRouteId.value = '';
}

function loadMoreCourseOptions() {
  visibleCourseCount.value = Math.min(courseOptions.value.length, visibleCourseCount.value + COURSE_PICKER_PAGE_SIZE);
}

function imageFileId(file) {
  return file.name + '-' + file.size + '-' + file.lastModified;
}

function createPostImageItem(file) {
  const id = imageFileId(file);
  return {
    localKey: `new-${id}`,
    kind: 'new',
    file,
    previewUrl: URL.createObjectURL(file),
    name: file.name,
    isImage: true,
  };
}

async function normalizeSelectedImageFiles(files, noticeRef) {
  const imageFiles = Array.from(files).filter(isCommunityImageCandidateFile);
  if (!imageFiles.length) return [];
  try {
    return await Promise.all(imageFiles.map(normalizeCommunityImageFile));
  } catch (error) {
    const errorKind = communityImageErrorKind(error);
    noticeRef.value = {
      tone: 'warning',
      title: t('community.write.imageValidationTitle'),
      text: errorKind === 'size'
        ? t('community.write.imageSizeErrorText')
        : t('community.write.imageTypeErrorText'),
    };
    return [];
  }
}

function uploadFailureMessage(error) {
  if (!error?.response || error.response.status >= 500) {
    return t('community.write.uploadFailedText');
  }
  return getUserMessage(error, t('community.write.uploadFailedText'));
}

async function handleAttachments(files = []) {
  const incomingFiles = await normalizeSelectedImageFiles(files, statusNotice);
  if (!incomingFiles.length) return;

  const existingIds = new Set(postImageItems.value
    .filter((item) => item.kind === 'new' && item.file)
    .map((item) => imageFileId(item.file)));
  const uniqueIncoming = incomingFiles.filter((file) => !existingIds.has(imageFileId(file)));
  const availableSlots = Math.max(0, MAX_POST_IMAGES - postImageItems.value.length);
  const acceptedFiles = uniqueIncoming.slice(0, availableSlots);

  if (uniqueIncoming.length > availableSlots) {
    statusNotice.value = {
      tone: 'warning',
      title: t('community.write.imageLimitTitle'),
      text: t('community.write.imageLimitText'),
    };
  }
  if (!acceptedFiles.length) return;

  postImageItems.value = [
    ...postImageItems.value,
    ...acceptedFiles.map(createPostImageItem),
  ];
}

function revokeImagePreviews() {
  postImageItems.value.forEach((item) => {
    if (item.kind === 'new' && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
  postImageItems.value = [];
}

function removeSelectedImage(localKey) {
  const target = postImageItems.value.find((item) => item.localKey === localKey);
  if (target?.kind === 'new' && target.previewUrl) URL.revokeObjectURL(target.previewUrl);
  postImageItems.value = postImageItems.value.filter((item) => item.localKey !== localKey);
}


async function resolveImagePayload() {
  if (!postImageItems.value.length) {
    return {
      imageUrl: null,
      attachments: [],
    };
  }

  const uploadedUrls = await Promise.all(postImageItems.value.map((item) => uploadPostImage(item.file)));
  const attachments = uploadedUrls
    .map((url, index) => ({
      url,
      imageUrl: url,
      thumbnailUrl: url,
      type: 'image',
      name: postImageItems.value[index]?.name || postImageItems.value[index]?.file?.name || 'image-' + (index + 1),
    }))
    .filter((attachment) => attachment.imageUrl);
  return {
    imageUrl: attachments[0]?.imageUrl ?? null,
    attachments,
  };
}

function buildTags() {
  return uniqueValues([
    communityBoardTag(selectedBoard.value),
    ...selectedHashtags.value,
    selectedCourse.value?.region ?? uiStore.courseConditions.region,
  ]);
}

async function createPost() {
  if (posting.value) return;
  if (body.value.length > MAX_POST_BODY_LENGTH) {
    statusNotice.value = {
      tone: 'warning',
      title: t('community.write.contentLimitTitle'),
      text: t('community.write.contentLimitText'),
    };
    return;
  }

  if (!canSubmit.value) {
    statusNotice.value = {
      tone: 'warning',
      title: t('community.write.validationTitle'),
      text: t('community.write.validationText'),
    };
    return;
  }

  posting.value = true;
  statusNotice.value = {
    tone: 'info',
    title: t('community.write.saveProgressTitle'),
    text: t('community.write.saveProgressText'),
  };

  let imagePayload;
  try {
    imagePayload = await resolveImagePayload();
  } catch (error) {
    posting.value = false;
    statusNotice.value = {
      tone: 'error',
      title: t('community.write.uploadFailedTitle'),
      text: uploadFailureMessage(error),
    };
    return;
  }

  const created = await uiStore.createPost({
    title: title.value.trim(),
    body: body.value.trim(),
    tags: buildTags(),
    region: selectedCourse.value?.region || selectedHashtags.value[0] || uiStore.courseConditions.region,
    duration: selectedCourse.value?.duration ?? selectedCourse.value?.durationDays,
    routeId: selectedRouteId.value || null,
    imageUrl: imagePayload.imageUrl,
    attachments: imagePayload.attachments,
  });

  posting.value = false;
  if (!created) {
    statusNotice.value = {
      tone: 'error',
      title: t('community.write.createFailedTitle'),
      text: uiStore.communityError || t('community.write.createFailedText'),
    };
    return;
  }
  clearDraft();
  title.value = '';
  body.value = '';
  selectedHashtags.value = [];
  selectedRouteId.value = '';
  selectedBoard.value = 'drama';
  revokeImagePreviews();
  statusNotice.value = {
    tone: 'success',
    title: t('community.write.savedTitle'),
    text: t('community.write.savedText'),
  };
  window.setTimeout(() => router.push('/community'), 450);
}
</script>

<template>
  <AppLayout :title="t('community.write.pageTitle')" back>
    <section v-if="!uiStore.currentUser" class="community-write-screen">
      <EmptyState
        icon="K"
        tone="login"
        :title="t('common.loginRequired')"
        :text="t('community.write.loginText')"
        :action-label="t('auth.login.title')"
        action-to="/login"
      />
    </section>

    <form v-else class="community-write-screen" @submit.prevent="createPost">
      <div class="write-intro">
        <h1>{{ t('community.write.heading') }}</h1>
        <p>{{ t('community.write.description') }}</p>
      </div>

      <div class="write-card">
        <div class="form-field">
          <span>{{ t('community.write.board') }}</span>
          <CommunityBoardAccordion
            v-model="selectedBoard"
            :boards="boardOptions"
            :aria-label="t('community.write.board')"
          />
        </div>

        <div class="form-field hashtag-editor-field">
          <span>{{ t('community.write.hashtag') }}</span>
          <div class="hashtag-input-row">
            <span aria-hidden="true">#</span>
            <input
              v-model="hashtagInput"
              type="text"
              maxlength="24"
              :placeholder="t('community.write.tagPlaceholder')"
              @keydown="handleHashtagKeydown"
            />
            <button type="button" :aria-label="t('community.write.addHashtag')" :title="t('community.write.addHashtag')" @click="addHashtag()">+</button>
          </div>
          <div v-if="selectedHashtags.length" class="chip-row wrap write-hashtag-row selected-hashtag-row">
            <button
              v-for="tag in selectedHashtags"
              :key="tag"
              type="button"
              class="chip selected"
              :aria-label="t('community.write.removeHashtagAria', { tag })"
              @click="removeHashtag(tag)"
            >
              #{{ tag }} <span aria-hidden="true">x</span>
            </button>
          </div>
        </div>

        <div class="form-field course-select-field">
          <span>{{ t('community.write.courseLink') }}</span>
          <button type="button" class="course-picker-trigger" @click="openCoursePicker">
            <span class="course-picker-copy">
              <strong>{{ selectedCourse ? selectedCourse.title : t('community.write.noneSelected') }}</strong>
              <small>{{ selectedCourseSummary }}</small>
            </span>
            <span class="course-picker-chevron" aria-hidden="true">&rsaquo;</span>
          </button>
          <small>{{ t('community.write.courseLinkHelp') }}</small>
        </div>

        <div v-if="selectedCourse" class="linked-course write-linked-course">
          <div>
            <small class="course-kicker">{{ t('community.write.selectedCourse') }}</small>
            <strong>{{ selectedCourse.title }}</strong>
            <small>{{ selectedCourseSummary }}</small>
          </div>
          <div class="linked-course-action-row">
            <button type="button" class="linked-course-clear" @click="openCoursePicker">{{ t('community.write.changeCourse') }}</button>
            <button type="button" class="linked-course-clear" @click="clearSelectedCourse">{{ t('community.write.unlinkCourse') }}</button>
          </div>
        </div>

        <label class="form-field">
          {{ t('community.write.titleLabel') }}
          <input v-model="title" maxlength="50" :placeholder="t('community.write.titlePlaceholder')" />
        </label>

        <label class="form-field">
          {{ t('community.write.bodyLabel') }}
          <textarea v-model="body" :maxlength="MAX_POST_BODY_LENGTH" :placeholder="t('community.write.bodyPlaceholder')"></textarea>
        </label>

        <CommunityImageManager
          v-model="postImageItems"
          :max="MAX_POST_IMAGES"
          :title="t('community.write.imageFile')"
          :help="t('community.write.imageFileHelp')"
          :add-label="t('community.imageManager.addImages')"
          :add-help="t('community.imageManager.dropHint')"
          :drag-hint="t('community.imageManager.dragHint')"
          :remove-label="t('community.edit.removeImage')"
          :new-badge="t('community.edit.newImageBadge')"
          :representative-label="t('community.imageManager.representative')"
          :existing-alt="t('community.edit.existingImageAlt', { index: '{index}' })"
          :new-alt="t('community.edit.newImageAlt', { index: '{index}' })"
          :reorder-label="t('community.imageManager.reorderImage')"
          :empty-text="t('community.imageManager.empty')"
          input-id-prefix="community-write"
          @add-files="handleAttachments"
          @remove="removeSelectedImage"
        />
      </div>

      <FormStatusNotice
        v-if="statusNotice"
        :tone="statusNotice.tone"
        :title="statusNotice.title"
        :text="statusNotice.text"
      />

      <div class="sticky-actions">
        <BaseButton class="course-primary-cta" block :disabled="!canSubmit || posting">
          <span>{{ posting ? t('community.write.submitting') : t('community.write.submit') }}</span>
          <small>{{ canSubmit ? t('community.write.submitReady') : t('community.write.submitDisabled') }}</small>
        </BaseButton>
      </div>

      <div v-if="coursePickerOpen" class="course-picker-backdrop" @click.self="closeCoursePicker">
        <section class="course-picker-modal" role="dialog" aria-modal="true" aria-labelledby="course-picker-title" @click.stop>
          <header>
            <div>
              <h2 id="course-picker-title">{{ t('community.write.coursePickerTitle') }}</h2>
              <p>{{ t('community.write.coursePickerDescription') }}</p>
            </div>
            <button type="button" :aria-label="t('common.close')" @click="closeCoursePicker">x</button>
          </header>
          <div v-if="courseOptions.length" class="course-picker-list">
            <button
              v-for="course in visibleCourseOptions"
              :key="course.routeId"
              type="button"
              class="course-picker-option"
              :class="{ selected: selectedRouteId === course.routeId }"
              @click="selectCourse(course.routeId)"
            >
              <strong>{{ course.title }}</strong>
              <small>{{ courseSummaryMeta(course) }}</small>
            </button>
            <button v-if="hasMoreCourseOptions" type="button" class="course-picker-load-more" @click="loadMoreCourseOptions">
              {{ t('common.loadMore') }}
            </button>
          </div>
          <EmptyState
            v-else
            class="course-picker-empty-state"
            tone="route"
            :show-visual="false"
            compact
            :title="t('community.write.noSavedCourseTitle')"
            :text="t('community.write.noSavedCourseText')"
            :action-label="t('community.write.createAiCourse')"
            action-to="/ai"
            :secondary-label="t('common.close')"
            @secondary="closeCoursePicker"
          />
          <footer>
            <button type="button" class="button button-secondary" :disabled="!selectedRouteId" @click="clearSelectedCourse">{{ t('community.write.unlinkCourse') }}</button>
            <button type="button" class="button button-secondary" @click="closeCoursePicker">{{ t('common.close') }}</button>
          </footer>
        </section>
      </div>
    </form>
  </AppLayout>
</template>
