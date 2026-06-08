<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
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
const selectedBoardMeta = computed(() => boards.find((board) => board.id === selectedBoard.value) ?? boards[0]);
const canSubmit = computed(() => title.value.trim().length >= 2 && body.value.trim().length >= 5);

onMounted(() => {
  if (!contentStore.items.length) contentStore.load();
  if (!placeStore.items.length) placeStore.load();
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

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function handleAttachments(event) {
  const files = [...(event.target.files ?? [])]
    .filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
    .slice(0, 6);

  attachments.value = files.map((file) => ({
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    type: file.type.startsWith('video/') ? 'video' : 'image',
    sizeLabel: `${Math.max(1, Math.round(file.size / 1024))}KB`,
  }));
}

async function createPost() {
  const tags = [
    selectedBoardMeta.value.tag,
    selectedPrefix.value,
    uiStore.courseConditions.region,
  ].filter(Boolean);

  const created = await uiStore.createPost({
    title: title.value.trim(),
    body: body.value.trim(),
    prefix: selectedPrefix.value,
    tags,
    region: uiStore.courseConditions.region,
    attachments: attachments.value,
  });

  if (!created) return;
  router.push('/community');
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

        <label class="form-field">
          제목
          <input v-model="title" maxlength="50" placeholder="여행 후기 제목" />
        </label>

        <label class="form-field">
          내용
          <textarea v-model="body" maxlength="500" placeholder="코스 경험을 공유해 주세요"></textarea>
        </label>

        <label class="form-field attachment-field">
          사진/동영상
          <input type="file" accept="image/*,video/*" multiple @change="handleAttachments" />
          <small>최대 6개까지 선택할 수 있습니다. 현재 MVP에서는 파일 이름과 형식만 저장합니다.</small>
        </label>

        <div v-if="attachments.length" class="attachment-list" aria-label="선택한 첨부 파일">
          <span v-for="attachment in attachments" :key="attachment.id">
            <b>{{ attachment.type === 'video' ? '동영상' : '사진' }}</b>
            {{ attachment.name }}
            <small>{{ attachment.sizeLabel }}</small>
          </span>
        </div>

        <div class="write-helper">
          <span>{{ body.length }}/500</span>
          <span>{{ selectedBoardMeta.label }}{{ selectedPrefix ? ` · ${selectedPrefix}` : '' }}</span>
        </div>
      </div>

      <div class="sticky-actions">
        <BaseButton class="course-primary-cta" block :disabled="!canSubmit">
          <span>게시하기</span>
          <small>{{ canSubmit ? '커뮤니티 피드에 바로 등록됩니다' : '제목 2자, 내용 5자 이상 입력해 주세요' }}</small>
        </BaseButton>
      </div>
    </form>
  </AppLayout>
</template>
