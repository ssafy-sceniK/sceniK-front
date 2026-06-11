<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import {
  createAdminContent,
  createAdminPlace,
  deleteAdminContent,
  deleteAdminPlace,
  fetchAdminContents,
  fetchAdminPlaces,
  updateAdminContent,
  updateAdminPlace,
} from '../api/adminApi.js';
import { getUserMessage } from '../api/error.js';
import { readAccessToken } from '../api/authApi.js';
import { useUiStore } from '../stores/uiStore.js';

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();

const contents = ref([]);
const places = ref([]);
const loading = ref(false);
const saving = ref(false);
const deletingId = ref('');
const status = ref({ tone: 'info', title: '', text: '' });
const editingContentId = ref('');
const editingPlaceId = ref('');

const activeTab = computed(() => (route.path.includes('/places') ? 'places' : 'contents'));
const isAdmin = computed(() => uiStore.currentUser?.role === 'ROLE_ADMIN');
const hasToken = computed(() => Boolean(readAccessToken()));

const contentForm = ref(createContentDefaults());
const placeForm = ref(createPlaceDefaults());

onMounted(async () => {
  if (hasToken.value && !uiStore.currentUser) {
    await uiStore.syncSessionFromServer();
  }
  if (isAdmin.value) {
    await loadAdminData();
  }
});

watch(isAdmin, (value) => {
  if (value) loadAdminData();
});

function createContentDefaults() {
  return {
    contentId: `C_ADMIN_${Date.now()}`,
    title: '',
    category: '드라마',
    subcategory: 'K-Content',
    releaseYear: new Date().getFullYear(),
    status: 'ACTIVE',
    description: '',
    castNames: '',
    thumbnailUrl: '',
    isPopular: false,
    country: 'Korea',
    ottPlatform: '',
    tagsText: '관리자,CRUD',
  };
}

function createPlaceDefaults() {
  return {
    placeId: `P_ADMIN_${Date.now()}`,
    placeName: '',
    address: '',
    region: '서울',
    district: '',
    category: '촬영지',
    description: '',
    openingHours: '',
    closedDays: '',
    phoneNumber: '',
    imageUrl: '',
    indoorOutdoor: 'mixed',
    parkingAvailable: false,
    latitude: '',
    longitude: '',
  };
}

function resetContentForm() {
  contentForm.value = createContentDefaults();
  editingContentId.value = '';
}

function resetPlaceForm() {
  placeForm.value = createPlaceDefaults();
  editingPlaceId.value = '';
}

function setStatus(tone, title, text = '') {
  status.value = { tone, title, text };
}

async function loadAdminData() {
  loading.value = true;
  try {
    const [contentItems, placeItems] = await Promise.all([
      fetchAdminContents(),
      fetchAdminPlaces(),
    ]);
    contents.value = contentItems;
    places.value = placeItems;
    if (!status.value.title) {
      setStatus('info', '관리자 CRUD를 검증할 수 있습니다.', '콘텐츠와 장소 생성, 수정, 삭제 요청은 ROLE_ADMIN 계정에서만 성공합니다.');
    }
  } catch (error) {
    setStatus('error', '관리 데이터 로딩 실패', getUserMessage(error, '관리 데이터를 불러오지 못했습니다.'));
  } finally {
    loading.value = false;
  }
}

function contentPayload() {
  return {
    contentId: contentForm.value.contentId.trim(),
    title: contentForm.value.title.trim(),
    category: contentForm.value.category.trim(),
    subcategory: contentForm.value.subcategory.trim(),
    releaseYear: numberOrNull(contentForm.value.releaseYear),
    status: contentForm.value.status.trim() || 'ACTIVE',
    description: contentForm.value.description.trim(),
    castNames: contentForm.value.castNames.trim(),
    thumbnailUrl: contentForm.value.thumbnailUrl.trim(),
    isPopular: Boolean(contentForm.value.isPopular),
    country: contentForm.value.country.trim() || 'Korea',
    ottPlatform: contentForm.value.ottPlatform.trim(),
    tags: splitTags(contentForm.value.tagsText),
  };
}

