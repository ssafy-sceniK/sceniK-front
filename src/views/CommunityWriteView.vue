<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import { uploadPostImage } from '../api/communityApi.js';
import { getUserMessage } from '../api/error.js';
import { useContentStore } from '../stores/contentStore.js';
import { usePlaceStore } from '../stores/placeStore.js';
import { useUiStore } from '../stores/uiStore.js';

const router = useRouter();
const contentStore = useContentStore();
const placeStore = usePlaceStore();
const uiStore = useUiStore();

const boards = [
  { id: 'drama', label: '드라마', tag: '드라마' },
  { id: 'movie', label: '영화', tag: '영화' },
  { id: 'idol', label: '아이돌', tag: '아이돌' },
  { id: 'variety', label: '예능', tag: '예능' },
  { id: 'region', label: '지역별', tag: 'AI 코스' },
];

const selectedBoard = ref('drama');
const selectedPrefix = ref('');
const title = ref('');
const body = ref('');
const attachments = ref([]);
const imageUrl = ref('');
const selectedImageFile = ref(null);
const imagePreviewUrl = ref('');
const selectedRouteId = ref('');
const posting = ref(false);
const statusNotice = ref(null);
const selectedBoardMeta = computed(() => boards.find((board) => board.id === selectedBoard.value) ?? boards[0]);
const canSubmit = computed(() => title.value.trim().length >= 2 && body.value.trim().length >= 5);
const courseOptions = computed(() => uiStore.savedCourses.filter((course) => course?.routeId));
const selectedCourse = computed(() => courseOptions.value.find((course) => course.routeId === selectedRouteId.value) ?? null);
const imagePreviewSource = computed(() => imagePreviewUrl.value || imageUrl.value.trim());

onMounted(() => {
  if (!contentStore.items.length) contentStore.load();
  if (!placeStore.items.length) placeStore.load();
  if (uiStore.currentUser) void uiStore.loadSavedCourses();
});

const prefixOptions = computed(() => {
  if (selectedBoard.value === 'region') {
    return uniqueValues(placeStore.items.map((place) => place.region)).slice(0, 16);
  }

  if (selectedBoard.value === 'idol') {
    return uniqueValues(contentStore.items
      .filter((content) => {
        const haystack = `${content.title} ${content.category} ${content.subcategory} ${(content.tags ?? []).join(' ')} ${content.castNames ?? ''}`;
        return /아이돌|K팝|케이팝|BTS|블랙핑크|팬덤/i.test(haystack);
      })
      .map((content) => content.title)).slice(0, 12);
  }

  const categoryMap = {
    drama: '드라마',
    movie: '영화',
    variety: '예능',
  };

  return uniqueValues(contentStore.items
    .filter((content) => content.category === categoryMap[selectedBoard.value])
    .map((content) => content.title)).slice(0, 12);
});

watch(selectedBoard, () => {
  selectedPrefix.value = '';
});

onBeforeUnmount(() => {
  revokeImagePreview();
});

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function handleAttachments(event) {
  const files = [...(event.target.files ?? [])]
    .filter((file) => file.type.startsWith('image/'));
  const file = files[0] ?? null;

  revokeImagePreview();
  selectedImageFile.value = file;
  attachments.value = file ? [{
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    type: 'image',
    sizeLabel: `${Math.max(1, Math.round(file.size / 1024))}KB`,
  }] : [];
  imagePreviewUrl.value = file ? URL.createObjectURL(file) : '';
  event.target.value = '';
}

function revokeImagePreview() {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value);
  imagePreviewUrl.value = '';
}

function clearSelectedImage() {
  revokeImagePreview();
  selectedImageFile.value = null;
  attachments.value = [];
}

