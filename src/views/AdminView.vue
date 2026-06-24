<script setup>
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';

const { t } = useI18n();
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
    category: '\ub4dc\ub77c\ub9c8',
    subcategory: 'K-Content',
    releaseYear: new Date().getFullYear(),
    status: 'ACTIVE',
    description: '',
    castNames: '',
    thumbnailUrl: '',
    isPopular: false,
    country: 'Korea',
    ottPlatform: '',
    tagsText: '\uad00\ub9ac\uc790,CRUD',
  };
}

function createPlaceDefaults() {
  return {
    placeId: `P_ADMIN_${Date.now()}`,
    placeName: '',
    address: '',
    region: '\uc11c\uc6b8',
    district: '',
    category: '\ucd2c\uc601\uc9c0',
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
      setStatus('info', t('admin.cleanup.ka5c3875969'), t('admin.cleanup.kb29755a6a5'));
    }
  } catch (error) {
    setStatus('error', t('admin.cleanup.k1d60f2a4eb'), getUserMessage(error, t('admin.cleanup.k8675dc1ed4')));
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
      setStatus('success', t('admin.cleanup.k0ccd5fcbcd'), t('admin.cleanup.kbce546c228', { value0: payload.contentId }));
    } else {
      await createAdminContent(payload);
      setStatus('success', t('admin.cleanup.kfa63553c3d'), t('admin.cleanup.ka10bd55b0e', { value0: payload.contentId }));
    }
    resetContentForm();
    await loadAdminData();
  } catch (error) {
    setStatus('error', t('admin.cleanup.k08da05c809'), getUserMessage(error, t('admin.cleanup.k98d457a2b5')));
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
      setStatus('success', t('admin.cleanup.kd4c9d2cb07'), t('admin.cleanup.kbce546c228', { value0: payload.placeId }));
    } else {
      await createAdminPlace(payload);
      setStatus('success', t('admin.cleanup.k32d447e9e8'), t('admin.cleanup.ka10bd55b0e', { value0: payload.placeId }));
    }
    resetPlaceForm();
    await loadAdminData();
  } catch (error) {
    setStatus('error', t('admin.cleanup.kb056e33705'), getUserMessage(error, t('admin.cleanup.k688d59ffd6')));
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
  setStatus('info', t('admin.cleanup.kafb245257b'), t('admin.cleanup.k8a9212e1d2', { value0: content.contentId }));
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
  setStatus('info', t('admin.cleanup.k30db00fc9d'), t('admin.cleanup.k8a9212e1d2', { value0: place.placeId }));
}

async function removeContent(content) {
  if (!window.confirm(t('admin.cleanup.kc80a7dfdbc', { value0: content.title }))) return;
  deletingId.value = content.contentId;
  try {
    await deleteAdminContent(content.contentId);
    setStatus('success', t('admin.cleanup.kd95894376e'), t('admin.cleanup.kc220b86dd0'));
    await loadAdminData();
  } catch (error) {
    setStatus('error', t('admin.cleanup.k88a7368a3c'), getUserMessage(error, t('admin.cleanup.k5acb294067')));
  } finally {
    deletingId.value = '';
  }
}