function placePayload() {
  return {
    placeId: placeForm.value.placeId.trim(),
    placeName: placeForm.value.placeName.trim(),
    address: placeForm.value.address.trim(),
    region: placeForm.value.region.trim(),
    district: placeForm.value.district.trim(),
    category: placeForm.value.category.trim(),
    description: placeForm.value.description.trim(),
    openingHours: placeForm.value.openingHours.trim(),
    closedDays: placeForm.value.closedDays.trim(),
    phoneNumber: placeForm.value.phoneNumber.trim(),
    imageUrl: placeForm.value.imageUrl.trim(),
    indoorOutdoor: placeForm.value.indoorOutdoor.trim(),
    parkingAvailable: Boolean(placeForm.value.parkingAvailable),
    latitude: numberOrNull(placeForm.value.latitude),
    longitude: numberOrNull(placeForm.value.longitude),
  };
}

async function saveContent() {
  saving.value = true;
  try {
    const payload = contentPayload();
    if (editingContentId.value) {
      await updateAdminContent(editingContentId.value, payload);
      setStatus('success', '콘텐츠를 수정했습니다.', `${payload.contentId} 변경 사항이 저장되었습니다.`);
    } else {
      await createAdminContent(payload);
      setStatus('success', '콘텐츠를 생성했습니다.', `${payload.contentId} 항목이 추가되었습니다.`);
    }
    resetContentForm();
    await loadAdminData();
  } catch (error) {
    setStatus('error', '콘텐츠 저장 실패', getUserMessage(error, '콘텐츠를 저장하지 못했습니다.'));
  } finally {
    saving.value = false;
  }
}

async function savePlace() {
  saving.value = true;
  try {
    const payload = placePayload();
    if (editingPlaceId.value) {
      await updateAdminPlace(editingPlaceId.value, payload);
      setStatus('success', '장소를 수정했습니다.', `${payload.placeId} 변경 사항이 저장되었습니다.`);
    } else {
      await createAdminPlace(payload);
      setStatus('success', '장소를 생성했습니다.', `${payload.placeId} 항목이 추가되었습니다.`);
    }
    resetPlaceForm();
    await loadAdminData();
  } catch (error) {
    setStatus('error', '장소 저장 실패', getUserMessage(error, '장소를 저장하지 못했습니다.'));
  } finally {
    saving.value = false;
  }
}

function editContent(content) {
  editingContentId.value = content.contentId;
  contentForm.value = {
    contentId: content.contentId,
    title: content.title ?? '',
    category: content.category ?? '',
    subcategory: content.subcategory ?? '',
    releaseYear: content.releaseYear ?? '',
    status: content.status ?? 'ACTIVE',
    description: content.description ?? '',
    castNames: content.castNames ?? '',
    thumbnailUrl: content.thumbnailUrl ?? '',
    isPopular: Boolean(content.isPopular),
    country: content.country ?? 'Korea',
    ottPlatform: content.ottPlatform ?? '',
    tagsText: Array.isArray(content.tags) ? content.tags.join(', ') : '',
  };
  setStatus('info', '콘텐츠 수정 모드입니다.', `${content.contentId} 항목을 편집합니다.`);
}

function editPlace(place) {
  editingPlaceId.value = place.placeId;
  placeForm.value = {
    placeId: place.placeId,
    placeName: place.placeName ?? place.name ?? '',
    address: place.address ?? '',
    region: place.region ?? '',
    district: place.district ?? '',
    category: place.category ?? '',
    description: place.description ?? '',
    openingHours: place.openingHours ?? '',
    closedDays: place.closedDays ?? '',
    phoneNumber: place.phoneNumber ?? '',
    imageUrl: place.imageUrl ?? place.thumbnailUrl ?? '',
    indoorOutdoor: place.indoorOutdoor ?? 'mixed',
    parkingAvailable: Boolean(place.parkingAvailable),
    latitude: place.latitude ?? '',
    longitude: place.longitude ?? '',
  };
  setStatus('info', '장소 수정 모드입니다.', `${place.placeId} 항목을 편집합니다.`);
}

async function removeContent(content) {
  if (!window.confirm(`${content.title} 콘텐츠를 삭제 처리할까요?`)) return;
  deletingId.value = content.contentId;
  try {
    await deleteAdminContent(content.contentId);
    setStatus('success', '콘텐츠를 삭제했습니다.', '삭제된 콘텐츠는 공개 목록에서 제외됩니다.');
    await loadAdminData();
  } catch (error) {
    setStatus('error', '콘텐츠 삭제 실패', getUserMessage(error, '콘텐츠를 삭제하지 못했습니다.'));
  } finally {
    deletingId.value = '';
  }
}

