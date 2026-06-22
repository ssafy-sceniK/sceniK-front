<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import ProfileAvatar from '../components/common/ProfileAvatar.vue';
import { useUiStore } from '../stores/uiStore.js';
import { PREFERENCE_CONTENT_TYPES, PREFERENCE_REGIONS, PREFERENCE_THEMES, normalizePreferenceSelection } from '../utils/preferences.js';

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const router = useRouter();
const uiStore = useUiStore();

const contentOptions = PREFERENCE_CONTENT_TYPES;
const regionOptions = PREFERENCE_REGIONS;
const themeOptions = PREFERENCE_THEMES;

const nickname = ref(uiStore.currentUser?.nickname ?? '');
const bio = ref(uiStore.currentUser?.bio ?? 'K-content 여행 중');
const currentPreferences = normalizePreferenceSelection(uiStore.currentUser?.preferences);
const selectedTypes = ref([...currentPreferences.contentTypes]);
const selectedRegions = ref([...currentPreferences.regions]);
const selectedThemes = ref([...currentPreferences.themes]);
const nicknameError = ref('');
const saving = ref(false);
const saveNotice = ref(null);
const selectedImageName = ref('');
const selectedImageFile = ref(null);
const previewObjectUrl = ref('');

const profileInitial = computed(() => nickname.value?.slice(0, 1).toUpperCase() || 'K');
const currentProfileImageUrl = computed(() => uiStore.currentUser?.profileImageUrl ?? '');
const profilePreviewUrl = computed(() => previewObjectUrl.value || currentProfileImageUrl.value);
const providerLabel = computed(() => ({
  google: 'Google 로그인 연결됨',
  kakao: 'Kakao 로그인 연결됨',
  email: '이메일 로그인',
})[uiStore.currentUser?.authProvider] ?? '이메일 로그인');

function toggle(list, item) {
  const index = list.indexOf(item);
  if (index >= 0) list.splice(index, 1);
  else list.push(item);
}

function validateNickname() {
  const value = nickname.value.trim();
  if (value.length < 2) {
    nicknameError.value = '닉네임은 2자 이상 입력해 주세요.';
    saveNotice.value = {
      tone: 'warning',
      title: '입력 내용을 확인해 주세요.',
      text: nicknameError.value,
    };
    return false;
  }
  nicknameError.value = '';
  return true;
}

function clearPreviewUrl() {
  if (previewObjectUrl.value) URL.revokeObjectURL(previewObjectUrl.value);
  previewObjectUrl.value = '';
}

function handleImageChange(event) {
  const [file] = event.target.files ?? [];
  clearPreviewUrl();
  selectedImageFile.value = null;
  selectedImageName.value = '';

  if (!file) return;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    saveNotice.value = {
      tone: 'warning',
      title: '이미지 형식을 확인해 주세요.',
      text: 'JPG, PNG, WEBP, GIF 이미지만 업로드할 수 있습니다.',
    };
    event.target.value = '';
    return;
  }
  if (file.size > MAX_PROFILE_IMAGE_SIZE) {
    saveNotice.value = {
      tone: 'warning',
      title: '이미지 용량을 확인해 주세요.',
      text: '프로필 이미지는 5MB 이하만 업로드할 수 있습니다.',
    };
    event.target.value = '';
    return;
  }

  selectedImageFile.value = file;
  selectedImageName.value = file.name;
  previewObjectUrl.value = URL.createObjectURL(file);
  saveNotice.value = {
    tone: 'info',
    title: '프로필 이미지가 선택되었습니다.',
    text: '저장하면 sceniK 프로필 이미지로 업로드됩니다.',
  };
}

