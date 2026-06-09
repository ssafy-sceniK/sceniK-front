<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useUiStore } from '../stores/uiStore.js';

const router = useRouter();
const uiStore = useUiStore();

const contentOptions = ['드라마', '영화', '아이돌', '예능', '배우'];
const regionOptions = ['서울', '부산', '제주', '경기', '강원', '인천'];
const themeOptions = ['감성 여행', '맛집 중심', '촬영지 중심', '성지 투어'];

const nickname = ref(uiStore.currentUser?.nickname ?? '');
const bio = ref(uiStore.currentUser?.bio ?? 'K-content 여행 중');
const selectedTypes = ref([...(uiStore.currentUser?.preferences?.contentTypes ?? ['드라마'])]);
const selectedRegions = ref([...(uiStore.currentUser?.preferences?.regions ?? ['서울'])]);
const selectedThemes = ref([...(uiStore.currentUser?.preferences?.themes ?? ['감성 여행'])]);
const nicknameError = ref('');
const saving = ref(false);

const profileInitial = computed(() => nickname.value?.slice(0, 1).toUpperCase() || 'K');

function toggle(list, item) {
  const index = list.value.indexOf(item);
  if (index >= 0) list.value.splice(index, 1);
  else list.value.push(item);
}

function validateNickname() {
  const value = nickname.value.trim();
  if (value.length < 2) {
    nicknameError.value = '닉네임은 2자 이상 입력해 주세요.';
    return false;
  }
  nicknameError.value = '';
  return true;
}

function notifyImageShell() {
  uiStore.notify('프로필 이미지는 추후 지원 예정입니다.');
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
  if (ok) router.push('/my');
}
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
      <div class="profile-edit-avatar">
        <button class="avatar large" type="button" @click="notifyImageShell">
          {{ profileInitial }}
          <span class="avatar-edit-badge large">✎</span>
        </button>
        <button type="button" class="text-link" @click="notifyImageShell">이미지 변경</button>
        <small class="profile-image-note">프로필 이미지는 추후 지원 예정입니다.</small>
      </div>

      <div class="profile-edit-form">
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

        <div class="preference-block compact">
          <h2>콘텐츠 취향</h2>
          <div class="chip-row wrap">
            <button
              v-for="item in contentOptions"
              :key="item"
              type="button"
              class="chip"
              :class="{ selected: selectedTypes.includes(item) }"
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
