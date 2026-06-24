<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import { uploadPostImage } from '../api/communityApi.js';
import { getUserMessage } from '../api/error.js';
import { useUiStore } from '../stores/uiStore.js';

const MAX_HASHTAGS = 10;
const MAX_POST_IMAGES = 10;
const COURSE_PICKER_PAGE_SIZE = 5;

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const { t } = useI18n();

const boards = [
  { id: 'drama', labelKey: 'content.category.drama', tagKey: 'content.category.drama' },
  { id: 'movie', labelKey: 'content.category.movie', tagKey: 'content.category.movie' },
  { id: 'idol', labelKey: 'content.category.idol', tagKey: 'content.category.idol' },
  { id: 'variety', labelKey: 'content.category.variety', tagKey: 'content.category.variety' },
  { id: 'region', labelKey: 'community.write.boards.region', tagKey: 'my.activity.aiCourse' },
];

const selectedBoard = ref('drama');
const selectedHashtags = ref([]);
const hashtagInput = ref('');
const title = ref('');
const body = ref('');
const imageUrl = ref('');
const selectedImageFiles = ref([]);
const imagePreviewItems = ref([]);
const selectedRouteId = ref('');
const coursePickerOpen = ref(false);
const visibleCourseCount = ref(COURSE_PICKER_PAGE_SIZE);
const posting = ref(false);
const statusNotice = ref(null);

const selectedBoardMeta = computed(() => boards.find((board) => board.id === selectedBoard.value) ?? boards[0]);
const selectedBoardLabel = computed(() => t(selectedBoardMeta.value.labelKey));
const selectedBoardTag = computed(() => t(selectedBoardMeta.value.tagKey));
const canSubmit = computed(() => title.value.trim().length >= 2 && body.value.trim().length >= 5);
const courseOptions = computed(() => uiStore.savedCourses.filter((course) => course?.routeId));
const selectedCourse = computed(() => courseOptions.value.find((course) => course.routeId === selectedRouteId.value) ?? null);
const visibleCourseOptions = computed(() => courseOptions.value.slice(0, Math.min(visibleCourseCount.value, courseOptions.value.length)));
const hasMoreCourseOptions = computed(() => visibleCourseOptions.value.length < courseOptions.value.length);
const selectedAttachmentMetas = computed(() => selectedImageFiles.value.map((file) => ({
  id: imageFileId(file),
  name: file.name,
  type: 'image',
  sizeLabel: Math.max(1, Math.round(file.size / 1024)) + 'KB',
})));
const imagePreviewSources = computed(() => {
  if (imagePreviewItems.value.length) return imagePreviewItems.value;
  const manualUrl = imageUrl.value.trim();
  return manualUrl ? [{ id: 'manual-url', url: manualUrl, name: t('community.write.imageUrl'), manual: true }] : [];
});
const selectedCourseSummary = computed(() => {
  if (!selectedCourse.value) return t('community.write.courseLinkEmptyHelp');
  return [
    selectedCourse.value.region,
    selectedCourse.value.durationDays || selectedCourse.value.duration || t('community.write.scheduleFallback'),
  ].filter(Boolean).join(' / ');
});

onMounted(() => {
  if (uiStore.currentUser) void uiStore.loadSavedCourses();
  restoreDraft();
});