async function saveProfile() {
  if (!validateNickname()) return;
  saving.value = true;
  saveNotice.value = null;

  if (selectedImageFile.value) {
    const uploaded = await uiStore.uploadProfileImage(selectedImageFile.value);
    if (!uploaded) {
      saving.value = false;
      saveNotice.value = {
        tone: 'error',
        title: '프로필 이미지를 저장하지 못했습니다.',
        text: uiStore.authError || '이미지 업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      };
      return;
    }
  }

  const ok = await uiStore.updateProfile({
    nickname: nickname.value,
    bio: bio.value,
    preferences: {
      contentTypes: selectedTypes.value,
      regions: selectedRegions.value,
      themes: selectedThemes.value,
    },
  });
  saving.value = false;
  saveNotice.value = ok
    ? {
        tone: 'success',
        title: '프로필이 저장되었습니다.',
        text: '닉네임, 소개, 취향, 프로필 이미지가 sceniK 프로필에 반영되었습니다.',
      }
    : {
        tone: 'error',
        title: '프로필을 저장하지 못했습니다.',
        text: uiStore.authError || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      };
  if (ok) window.setTimeout(() => router.push('/my'), 450);
}

onBeforeUnmount(clearPreviewUrl);
</script>

<template>
  <AppLayout title="프로필 편집" back hide-bottom>
    <template #actions>
      <button class="top-save-button" type="button" :disabled="saving" @click="saveProfile">
        {{ saving ? '저장 중' : '저장' }}
      </button>
    </template>

    <section v-if="!uiStore.currentUser" class="profile-edit-screen">
      <EmptyState
        icon="K"
        tone="login"
        title="로그인이 필요합니다"
        text="프로필 편집은 로그인 후 사용할 수 있습니다."
        action-label="로그인하기"
        action-to="/login"
      />
    </section>

    <section v-else class="profile-edit-screen">
      <section class="profile-preview-panel" aria-labelledby="profile-preview-title">
        <div class="profile-edit-avatar">
          <ProfileAvatar
            :image-url="profilePreviewUrl"
            :initial="profileInitial"
            alt="프로필 이미지 미리보기"
            preview
          />
          <div>
            <h2 id="profile-preview-title">sceniK 프로필 이미지</h2>
            <p>SNS 로그인 방식과 별개로 sceniK에서 사용할 프로필입니다.</p>
          </div>
        </div>
        <label class="profile-image-picker">
          <span>이미지 선택</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" @change="handleImageChange" />
        </label>
        <small class="profile-image-note">
          {{ selectedImageName ? `${selectedImageName} · ` : '' }}JPG, PNG, WEBP, GIF · 최대 5MB
        </small>
      </section>

      <div class="profile-edit-form">
        <label class="form-field">
          이메일
          <input :value="uiStore.currentUser.email" readonly aria-readonly="true" />
        </label>

        <label class="form-field">
          로그인 방식
          <input :value="providerLabel" readonly aria-readonly="true" />
        </label>

        <label class="form-field">
          <span class="field-label-row">
            닉네임
            <small>{{ nickname.length }}/20</small>
          </span>
          <input v-model="nickname" maxlength="20" placeholder="닉네임" @blur="validateNickname" />
          <em v-if="nicknameError" class="field-error">{{ nicknameError }}</em>
        </label>

        <label class="form-field">
          <span class="field-label-row">
            소개
            <small>{{ bio.length }}/50</small>
          </span>
          <input v-model="bio" maxlength="50" placeholder="K-content 여행 중" />
        </label>

        <div class="form-divider"></div>
        <FormStatusNotice
          v-if="saveNotice"
          :tone="saveNotice.tone"
          :title="saveNotice.title"
          :text="saveNotice.text"
        />

        <div class="preference-block compact">
          <h2>콘텐츠 취향</h2>
          <div class="chip-row wrap">
            <button
              v-for="item in contentOptions"
              :key="item"
              type="button"
              class="chip"
              :class="{ selected: selectedTypes.includes(item) }"
              :aria-pressed="selectedTypes.includes(item)"
              @click="toggle(selectedTypes, item)"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <div class="preference-block compact">
          <h2>선호 지역</h2>
          <div class="chip-row wrap">
            <button
              v-for="item in regionOptions"
              :key="item"
              type="button"
              class="chip"
              :class="{ selected: selectedRegions.includes(item) }"
              :aria-pressed="selectedRegions.includes(item)"
              @click="toggle(selectedRegions, item)"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <div class="preference-block compact">
          <h2>선호 테마</h2>
          <div class="chip-row wrap">
            <button
              v-for="item in themeOptions"
              :key="item"
              type="button"
              class="chip"
              :class="{ selected: selectedThemes.includes(item) }"
              :aria-pressed="selectedThemes.includes(item)"
              @click="toggle(selectedThemes, item)"
            >
              {{ item }}
            </button>
          </div>
        </div>
      </div>

      <div class="sticky-actions">
        <BaseButton block :disabled="saving" @click="saveProfile">{{ saving ? '저장 중입니다' : '프로필 저장' }}</BaseButton>
        <BaseButton variant="ghost" block @click="router.push('/my')">취소</BaseButton>
      </div>
    </section>
  </AppLayout>
</template>
