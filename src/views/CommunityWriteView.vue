<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
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

const boards = [
  { id: 'drama', label: '드라마', tag: '드라마' },
  { id: 'movie', label: '영화', tag: '영화' },
  { id: 'idol', label: '아이돌', tag: '아이돌' },
  { id: 'variety', label: '예능', tag: '예능' },
  { id: 'region', label: '지역별', tag: 'AI 코스' },
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
const canSubmit = computed(() => title.value.trim().length >= 2 && body.value.trim().length >= 5);
const courseOptions = computed(() => uiStore.savedCourses.filter((course) => course?.routeId));
const selectedCourse = computed(() => courseOptions.value.find((course) => course.routeId === selectedRouteId.value) ?? null);
const visibleCourseOptions = computed(() => courseOptions.value.slice(0, Math.min(visibleCourseCount.value, courseOptions.value.length)));
const hasMoreCourseOptions = computed(() => visibleCourseOptions.value.length < courseOptions.value.length);
const selectedAttachmentMetas = computed(() => selectedImageFiles.value.map((file) => ({
  id: imageFileId(file),
  name: file.name,
  type: 'image',
  sizeLabel: `${Math.max(1, Math.round(file.size / 1024))}KB`,
})));
const imagePreviewSources = computed(() => {
  if (imagePreviewItems.value.length) return imagePreviewItems.value;
  const manualUrl = imageUrl.value.trim();
  return manualUrl ? [{ id: 'manual-url', url: manualUrl, name: '이미지 URL', manual: true }] : [];
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
  return boards.some((board) => board.tag === tag) || tag === 'AI 코스';
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
      title: '해시태그는 최대 10개까지 추가할 수 있습니다.',
      text: '불필요한 태그를 삭제한 뒤 다시 추가해 주세요.',
    };
    return;
  }
  selectedHashtags.value = [...selectedHashtags.value, tag];
}

function handleHashtagKeydown(event) {
  if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
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
  return `${file.name}-${file.size}-${file.lastModified}`;
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
      title: '이미지는 최대 10개까지 첨부할 수 있습니다.',
      text: '먼저 선택된 이미지를 삭제한 뒤 추가해 주세요.',
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
      attachments: manualUrl ? [{ url: manualUrl, imageUrl: manualUrl, thumbnailUrl: manualUrl, type: 'image', name: '이미지 URL' }] : [],
    };
  }

  const uploadedUrls = await Promise.all(selectedImageFiles.value.map((file) => uploadPostImage(file)));
  const attachments = uploadedUrls
    .map((url, index) => ({
      url,
      imageUrl: url,
      thumbnailUrl: url,
      type: 'image',
      name: selectedImageFiles.value[index]?.name || `image-${index + 1}`,
    }))
    .filter((attachment) => attachment.imageUrl);
  return {
    imageUrl: attachments[0]?.imageUrl ?? null,
    attachments,
  };
}

function buildTags() {
  return uniqueValues([
    selectedBoardMeta.value.tag,
    ...selectedHashtags.value,
    selectedCourse.value ? 'AI 코스' : '',
    selectedCourse.value?.region ?? uiStore.courseConditions.region,
  ]);
}

async function createPost() {
  if (posting.value) return;
  if (!canSubmit.value) {
    statusNotice.value = {
      tone: 'warning',
      title: '입력 내용을 확인해 주세요.',
      text: '제목은 2자 이상, 내용은 5자 이상 입력해야 게시할 수 있습니다.',
    };
    return;
  }

  posting.value = true;
  statusNotice.value = {
    tone: 'info',
    title: '게시글을 저장하는 중입니다.',
    text: '커뮤니티 피드에 등록할 내용을 backend에 전송하고 있습니다.',
  };

  let imagePayload;
  try {
    imagePayload = await resolveImagePayload();
  } catch (error) {
    posting.value = false;
    statusNotice.value = {
      tone: 'error',
      title: '이미지를 업로드하지 못했습니다.',
      text: getUserMessage(error, '이미지를 업로드하지 못했습니다. 5MB 이하의 JPG, PNG, WEBP, GIF 이미지를 선택해 주세요.'),
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
      title: '게시글을 작성하지 못했습니다.',
      text: uiStore.communityError || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    };
    return;
  }
  statusNotice.value = {
    tone: 'success',
    title: '저장되었습니다.',
    text: '게시글이 커뮤니티 피드에 등록되었습니다.',
  };
  window.setTimeout(() => router.push('/community'), 450);
}
</script>

