<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import ProfileAvatar from '../components/common/ProfileAvatar.vue';
import { useUiStore } from '../stores/uiStore.js';
import { PREFERENCE_CONTENT_TYPES, PREFERENCE_REGIONS, PREFERENCE_THEMES, normalizePreferenceSelection } from '../utils/preferences.js';

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const PROFILE_CROP_SIZE = 512;

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
const removeSavedProfileImage = ref(false);
const imageInput = ref(null);
const cropEditorOpen = ref(false);
const cropImageUrl = ref('');
const cropSourceFile = ref(null);
const cropSourceName = ref('');
const cropScale = ref(1);
const cropOffsetX = ref(0);
const cropOffsetY = ref(0);
const cropRotation = ref(0);
const cropPreviewRef = ref(null);
const cropImageSize = ref({ width: 0, height: 0 });
const cropPreviewSize = ref(0);
const cropDrag = ref({ active: false });

const profileInitial = computed(() => nickname.value?.slice(0, 1).toUpperCase() || 'K');
const currentProfileImageUrl = computed(() => uiStore.currentUser?.profileImageUrl ?? '');
const profilePreviewUrl = computed(() => previewObjectUrl.value || (removeSavedProfileImage.value ? '' : currentProfileImageUrl.value));
const canRemoveProfileImage = computed(() => Boolean(selectedImageFile.value || previewObjectUrl.value || (!removeSavedProfileImage.value && currentProfileImageUrl.value)));
const profileCropImageStyle = computed(() => {
  const { imageWidth, imageHeight } = cropDisplayMetrics();
  return {
    width: `${imageWidth}px`,
    height: `${imageHeight}px`,
    transform: `translate(calc(-50% + ${cropOffsetX.value}px), calc(-50% + ${cropOffsetY.value}px)) rotate(${cropRotation.value}deg)`,
  };
});
const providerLabel = computed(() => ({
  google: 'Google 로그인 연결됨',
  kakao: 'Kakao 로그인 연결됨',
  email: '이메일 로그인',
})[uiStore.currentUser?.authProvider] ?? '이메일 로그인');
watch([cropScale, cropRotation, cropPreviewSize, () => cropImageSize.value.width, () => cropImageSize.value.height], () => {
  clampCropOffset();
});

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