onBeforeUnmount(() => {
  revokeImagePreviews();
});

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function isSystemTag(tag) {
  const systemTags = boards.map((board) => t(board.tagKey));
  return systemTags.includes(tag) || tag === t('my.activity.aiCourse');
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

function restoreDraft() {
  const rawDraft = sessionStorage.getItem('scenik-community-draft');
  if (!rawDraft && !route.query.routeId) return;
  try {
    const draft = rawDraft ? JSON.parse(rawDraft) : {};
    sessionStorage.removeItem('scenik-community-draft');
    selectedBoard.value = draft.board || 'region';
    title.value = draft.title || title.value;
    body.value = draft.body || body.value;
    selectedRouteId.value = draft.routeId || String(route.query.routeId || '');
    selectedHashtags.value = uniqueValues((draft.tags ?? [])
      .map(normalizeHashtag)
      .filter((tag) => tag && !isSystemTag(tag)))
      .slice(0, MAX_HASHTAGS);
  } catch {
    sessionStorage.removeItem('scenik-community-draft');
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

function handleAttachments(event) {
  const incomingFiles = [...(event.target.files ?? [])]
    .filter((file) => file.type.startsWith('image/'));
  event.target.value = '';
  if (!incomingFiles.length) return;

  const existingIds = new Set(selectedImageFiles.value.map(imageFileId));
  const uniqueIncoming = incomingFiles.filter((file) => !existingIds.has(imageFileId(file)));
  const availableSlots = Math.max(0, MAX_POST_IMAGES - selectedImageFiles.value.length);
  const acceptedFiles = uniqueIncoming.slice(0, availableSlots);

  if (uniqueIncoming.length > availableSlots) {
    statusNotice.value = {
      tone: 'warning',
      title: t('community.write.imageLimitTitle'),
      text: t('community.write.imageLimitText'),
    };
  }
  if (!acceptedFiles.length) return;

  selectedImageFiles.value = [...selectedImageFiles.value, ...acceptedFiles];
  imagePreviewItems.value = [
    ...imagePreviewItems.value,
    ...acceptedFiles.map((file) => ({
      id: imageFileId(file),
      url: URL.createObjectURL(file),
      name: file.name,
    })),
  ];
}

function revokeImagePreviews() {
  imagePreviewItems.value.forEach((item) => URL.revokeObjectURL(item.url));
  imagePreviewItems.value = [];
}

function removeSelectedImage(id) {
  const target = imagePreviewItems.value.find((item) => item.id === id);
  if (target) URL.revokeObjectURL(target.url);
  selectedImageFiles.value = selectedImageFiles.value.filter((file) => imageFileId(file) !== id);
  imagePreviewItems.value = imagePreviewItems.value.filter((item) => item.id !== id);
}

function clearManualImageUrl() {
  imageUrl.value = '';
}

async function resolveImagePayload() {
  if (!selectedImageFiles.value.length) {
    const manualUrl = imageUrl.value.trim();
    return {
      imageUrl: manualUrl || null,
      attachments: manualUrl ? [{ url: manualUrl, imageUrl: manualUrl, thumbnailUrl: manualUrl, type: 'image', name: t('community.write.imageUrl') }] : [],
    };
  }

  const uploadedUrls = await Promise.all(selectedImageFiles.value.map((file) => uploadPostImage(file)));
  const attachments = uploadedUrls
    .map((url, index) => ({
      url,
      imageUrl: url,
      thumbnailUrl: url,
      type: 'image',
      name: selectedImageFiles.value[index]?.name || 'image-' + (index + 1),
    }))
    .filter((attachment) => attachment.imageUrl);
  return {
    imageUrl: attachments[0]?.imageUrl ?? null,
    attachments,
  };
}

function buildTags() {
  return uniqueValues([
    selectedBoardTag.value,
    ...selectedHashtags.value,
    selectedCourse.value ? t('my.activity.aiCourse') : '',
    selectedCourse.value?.region ?? uiStore.courseConditions.region,
  ]);
}

async function createPost() {
  if (posting.value) return;
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
      text: getUserMessage(error, t('community.write.uploadFailedText')),
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
        <label class="form-field">
          {{ t('community.write.board') }}
          <div class="write-board-grid">
            <button
              v-for="board in boards"
              :key="board.id"
              type="button"
              :class="{ active: selectedBoard === board.id }"
              @click="selectedBoard = board.id"
            >
              <span>{{ t(board.labelKey) }}</span>
            </button>
          </div>
        </label>

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
            <button type="button" @click="addHashtag()">{{ t('community.write.add') }}</button>
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
          <small>{{ selectedHashtags.length }}/{{ MAX_HASHTAGS }}</small>
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
          <span class="course-dot">AI</span>
          <div>
            <small class="course-kicker">{{ t('community.write.selectedCourse') }}</small>
            <strong>{{ selectedCourse.title }}</strong>
            <small>{{ selectedCourseSummary }}</small>
          </div>
          <button type="button" class="linked-course-clear" @click="clearSelectedCourse">{{ t('community.write.clear') }}</button>
        </div>

        <label class="form-field">
          {{ t('community.write.titleLabel') }}
          <input v-model="title" maxlength="50" :placeholder="t('community.write.titlePlaceholder')" />
        </label>

        <label class="form-field">
          {{ t('community.write.bodyLabel') }}
          <textarea v-model="body" maxlength="500" :placeholder="t('community.write.bodyPlaceholder')"></textarea>
        </label>

        <label class="form-field">
          {{ t('community.write.imageUrl') }}
          <input v-model="imageUrl" type="url" placeholder="https://example.com/photo.jpg" />
          <small>{{ t('community.write.imageUrlHelp') }}</small>
        </label>

        <label class="form-field attachment-field">
          {{ t('community.write.imageFile') }}
          <input type="file" accept="image/*" multiple @change="handleAttachments" />
          <small>{{ t('community.write.imageFileHelp') }}</small>
        </label>

        <div v-if="selectedAttachmentMetas.length" class="attachment-list" :aria-label="t('community.write.attachmentListAria')">
          <span v-for="attachment in selectedAttachmentMetas" :key="attachment.id">
            <b>{{ t('community.write.photo') }}</b>
            {{ attachment.name }}
            <small>{{ attachment.sizeLabel }}</small>
          </span>
        </div>

        <div v-if="imagePreviewSources.length" class="post-image-preview post-image-preview-grid" :aria-label="t('community.write.previewAria')">
          <figure v-for="preview in imagePreviewSources" :key="preview.id">
            <img :src="preview.url" :alt="preview.name" />
            <button type="button" @click="preview.manual ? clearManualImageUrl() : removeSelectedImage(preview.id)">{{ t('community.write.removeSelection') }}</button>
          </figure>
        </div>

        <div class="write-helper">
          <span>{{ body.length }}/500</span>
          <span>{{ selectedBoardLabel }}{{ selectedHashtags.length ? ' / #' + selectedHashtags.join(' #') : '' }}</span>
        </div>
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
              <small>{{ [course.region, course.durationDays || course.duration || t('community.write.scheduleFallback')].filter(Boolean).join(' / ') }}</small>
            </button>
            <button v-if="hasMoreCourseOptions" type="button" class="course-picker-load-more" @click="loadMoreCourseOptions">
              {{ t('common.loadMore') }}
            </button>
          </div>
          <EmptyState
            v-else
            compact
            :title="t('community.write.noSavedCourseTitle')"
            :text="t('community.write.noSavedCourseText')"
          />
          <footer>
            <button type="button" class="button button-secondary" :disabled="!selectedRouteId" @click="clearSelectedCourse">{{ t('community.write.clear') }}</button>
            <button type="button" class="button button-secondary" @click="closeCoursePicker">{{ t('common.close') }}</button>
          </footer>
        </section>
      </div>
    </form>
  </AppLayout>
</template>
