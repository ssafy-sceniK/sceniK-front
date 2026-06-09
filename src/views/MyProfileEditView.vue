<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import { useUiStore } from '../stores/uiStore.js';

const router = useRouter();
const uiStore = useUiStore();

const contentOptions = ['드라마', '영화', '예능', '아이돌', '배우'];
const regionOptions = ['서울', '부산', '제주', '경기', '강원', '인천'];
const themeOptions = ['감성 여행', '촬영지 투어', '맛집', '산책', '가족', '혼자 여행', '친구와 여행'];

const nickname = ref(uiStore.currentUser?.nickname ?? '');
const bio = ref(uiStore.currentUser?.bio ?? 'K-content 여행 중');
const selectedTypes = ref([...(uiStore.currentUser?.preferences?.contentTypes ?? ['드라마'])]);
const selectedRegions = ref([...(uiStore.currentUser?.preferences?.regions ?? ['서울'])]);
const selectedThemes = ref([...(uiStore.currentUser?.preferences?.themes ?? ['감성 여행'])]);
const nicknameError = ref('');
const saving = ref(false);
const saveNotice = ref(null);
const selectedImageName = ref('');
const previewObjectUrl = ref('');

const profileInitial = computed(() => nickname.value?.slice(0, 1).toUpperCase() || 'K');
const currentProfileImageUrl = computed(() => uiStore.currentUser?.profileImageUrl ?? '');
const profilePreviewUrl = computed(() => previewObjectUrl.value || currentProfileImageUrl.value);

function toggle(list, item) {
  const index = list.value.indexOf(item);
  if (index >= 0) list.value.splice(index, 1);
  else list.value.push(item);
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

function handleImageChange(event) {
  const [file] = event.target.files ?? [];
  if (previewObjectUrl.value) URL.revokeObjectURL(previewObjectUrl.value);
  if (!file) {
    previewObjectUrl.value = '';
    selectedImageName.value = '';
    return;
  }
  previewObjectUrl.value = URL.createObjectURL(file);
  selectedImageName.value = file.name;
  saveNotice.value = {
    tone: 'info',
    title: '프로필 이미지 미리보기',
    text: '선택한 이미지는 미리보기로만 표시됩니다. 프로필 이미지 업로드는 추후 지원 예정입니다.',
  };
}

async function saveProfile() {
  if (!validateNickname()) return;
  saving.value = true;
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
        text: '닉네임, 소개, 콘텐츠 취향과 선호 지역/테마가 업데이트되었습니다.',
      }
    : {
        tone: 'error',
        title: '프로필을 저장하지 못했습니다.',
        text: uiStore.authError || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      };
  if (ok) window.setTimeout(() => router.push('/my'), 450);
}

onBeforeUnmount(() => {
  if (previewObjectUrl.value) URL.revokeObjectURL(previewObjectUrl.value);
});
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
          <div class="avatar large profile-preview-avatar">
            <img v-if="profilePreviewUrl" :src="profilePreviewUrl" alt="프로필 이미지 미리보기" />
            <span v-else>{{ profileInitial }}</span>
            <span class="avatar-edit-badge large">✎</span>
          </div>
          <div>
            <h2 id="profile-preview-title">프로필 이미지 미리보기</h2>
            <p>선택한 이미지는 이 화면에서만 미리보기로 표시됩니다.</p>
          </div>
        </div>
        <label class="profile-image-picker">
          <span>이미지 선택</span>
          <input type="file" accept="image/*" @change="handleImageChange" />
        </label>
        <small class="profile-image-note">
          {{ selectedImageName ? `${selectedImageName} · ` : '' }}프로필 이미지 업로드는 추후 지원 예정입니다.
        </small>
      </section>

      <div class="profile-edit-form">
        <label class="form-field">
          이메일
          <input :value="uiStore.currentUser.email" readonly aria-readonly="true" />
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
        <BaseButton block :disabled="saving" @click="saveProfile">{{ saving ? '저장 중' : '프로필 저장' }}</BaseButton>
        <BaseButton variant="ghost" block @click="router.push('/my')">취소</BaseButton>
      </div>
    </section>
  </AppLayout>
</template>