function clearCropUrl() {
  if (cropImageUrl.value) URL.revokeObjectURL(cropImageUrl.value);
  cropImageUrl.value = '';
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isQuarterTurn() {
  return Math.abs(cropRotation.value % 180) === 90;
}

function cropDisplayMetrics() {
  const preview = cropPreviewSize.value || 260;
  const naturalWidth = cropImageSize.value.width || 1;
  const naturalHeight = cropImageSize.value.height || 1;
  const rotatedWidth = isQuarterTurn() ? naturalHeight : naturalWidth;
  const rotatedHeight = isQuarterTurn() ? naturalWidth : naturalHeight;
  const baseScale = Math.max(preview / rotatedWidth, preview / rotatedHeight) * cropScale.value;
  return {
    preview,
    boundsWidth: rotatedWidth * baseScale,
    boundsHeight: rotatedHeight * baseScale,
    imageWidth: naturalWidth * baseScale,
    imageHeight: naturalHeight * baseScale,
  };
}

function clampCropOffset() {
  const { preview, boundsWidth, boundsHeight } = cropDisplayMetrics();
  const maxX = Math.max(0, (boundsWidth - preview) / 2);
  const maxY = Math.max(0, (boundsHeight - preview) / 2);
  cropOffsetX.value = clamp(cropOffsetX.value, -maxX, maxX);
  cropOffsetY.value = clamp(cropOffsetY.value, -maxY, maxY);
}

function measureCropPreview() {
  cropPreviewSize.value = cropPreviewRef.value?.clientWidth || 260;
}

function resetCropControls() {
  cropScale.value = 1;
  cropOffsetX.value = 0;
  cropOffsetY.value = 0;
  cropRotation.value = 0;
  cropDrag.value = { active: false };
}

function openImagePicker() {
  imageInput.value?.click();
}

function removeSelectedImage() {
  const hadSelectedImage = Boolean(selectedImageFile.value || previewObjectUrl.value);
  clearPreviewUrl();
  selectedImageFile.value = null;
  selectedImageName.value = '';
  if (!hadSelectedImage && currentProfileImageUrl.value) {
    removeSavedProfileImage.value = true;
  }
  if (imageInput.value) imageInput.value.value = '';
}

function openCropEditor(file) {
  removeSavedProfileImage.value = false;
  clearCropUrl();
  cropSourceFile.value = file;
  cropSourceName.value = file.name;
  cropImageUrl.value = URL.createObjectURL(file);
  resetCropControls();
  cropEditorOpen.value = true;
  void nextTick(() => {
    measureCropPreview();
    clampCropOffset();
  });
}

function cancelCropEdit() {
  cropEditorOpen.value = false;
  cropSourceFile.value = null;
  cropSourceName.value = '';
  clearCropUrl();
  resetCropControls();
  if (imageInput.value) imageInput.value.value = '';
}

function rotateCropImage() {
  cropRotation.value = (cropRotation.value + 90) % 360;
  void nextTick(clampCropOffset);
}

function onCropImageLoad(event) {
  cropImageSize.value = {
    width: event.target.naturalWidth || PROFILE_CROP_SIZE,
    height: event.target.naturalHeight || PROFILE_CROP_SIZE,
  };
  void nextTick(() => {
    measureCropPreview();
    clampCropOffset();
  });
}

function startCropDrag(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  event.preventDefault();
  measureCropPreview();
  cropDrag.value = {
    active: true,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: cropOffsetX.value,
    originY: cropOffsetY.value,
  };
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function moveCropDrag(event) {
  if (!cropDrag.value.active || cropDrag.value.pointerId !== event.pointerId) return;
  cropOffsetX.value = cropDrag.value.originX + event.clientX - cropDrag.value.startX;
  cropOffsetY.value = cropDrag.value.originY + event.clientY - cropDrag.value.startY;
  clampCropOffset();
}

function endCropDrag(event) {
  if (cropDrag.value.pointerId === event.pointerId) {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }
  cropDrag.value = { active: false };
}

function adjustCropZoom(event) {
  cropScale.value = clamp(cropScale.value + (event.deltaY > 0 ? -0.05 : 0.05), 1, 2.4);
  clampCropOffset();
}

function imageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Cropped image is empty.'));
    }, 'image/png', 0.92);
  });
}

function croppedFileName(name) {
  const baseName = String(name || 'profile-image').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9가-힣_-]+/g, '-');
  return `${baseName || 'profile-image'}-crop.png`;
}

async function applyCroppedImage() {
  if (!cropImageUrl.value || !cropSourceFile.value) return;
  try {
    const image = await imageFromUrl(cropImageUrl.value);
    const canvas = document.createElement('canvas');
    canvas.width = PROFILE_CROP_SIZE;
    canvas.height = PROFILE_CROP_SIZE;
    const context = canvas.getContext('2d');
    const quarterTurn = Math.abs(cropRotation.value % 180) === 90;
    const rotatedWidth = quarterTurn ? image.naturalHeight : image.naturalWidth;
    const rotatedHeight = quarterTurn ? image.naturalWidth : image.naturalHeight;
    const baseScale = Math.max(PROFILE_CROP_SIZE / rotatedWidth, PROFILE_CROP_SIZE / rotatedHeight);
    const finalScale = baseScale * cropScale.value;
    const outputOffsetRatio = PROFILE_CROP_SIZE / (cropPreviewSize.value || PROFILE_CROP_SIZE);

    context.clearRect(0, 0, PROFILE_CROP_SIZE, PROFILE_CROP_SIZE);
    context.save();
    context.translate((PROFILE_CROP_SIZE / 2) + (cropOffsetX.value * outputOffsetRatio), (PROFILE_CROP_SIZE / 2) + (cropOffsetY.value * outputOffsetRatio));
    context.rotate((cropRotation.value * Math.PI) / 180);
    context.scale(finalScale, finalScale);
    context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    context.restore();

    const blob = await canvasToBlob(canvas);
    const croppedFile = new File([blob], croppedFileName(cropSourceName.value), { type: 'image/png' });
    clearPreviewUrl();
    selectedImageFile.value = croppedFile;
    selectedImageName.value = cropSourceName.value;
    previewObjectUrl.value = URL.createObjectURL(croppedFile);
    removeSavedProfileImage.value = false;
    cancelCropEdit();
  } catch (error) {
    saveNotice.value = {
      tone: 'error',
      title: '이미지를 조정하지 못했습니다.',
      text: '다른 JPG 또는 PNG 이미지를 선택해 주세요.',
    };
  }
}