async function removePlace(place) {
  if (!window.confirm(`${place.placeName ?? place.name} 장소를 삭제할까요? 관련 참조도 함께 정리됩니다.`)) return;
  deletingId.value = place.placeId;
  try {
    await deleteAdminPlace(place.placeId);
    setStatus('success', '장소를 삭제했습니다.', '장소와 관련 참조가 정리되었습니다.');
    await loadAdminData();
  } catch (error) {
    setStatus('error', '장소 삭제 실패', getUserMessage(error, '장소를 삭제하지 못했습니다.'));
  } finally {
    deletingId.value = '';
  }
}

function selectTab(tab) {
  router.push(tab === 'places' ? '/admin/places' : '/admin/contents');
}

function splitTags(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
</script>

<template>
  <AppLayout title="운영자 관리" back hide-bottom>
    <section class="admin-screen">
      <div class="admin-hero">
        <p>Rubric #01 검증용</p>
        <h1>콘텐츠·장소 관리자 CRUD</h1>
        <span>ROLE_ADMIN 계정만 생성, 수정, 삭제 요청을 완료할 수 있습니다.</span>
      </div>

      <FormStatusNotice
        v-if="!hasToken"
        tone="warning"
        title="로그인이 필요합니다"
        text="관리자 계정으로 로그인한 뒤 /admin 화면을 다시 열어 주세요."
      />
      <FormStatusNotice
        v-else-if="uiStore.currentUser && !isAdmin"
        tone="error"
        title="관리자 권한이 필요합니다"
        :text="`현재 계정 역할은 ${uiStore.currentUser.role ?? 'ROLE_USER'}입니다. backend는 이 상태에서 admin CRUD 요청을 403으로 차단합니다.`"
      />
      <FormStatusNotice
        v-if="status.title && isAdmin"
        :tone="status.tone"
        :title="status.title"
        :text="status.text"
      />

      <template v-if="isAdmin">
        <div class="admin-tabs" role="tablist" aria-label="관리 대상">
          <button
            type="button"
            :class="{ active: activeTab === 'contents' }"
            role="tab"
            :aria-selected="activeTab === 'contents'"
            @click="selectTab('contents')"
          >
            콘텐츠 관리
          </button>
          <button
            type="button"
            :class="{ active: activeTab === 'places' }"
            role="tab"
            :aria-selected="activeTab === 'places'"
            @click="selectTab('places')"
          >
            장소 관리
          </button>
        </div>

        <EmptyState
          v-if="loading"
          tone="loading"
          compact
          title="관리 데이터를 불러오는 중입니다"
          text="콘텐츠와 장소 목록을 확인하고 있어요."
        />

        <div v-else-if="activeTab === 'contents'" class="admin-panel">
          <form class="admin-form" @submit.prevent="saveContent">
            <div class="admin-section-title">
              <h2>{{ editingContentId ? '콘텐츠 수정' : '콘텐츠 생성' }}</h2>
              <button type="button" class="button button-ghost" @click="resetContentForm">초기화</button>
            </div>
            <label class="form-field">
              콘텐츠 ID
              <input v-model="contentForm.contentId" :readonly="Boolean(editingContentId)" required />
            </label>
            <label class="form-field">
              제목
              <input v-model="contentForm.title" required />
            </label>
            <div class="admin-field-grid">
              <label class="form-field">
                카테고리
                <input v-model="contentForm.category" required />
              </label>
              <label class="form-field">
                공개 연도
                <input v-model="contentForm.releaseYear" inputmode="numeric" />
              </label>
            </div>
            <label class="form-field">
              설명
              <textarea v-model="contentForm.description" rows="3"></textarea>
            </label>
            <div class="admin-field-grid">
              <label class="form-field">
                하위 카테고리
                <input v-model="contentForm.subcategory" />
              </label>
              <label class="form-field">
                상태
                <input v-model="contentForm.status" />
              </label>
            </div>
            <label class="form-field">
              출연진
              <input v-model="contentForm.castNames" />
            </label>
            <label class="form-field">
              썸네일 URL
              <input v-model="contentForm.thumbnailUrl" />
            </label>
            <div class="admin-field-grid">
              <label class="form-field">
                국가
                <input v-model="contentForm.country" />
              </label>
              <label class="form-field">
                OTT
                <input v-model="contentForm.ottPlatform" />
              </label>
            </div>
            <label class="form-field">
              태그
              <input v-model="contentForm.tagsText" placeholder="쉼표로 구분" />
            </label>
            <label class="admin-checkbox">
              <input v-model="contentForm.isPopular" type="checkbox" />
              인기 콘텐츠로 표시
            </label>
            <button class="button button-primary block" type="submit" :disabled="saving">
              {{ saving ? '저장 중' : editingContentId ? '콘텐츠 수정' : '콘텐츠 생성' }}
            </button>
          </form>

          <div class="admin-list">
            <div class="admin-section-title">
              <h2>콘텐츠 목록</h2>
              <span>{{ contents.length }}개</span>
            </div>
            <article v-for="content in contents" :key="content.contentId" class="admin-row">
              <div>
                <strong>{{ content.title }}</strong>
                <small>{{ content.contentId }} · {{ content.category }} · {{ content.status }}</small>
              </div>
              <div class="admin-row-actions">
                <button type="button" class="button button-secondary" @click="editContent(content)">수정</button>
                <button
                  type="button"
                  class="button button-danger"
                  :disabled="deletingId === content.contentId"
                  @click="removeContent(content)"
                >
                  삭제
                </button>
              </div>
            </article>
          </div>
        </div>

        <div v-else class="admin-panel">
          <form class="admin-form" @submit.prevent="savePlace">
            <div class="admin-section-title">
              <h2>{{ editingPlaceId ? '장소 수정' : '장소 생성' }}</h2>
              <button type="button" class="button button-ghost" @click="resetPlaceForm">초기화</button>
            </div>
            <label class="form-field">
              장소 ID
              <input v-model="placeForm.placeId" :readonly="Boolean(editingPlaceId)" required />
            </label>
            <label class="form-field">
              장소명
              <input v-model="placeForm.placeName" required />
            </label>
            <div class="admin-field-grid">
              <label class="form-field">
                지역
                <input v-model="placeForm.region" required />
              </label>
              <label class="form-field">
                구/군
                <input v-model="placeForm.district" />
              </label>
            </div>
            <label class="form-field">
              주소
              <input v-model="placeForm.address" />
            </label>
            <label class="form-field">
              설명
              <textarea v-model="placeForm.description" rows="3"></textarea>
            </label>
            <div class="admin-field-grid">
              <label class="form-field">
                카테고리
                <input v-model="placeForm.category" />
              </label>
              <label class="form-field">
                실내/실외
                <input v-model="placeForm.indoorOutdoor" />
              </label>
            </div>
            <div class="admin-field-grid">
              <label class="form-field">
                영업 시간
                <input v-model="placeForm.openingHours" />
              </label>
              <label class="form-field">
                휴무일
                <input v-model="placeForm.closedDays" />
              </label>
            </div>
            <label class="form-field">
              연락처
              <input v-model="placeForm.phoneNumber" />
            </label>
            <label class="form-field">
              이미지 URL
              <input v-model="placeForm.imageUrl" />
            </label>
            <div class="admin-field-grid">
              <label class="form-field">
                위도
                <input v-model="placeForm.latitude" inputmode="decimal" />
              </label>
              <label class="form-field">
                경도
                <input v-model="placeForm.longitude" inputmode="decimal" />
              </label>
            </div>
            <label class="admin-checkbox">
              <input v-model="placeForm.parkingAvailable" type="checkbox" />
              주차 가능
            </label>
            <button class="button button-primary block" type="submit" :disabled="saving">
              {{ saving ? '저장 중' : editingPlaceId ? '장소 수정' : '장소 생성' }}
            </button>
          </form>

          <div class="admin-list">
            <div class="admin-section-title">
              <h2>장소 목록</h2>
              <span>{{ places.length }}개</span>
            </div>
            <article v-for="place in places" :key="place.placeId" class="admin-row">
              <div>
                <strong>{{ place.placeName ?? place.name }}</strong>
                <small>{{ place.placeId }} · {{ place.region }} · {{ place.category }}</small>
              </div>
              <div class="admin-row-actions">
                <button type="button" class="button button-secondary" @click="editPlace(place)">수정</button>
                <button
                  type="button"
                  class="button button-danger"
                  :disabled="deletingId === place.placeId"
                  @click="removePlace(place)"
                >
                  삭제
                </button>
              </div>
            </article>
          </div>
        </div>
      </template>
    </section>
  </AppLayout>
</template>