async function resolveImageUrl() {
  if (!selectedImageFile.value) return imageUrl.value.trim() || null;
  return uploadPostImage(selectedImageFile.value);
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

  const tags = [
    selectedBoardMeta.value.tag,
    selectedPrefix.value,
    selectedCourse.value ? 'AI 코스' : '',
    selectedCourse.value?.region ?? uiStore.courseConditions.region,
  ].filter(Boolean);

  posting.value = true;
  statusNotice.value = {
    tone: 'info',
    title: '게시글을 저장하는 중입니다.',
    text: '커뮤니티 피드에 등록할 내용을 backend에 전송하고 있습니다.',
  };
  let resolvedImageUrl = null;
  try {
    resolvedImageUrl = await resolveImageUrl();
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
    prefix: selectedPrefix.value,
    tags,
    region: selectedCourse.value?.region || selectedPrefix.value || uiStore.courseConditions.region,
    duration: selectedCourse.value?.duration ?? selectedCourse.value?.durationDays,
    routeId: selectedRouteId.value || null,
    imageUrl: resolvedImageUrl,
    attachments: attachments.value,
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
        <p>게시판과 말머리를 고르고, 방문한 장면과 이동 팁을 다른 여행자에게 공유해 주세요.</p>
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

        <label class="form-field">
          말머리
          <select v-model="selectedPrefix">
            <option value="">선택 안 함</option>
            <option v-for="option in prefixOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </label>

        <label class="form-field course-select-field">
          AI 코스 연결
          <select v-model="selectedRouteId">
            <option value="">선택 안 함</option>
            <option v-for="course in courseOptions" :key="course.routeId" :value="course.routeId">
              {{ course.title }} · {{ course.region }}
            </option>
          </select>
          <small>저장한 코스를 직접 선택한 경우에만 게시글에 연결됩니다.</small>
        </label>

        <div v-if="selectedCourse" class="linked-course write-linked-course">
          <span class="course-dot">AI</span>
          <div>
            <small class="course-kicker">선택한 AI 코스</small>
            <strong>{{ selectedCourse.title }}</strong>
            <small>{{ selectedCourse.region }} · {{ selectedCourse.durationDays || selectedCourse.duration }}일</small>
          </div>
          <button type="button" class="linked-course-clear" @click="selectedRouteId = ''">해제</button>
        </div>

        <label class="form-field">
          제목
          <input v-model="title" maxlength="50" placeholder="여행 후기 제목" />
        </label>

        <label class="form-field">
          내용
          <textarea v-model="body" maxlength="500" placeholder="코스 경험을 공유해 주세요"></textarea>
        </label>

        <label class="form-field">
          이미지 URL
          <input v-model="imageUrl" type="url" placeholder="https://example.com/photo.jpg" />
          <small>이미지 파일을 선택하면 업로드된 이미지가 URL보다 우선 적용됩니다.</small>
        </label>

        <label class="form-field attachment-field">
          이미지 파일
          <input type="file" accept="image/*" @change="handleAttachments" />
          <small>JPG, PNG, WEBP, GIF 이미지를 5MB 이하로 업로드할 수 있습니다.</small>
        </label>

        <div v-if="attachments.length" class="attachment-list" aria-label="선택한 첨부 파일">
          <span v-for="attachment in attachments" :key="attachment.id">
            <b>사진</b>
            {{ attachment.name }}
            <small>{{ attachment.sizeLabel }}</small>
          </span>
        </div>

        <div v-if="imagePreviewSource" class="post-image-preview" aria-label="게시글 이미지 미리보기">
          <img :src="imagePreviewSource" alt="" />
          <button v-if="selectedImageFile" type="button" @click="clearSelectedImage">선택 해제</button>
        </div>

        <div class="write-helper">
          <span>{{ body.length }}/500</span>
          <span>{{ selectedBoardMeta.label }}{{ selectedPrefix ? ` · ${selectedPrefix}` : '' }}</span>
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
          <small>{{ canSubmit ? '커뮤니티 피드에 바로 등록됩니다' : '제목 2자, 내용 5자 이상 입력해 주세요' }}</small>
        </BaseButton>
      </div>
    </form>
  </AppLayout>
</template>