function handleImageChange(event) {
  const input = event.target;
  const [file] = input.files ?? [];

  if (!file) return;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    saveNotice.value = {
      tone: 'warning',
      title: '이미지 형식을 확인해 주세요.',
      text: 'JPG 또는 PNG 이미지만 사용할 수 있습니다.',
    };
    input.value = '';
    return;
  }
  if (file.size > MAX_PROFILE_IMAGE_SIZE) {
    saveNotice.value = {
      tone: 'warning',
      title: '이미지 용량을 확인해 주세요.',
      text: '프로필 이미지는 5MB 이하만 업로드할 수 있습니다.',
    };
    input.value = '';
    return;
  }

  openCropEditor(file);
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
    removeSavedProfileImage.value = false;
  } else if (removeSavedProfileImage.value && currentProfileImageUrl.value) {
    const removed = await uiStore.removeProfileImage();
    if (!removed) {
      saving.value = false;
      saveNotice.value = {
        tone: 'error',
        title: '프로필 이미지를 삭제하지 못했습니다.',
        text: uiStore.authError || '기본 아바타로 되돌리지 못했습니다. 잠시 후 다시 시도해 주세요.',
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
  if (ok) {
    removeSavedProfileImage.value = false;
    window.setTimeout(() => router.push('/my'), 450);
  }
}

onBeforeUnmount(() => {
  clearPreviewUrl();
  clearCropUrl();
});
</script>

<template>
  <AppLayout title="프로필 편집" back>
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
      <section class="profile-preview-panel" aria-label="프로필 이미지 변경">
        <div class="profile-edit-avatar">
          <div class="profile-image-control">
            <ProfileAvatar
              :image-url="profilePreviewUrl"
              :initial="profileInitial"
              alt="프로필 이미지 미리보기"
              preview
              interactive
              aria-label="프로필 이미지 선택"
              @click="openImagePicker"
            />
            <button
              v-if="canRemoveProfileImage"
              type="button"
              class="profile-image-remove-button"
              aria-label="프로필 이미지 제거"
              @click="removeSelectedImage"
            >
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2 2l8 8M10 2 2 10" />
              </svg>
            </button>
          </div>
          <p class="profile-image-guidance">사진을 눌러 프로필 이미지를 변경하세요.</p>
        </div>
        <input
          ref="imageInput"
          class="profile-image-input"
          type="file"
          accept="image/jpeg,image/png"
          @change="handleImageChange"
        />
        <small v-if="selectedImageName" class="profile-image-note">{{ selectedImageName }}</small>
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
      <div v-if="cropEditorOpen" class="profile-crop-backdrop" @click.self="cancelCropEdit">
        <section class="profile-crop-sheet" role="dialog" aria-modal="true" aria-labelledby="profile-crop-title">
          <div class="profile-crop-head">
            <h2 id="profile-crop-title">프로필 사진 조정</h2>
            <p>원 안에 보일 위치를 맞춘 뒤 적용하세요.</p>
          </div>
          <div
            ref="cropPreviewRef"
            class="profile-crop-preview"
            :class="{ 'is-dragging': cropDrag.active }"
            aria-label="원형 프로필 이미지 미리보기"
            @pointerdown="startCropDrag"
            @pointermove="moveCropDrag"
            @pointerup="endCropDrag"
            @pointercancel="endCropDrag"
            @wheel.prevent="adjustCropZoom"
          >
            <img
              v-if="cropImageUrl"
              :src="cropImageUrl"
              alt="선택한 이미지"
              :style="profileCropImageStyle"
              draggable="false"
              @load="onCropImageLoad"
            />
          </div>
          <p class="profile-crop-help">사진을 원 안에서 드래그해 위치를 맞추세요.</p>
          <div class="profile-crop-controls">
            <label>
              확대
              <input v-model.number="cropScale" type="range" min="1" max="2.4" step="0.05" />
            </label>
          </div>
          <div class="profile-crop-actions">
            <button type="button" class="profile-crop-rotate" @click="rotateCropImage">90° 회전</button>
            <BaseButton variant="ghost" block @click="cancelCropEdit">취소</BaseButton>
            <BaseButton block @click="applyCroppedImage">적용</BaseButton>
          </div>
        </section>
      </div>
    </section>
  </AppLayout>
</template>