async function removePlace(place) {
  if (!window.confirm(t('admin.cleanup.k8bf81f97c1', { value0: place.placeName ?? place.name }))) return;
  deletingId.value = place.placeId;
  try {
    await deleteAdminPlace(place.placeId);
    setStatus('success', t('admin.cleanup.k03be763fd5'), t('admin.cleanup.k845714b78d'));
    await loadAdminData();
  } catch (error) {
    setStatus('error', t('admin.cleanup.kdebe0bafaf'), getUserMessage(error, t('admin.cleanup.k52ae639cf0')));
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
  <AppLayout :title="t('admin.cleanup.kee87d7edc8')" back hide-bottom>
    <section class="admin-screen">
      <div class="admin-hero">
        <p>{{ t('admin.cleanup.kc6c411c327') }}</p>
        <h1>{{ t('admin.cleanup.k3190102602') }}</h1>
        <span>{{ t('admin.cleanup.k0c97bb91d3') }}</span>
      </div>

      <FormStatusNotice
        v-if="!hasToken"
        tone="warning"
        :title="t('admin.cleanup.ke2cb964f1d')"
        :text="t('admin.cleanup.kcc181369bb')"
      />
      <FormStatusNotice
        v-else-if="uiStore.currentUser && !isAdmin"
        tone="error"
        :title="t('admin.cleanup.kccd5c80f5b')"
        :text="t('admin.cleanup.kbfa48392ad', { value0: uiStore.currentUser.role ?? 'ROLE_USER' })"
      />
      <FormStatusNotice
        v-if="status.title && isAdmin"
        :tone="status.tone"
        :title="status.title"
        :text="status.text"
      />

      <template v-if="isAdmin">
        <div class="admin-tabs" role="tablist" :aria-label="t('admin.cleanup.k150ba3e119')">
          <button
            type="button"
            :class="{ active: activeTab === 'contents' }"
            role="tab"
            :aria-selected="activeTab === 'contents'"
            @click="selectTab('contents')"
          >
            {{ t('admin.tabs.contents') }}
          </button>
          <button
            type="button"
            :class="{ active: activeTab === 'places' }"
            role="tab"
            :aria-selected="activeTab === 'places'"
            @click="selectTab('places')"
          >
            {{ t('admin.tabs.places') }}
          </button>
        </div>

        <EmptyState
          v-if="loading"
          tone="loading"
          compact
          :title="t('admin.cleanup.k1ae14ae59f')"
          :text="t('admin.cleanup.k57e2189e3a')"
        />

        <div v-else-if="activeTab === 'contents'" class="admin-panel">
          <form class="admin-form" @submit.prevent="saveContent">
            <div class="admin-section-title">
              <h2>{{ editingContentId ? t('admin.cleanup.k16ffd31fe2') : t('admin.cleanup.k55bf229a26') }}</h2>
              <button type="button" class="button button-ghost" @click="resetContentForm">{{ t('admin.cleanup.k149c332e57') }}</button>
            </div>
            <label class="form-field">
              {{ t('admin.fields.contentId') }}
              <input v-model="contentForm.contentId" :readonly="Boolean(editingContentId)" required />
            </label>
            <label class="form-field">
              {{ t('admin.fields.title') }}
              <input v-model="contentForm.title" required />
            </label>
            <div class="admin-field-grid">
              <label class="form-field">
                {{ t('admin.fields.category') }}
                <input v-model="contentForm.category" required />
              </label>
              <label class="form-field">
                {{ t('admin.fields.releaseYear') }}
                <input v-model="contentForm.releaseYear" inputmode="numeric" />
              </label>
            </div>
            <label class="form-field">
              {{ t('admin.fields.description') }}
              <textarea v-model="contentForm.description" rows="3"></textarea>
            </label>
            <div class="admin-field-grid">
              <label class="form-field">
                {{ t('admin.fields.subcategory') }}
                <input v-model="contentForm.subcategory" />
              </label>
              <label class="form-field">
                {{ t('admin.fields.status') }}
                <input v-model="contentForm.status" />
              </label>
            </div>
            <label class="form-field">
              {{ t('admin.fields.cast') }}
              <input v-model="contentForm.castNames" />
            </label>
            <label class="form-field">
              {{ t('admin.fields.thumbnailUrl') }}
              <input v-model="contentForm.thumbnailUrl" />
            </label>
            <div class="admin-field-grid">
              <label class="form-field">
                {{ t('admin.fields.country') }}
                <input v-model="contentForm.country" />
              </label>
              <label class="form-field">
                OTT
                <input v-model="contentForm.ottPlatform" />
              </label>
            </div>
            <label class="form-field">
              {{ t('admin.fields.tags') }}
              <input v-model="contentForm.tagsText" :placeholder="t('admin.cleanup.k67d30b3299')" />
            </label>
            <label class="admin-checkbox">
              <input v-model="contentForm.isPopular" type="checkbox" />
              {{ t('admin.fields.popularContent') }}
            </label>
            <button class="button button-primary block" type="submit" :disabled="saving">
              {{ saving ? t('admin.cleanup.k6d3a1dfcb8') : editingContentId ? t('admin.cleanup.k16ffd31fe2') : t('admin.cleanup.k55bf229a26') }}
            </button>
          </form>

          <div class="admin-list">
            <div class="admin-section-title">
              <h2>{{ t('admin.cleanup.k60ab9d7d72') }}</h2>
              <span>{{ t('admin.cleanup.k3ee450516b', { count: contents.length }) }}</span>
            </div>
            <article v-for="content in contents" :key="content.contentId" class="admin-row">
              <div>
                <strong>{{ content.title }}</strong>
                <small>{{ content.contentId }} · {{ content.category }} · {{ content.status }}</small>
              </div>
              <div class="admin-row-actions">
                <button type="button" class="button button-secondary" @click="editContent(content)">{{ t('admin.cleanup.k41f718e2ab') }}</button>
                <button
                  type="button"
                  class="button button-danger"
                  :disabled="deletingId === content.contentId"
                  @click="removeContent(content)"
                >
                  {{ t('common.delete') }}
                </button>
              </div>
            </article>
          </div>
        </div>

        <div v-else class="admin-panel">
          <form class="admin-form" @submit.prevent="savePlace">
            <div class="admin-section-title">
              <h2>{{ editingPlaceId ? t('admin.cleanup.k86bb659b30') : t('admin.cleanup.kf285c54cb8') }}</h2>
              <button type="button" class="button button-ghost" @click="resetPlaceForm">{{ t('admin.cleanup.k149c332e57') }}</button>
            </div>
            <label class="form-field">
              {{ t('admin.fields.placeId') }}
              <input v-model="placeForm.placeId" :readonly="Boolean(editingPlaceId)" required />
            </label>
            <label class="form-field">
              {{ t('admin.fields.placeName') }}
              <input v-model="placeForm.placeName" required />
            </label>
            <div class="admin-field-grid">
              <label class="form-field">
                {{ t('admin.fields.region') }}
                <input v-model="placeForm.region" required />
              </label>
              <label class="form-field">
                {{ t('admin.fields.district') }}
                <input v-model="placeForm.district" />
              </label>
            </div>
            <label class="form-field">
              {{ t('admin.fields.address') }}
              <input v-model="placeForm.address" />
            </label>
            <label class="form-field">
              {{ t('admin.fields.description') }}
              <textarea v-model="placeForm.description" rows="3"></textarea>
            </label>
            <div class="admin-field-grid">
              <label class="form-field">
                {{ t('admin.fields.category') }}
                <input v-model="placeForm.category" />
              </label>
              <label class="form-field">
                {{ t('admin.fields.indoorOutdoor') }}
                <input v-model="placeForm.indoorOutdoor" />
              </label>
            </div>
            <div class="admin-field-grid">
              <label class="form-field">
                {{ t('admin.fields.openingHours') }}
                <input v-model="placeForm.openingHours" />
              </label>
              <label class="form-field">
                {{ t('admin.fields.closedDays') }}
                <input v-model="placeForm.closedDays" />
              </label>
            </div>
            <label class="form-field">
              {{ t('admin.fields.phoneNumber') }}
              <input v-model="placeForm.phoneNumber" />
            </label>
            <label class="form-field">
              {{ t('admin.fields.imageUrl') }}
              <input v-model="placeForm.imageUrl" />
            </label>
            <div class="admin-field-grid">
              <label class="form-field">
                {{ t('admin.fields.latitude') }}
                <input v-model="placeForm.latitude" inputmode="decimal" />
              </label>
              <label class="form-field">
                {{ t('admin.fields.longitude') }}
                <input v-model="placeForm.longitude" inputmode="decimal" />
              </label>
            </div>
            <label class="admin-checkbox">
              <input v-model="placeForm.parkingAvailable" type="checkbox" />
              {{ t('admin.fields.parkingAvailable') }}
            </label>
            <button class="button button-primary block" type="submit" :disabled="saving">
              {{ saving ? t('admin.cleanup.k6d3a1dfcb8') : editingPlaceId ? t('admin.cleanup.k86bb659b30') : t('admin.cleanup.kf285c54cb8') }}
            </button>
          </form>

          <div class="admin-list">
            <div class="admin-section-title">
              <h2>{{ t('admin.cleanup.k358dae8c7a') }}</h2>
              <span>{{ t('admin.cleanup.k3ee450516b', { count: places.length }) }}</span>
            </div>
            <article v-for="place in places" :key="place.placeId" class="admin-row">
              <div>
                <strong>{{ place.placeName ?? place.name }}</strong>
                <small>{{ place.placeId }} · {{ place.region }} · {{ place.category }}</small>
              </div>
              <div class="admin-row-actions">
                <button type="button" class="button button-secondary" @click="editPlace(place)">{{ t('admin.cleanup.k41f718e2ab') }}</button>
                <button
                  type="button"
                  class="button button-danger"
                  :disabled="deletingId === place.placeId"
                  @click="removePlace(place)"
                >
                  {{ t('common.delete') }}
                </button>
              </div>
            </article>
          </div>
        </div>
      </template>
    </section>
  </AppLayout>
</template>