<template>
  <AppLayout title="글 작성" back>
    <section v-if="!uiStore.currentUser" class="community-write-screen">
      <EmptyState
        icon="K"
        tone="login"
        title="로그인이 필요합니다"
        text="커뮤니티에 여행 후기를 남기려면 먼저 로그인해 주세요."
        action-label="로그인하기"
        action-to="/login"
      />
    </section>

    <form v-else class="community-write-screen" @submit.prevent="createPost">
      <div class="write-intro">
        <h1>커뮤니티 글 작성</h1>
        <p>게시판과 해시태그를 고르고 방문 기록과 이동 팁을 다른 여행자에게 공유해 주세요.</p>
      </div>

      <div class="write-card">
        <label class="form-field">
          게시판
          <div class="write-board-grid">
            <button
              v-for="board in boards"
              :key="board.id"
              type="button"
              :class="{ active: selectedBoard === board.id }"
              @click="selectedBoard = board.id"
            >
              <span>{{ board.label }}</span>
            </button>
          </div>
        </label>

        <div class="form-field hashtag-editor-field">
          <span>해시태그</span>
          <div class="hashtag-input-row">
            <span aria-hidden="true">#</span>
            <input
              v-model="hashtagInput"
              type="text"
              maxlength="24"
              placeholder="태그 입력"
              @keydown="handleHashtagKeydown"
              @blur="addHashtag()"
            />
            <button type="button" @click="addHashtag()">추가</button>
          </div>
          <div v-if="selectedHashtags.length" class="chip-row wrap write-hashtag-row selected-hashtag-row">
            <button
              v-for="tag in selectedHashtags"
              :key="tag"
              type="button"
              class="chip selected"
              :aria-label="`${tag} 해시태그 삭제`"
              @click="removeHashtag(tag)"
            >
              #{{ tag }} <span aria-hidden="true">×</span>
            </button>
          </div>
          <small>{{ selectedHashtags.length }}/{{ MAX_HASHTAGS }}</small>
        </div>

        <div class="form-field course-select-field">
          <span>AI 코스 연결</span>
          <button type="button" class="course-picker-trigger" @click="openCoursePicker">
            <span class="course-picker-copy">
              <strong>{{ selectedCourse ? selectedCourse.title : '선택 안 함' }}</strong>
              <small>{{ selectedCourse ? `${selectedCourse.region} · ${selectedCourse.durationDays || selectedCourse.duration || '일정'}` : '저장한 AI 코스를 게시글에 연결할 수 있습니다.' }}</small>
            </span>
            <span class="course-picker-chevron" aria-hidden="true">›</span>
          </button>
          <small>선택한 코스는 게시글 상세에서 바로 열 수 있습니다.</small>
        </div>

        <div v-if="selectedCourse" class="linked-course write-linked-course">
          <span class="course-dot">AI</span>
          <div>
            <small class="course-kicker">선택한 AI 코스</small>
            <strong>{{ selectedCourse.title }}</strong>
            <small>{{ selectedCourse.region }} · {{ selectedCourse.durationDays || selectedCourse.duration }}</small>
          </div>
          <button type="button" class="linked-course-clear" @click="clearSelectedCourse">해제</button>
        </div>

        <label class="form-field">
          제목
          <input v-model="title" maxlength="50" placeholder="여행 후기 제목" />
        </label>

        <label class="form-field">
          내용
          <textarea v-model="body" maxlength="500" placeholder="코스 경험을 공유해 주세요."></textarea>
        </label>

        <label class="form-field">
          이미지 URL
          <input v-model="imageUrl" type="url" placeholder="https://example.com/photo.jpg" />
          <small>이미지 파일을 선택하면 업로드된 이미지가 URL보다 우선 적용됩니다.</small>
        </label>

        <label class="form-field attachment-field">
          이미지 파일
          <input type="file" accept="image/*" multiple @change="handleAttachments" />
          <small>JPG, PNG, WEBP, GIF 이미지를 최대 10개까지 업로드할 수 있습니다.</small>
        </label>

        <div v-if="selectedAttachmentMetas.length" class="attachment-list" aria-label="선택한 첨부 파일">
          <span v-for="attachment in selectedAttachmentMetas" :key="attachment.id">
            <b>사진</b>
            {{ attachment.name }}
            <small>{{ attachment.sizeLabel }}</small>
          </span>
        </div>

        <div v-if="imagePreviewSources.length" class="post-image-preview post-image-preview-grid" aria-label="게시글 이미지 미리보기">
          <figure v-for="preview in imagePreviewSources" :key="preview.id">
            <img :src="preview.url" :alt="preview.name" />
            <button type="button" @click="preview.manual ? clearManualImageUrl() : removeSelectedImage(preview.id)">선택 해제</button>
          </figure>
        </div>

        <div class="write-helper">
          <span>{{ body.length }}/500</span>
          <span>{{ selectedBoardMeta.label }}{{ selectedHashtags.length ? ` · #${selectedHashtags.join(' #')}` : '' }}</span>
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
          <span>{{ posting ? '게시 중...' : '게시하기' }}</span>
          <small>{{ canSubmit ? '커뮤니티 피드에 바로 등록합니다.' : '제목 2자, 내용 5자 이상 입력해 주세요.' }}</small>
        </BaseButton>
      </div>

      <div v-if="coursePickerOpen" class="course-picker-backdrop" @click.self="closeCoursePicker">
        <section class="course-picker-modal" role="dialog" aria-modal="true" aria-labelledby="course-picker-title" @click.stop>
          <header>
            <div>
              <h2 id="course-picker-title">AI 코스 선택</h2>
              <p>게시글에 연결할 저장 코스를 선택해 주세요.</p>
            </div>
            <button type="button" aria-label="닫기" @click="closeCoursePicker">×</button>
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
              <small>{{ course.region }} · {{ course.durationDays || course.duration || '일정' }}</small>
            </button>
            <button v-if="hasMoreCourseOptions" type="button" class="course-picker-load-more" @click="loadMoreCourseOptions">
              더 보기
            </button>
          </div>
          <EmptyState
            v-else
            compact
            title="저장한 AI 코스가 없습니다"
            text="AI 코스를 만든 뒤 저장하면 게시글에 연결할 수 있습니다."
          />
          <footer>
            <button type="button" class="button button-secondary" :disabled="!selectedRouteId" @click="clearSelectedCourse">선택 해제</button>
            <button type="button" class="button button-secondary" @click="closeCoursePicker">닫기</button>
          </footer>
        </section>
      </div>
    </form>
  </AppLayout>
</template>