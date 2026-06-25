<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import ProfileAvatar from '../components/common/ProfileAvatar.vue';
import { useUiStore } from '../stores/uiStore.js';
import { PREFERENCE_CONTENT_TYPES, PREFERENCE_REGIONS, PREFERENCE_THEMES, normalizePreferenceSelection } from '../utils/preferences.js';
import { localizePreferenceOption } from '../i18n/systemContent.js';

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const PROFILE_IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png)$/i;
const PROFILE_CROP_SIZE = 512;

const router = useRouter();
const uiStore = useUiStore();
const { t, locale } = useI18n();

const contentOptions = PREFERENCE_CONTENT_TYPES;
const regionOptions = PREFERENCE_REGIONS;
const themeOptions = PREFERENCE_THEMES;

const nickname = ref(uiStore.currentUser?.nickname ?? '');
const bio = ref(uiStore.currentUser?.bio ?? '');
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

const currentProfileImageUrl = computed(() => uiStore.currentUser?.profileImageUrl ?? '');
const profilePreviewUrl = computed(() => previewObjectUrl.value || (removeSavedProfileImage.value ? '' : currentProfileImageUrl.value));
const canRemoveProfileImage = computed(() => Boolean(selectedImageFile.value || previewObjectUrl.value || (!removeSavedProfileImage.value && currentProfileImageUrl.value)));
const profileCropImageStyle = computed(() => {
  const { imageWidth, imageHeight } = cropDisplayMetrics();
  return {
    width: imageWidth + 'px',
    height: imageHeight + 'px',
    transform: 'translate(calc(-50% + ' + cropOffsetX.value + 'px), calc(-50% + ' + cropOffsetY.value + 'px)) rotate(' + cropRotation.value + 'deg)',
  };
});
watch([cropScale, cropRotation, cropPreviewSize, () => cropImageSize.value.width, () => cropImageSize.value.height], () => {
  clampCropOffset();
});

function preferenceLabel(group, item) {
  return localizePreferenceOption(group, item, t, locale.value);
}

function toggle(list, item) {
  const index = list.indexOf(item);
  if (index >= 0) list.splice(index, 1);
  else list.push(item);
}

function validateNickname() {
  const value = nickname.value.trim();
  if (value.length < 2) {
    nicknameError.value = t('profile.edit.validation.nicknameShort');
    saveNotice.value = {
      tone: 'warning',
      title: t('profile.edit.validation.title'),
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
  const baseName = String(name || 'profile-image').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-');
  return (baseName || 'profile-image') + '-crop.png';
}

function inferProfileImageType(file) {
  if (file.type) return file.type;
  const name = String(file.name ?? '').toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (PROFILE_IMAGE_EXTENSION_PATTERN.test(name)) return 'image/jpeg';
  return '';
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
      title: t('profile.edit.image.cropErrorTitle'),
      text: t('profile.edit.image.cropErrorText'),
    };
  }
}

function handleImageChange(event) {
  const input = event.target;
  const [file] = input.files ?? [];

  if (!file) return;
  const inferredType = inferProfileImageType(file);
  if (!ALLOWED_IMAGE_TYPES.includes(inferredType)) {
    saveNotice.value = {
      tone: 'warning',
      title: t('profile.edit.image.typeErrorTitle'),
      text: t('profile.edit.image.typeErrorText'),
    };
    input.value = '';
    return;
  }
  if (file.size > MAX_PROFILE_IMAGE_SIZE) {
    saveNotice.value = {
      tone: 'warning',
      title: t('profile.edit.image.sizeErrorTitle'),
      text: t('profile.edit.image.sizeErrorText'),
    };
    input.value = '';
    return;
  }

  const profileFile = file.type ? file : new File([file], file.name || 'profile-image.jpg', {
    type: inferredType,
    lastModified: file.lastModified || Date.now(),
  });
  openCropEditor(profileFile);
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
        title: t('profile.edit.save.imageUploadFailedTitle'),
        text: uiStore.authError || t('profile.edit.save.imageUploadFailedText'),
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
        title: t('profile.edit.save.imageRemoveFailedTitle'),
        text: uiStore.authError || t('profile.edit.save.imageRemoveFailedText'),
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
        title: t('profile.edit.save.successTitle'),
        text: t('profile.edit.save.successText'),
      }
    : {
        tone: 'error',
        title: t('profile.edit.save.failedTitle'),
        text: uiStore.authError || t('profile.edit.save.failedText'),
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
  <AppLayout :title="t('profile.edit.title')" back>
    <template #actions>
      <button class="top-save-button" type="button" :disabled="saving" @click="saveProfile">
        {{ saving ? t('profile.edit.savingShort') : t('common.save') }}
      </button>
    </template>

    <section v-if="!uiStore.currentUser" class="profile-edit-screen">
      <EmptyState
        icon="K"
        tone="login"
        :title="t('profile.edit.loginTitle')"
        :text="t('profile.edit.loginText')"
        :action-label="t('auth.login.title')"
        action-to="/login"
      />
    </section>

    <section v-else class="profile-edit-screen">
      <section class="profile-preview-panel" :aria-label="t('profile.edit.image.panelAria')">
        <div class="profile-edit-avatar">
          <div class="profile-image-control">
            <ProfileAvatar
              :image-url="profilePreviewUrl"
              :alt="t('profile.edit.image.avatarAlt')"
              preview
              interactive
              :aria-label="t('profile.edit.image.avatarAria')"
              @click="openImagePicker"
            />
            <button
              v-if="canRemoveProfileImage"
              type="button"
              class="profile-image-remove-button"
              :aria-label="t('profile.edit.image.removeAria')"
              @click="removeSelectedImage"
            >
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2 2l8 8M10 2 2 10" />
              </svg>
            </button>
          </div>
          <p class="profile-image-guidance">{{ t('profile.edit.image.guidance') }}</p>
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
          {{ t('auth.fields.email') }}
          <input :value="uiStore.currentUser.email" readonly aria-readonly="true" />
        </label>

        <label class="form-field">
          <span class="field-label-row">
            {{ t('auth.fields.nickname') }}
            <small>{{ nickname.length }}/20</small>
          </span>
          <input v-model="nickname" maxlength="20" :placeholder="t('profile.edit.nicknamePlaceholder')" @blur="validateNickname" />
          <em v-if="nicknameError" class="field-error">{{ nicknameError }}</em>
        </label>

        <label class="form-field">
          <span class="field-label-row">
            {{ t('profile.edit.intro') }}
            <small>{{ bio.length }}/50</small>
          </span>
          <input v-model="bio" maxlength="50" :placeholder="t('profile.edit.introPlaceholder')" />
        </label>

        <div class="form-divider"></div>
        <FormStatusNotice
          v-if="saveNotice"
          :tone="saveNotice.tone"
          :title="saveNotice.title"
          :text="saveNotice.text"
        />

        <div class="preference-block compact">
          <h2>{{ t('preferences.groups.contentTypes') }}</h2>
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
              {{ preferenceLabel('contentTypes', item) }}
            </button>
          </div>
        </div>

        <div class="preference-block compact">
          <h2>{{ t('preferences.groups.regions') }}</h2>
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
              {{ preferenceLabel('regions', item) }}
            </button>
          </div>
        </div>

        <div class="preference-block compact">
          <h2>{{ t('preferences.groups.themes') }}</h2>
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
              {{ preferenceLabel('themes', item) }}
            </button>
          </div>
        </div>
      </div>

      <div class="sticky-actions">
        <BaseButton block :disabled="saving" @click="saveProfile">{{ saving ? t('profile.edit.savingProfile') : t('profile.edit.saveProfile') }}</BaseButton>
        <BaseButton variant="ghost" block @click="router.push('/my')">{{ t('common.cancel') }}</BaseButton>
      </div>
      <div v-if="cropEditorOpen" class="profile-crop-backdrop" @click.self="cancelCropEdit">
        <section class="profile-crop-sheet" role="dialog" aria-modal="true" aria-labelledby="profile-crop-title">
          <div class="profile-crop-head">
            <h2 id="profile-crop-title">{{ t('profile.edit.crop.title') }}</h2>
            <p>{{ t('profile.edit.crop.description') }}</p>
          </div>
          <div
            ref="cropPreviewRef"
            class="profile-crop-preview"
            :class="{ 'is-dragging': cropDrag.active }"
            :aria-label="t('profile.edit.crop.previewAria')"
            @pointerdown="startCropDrag"
            @pointermove="moveCropDrag"
            @pointerup="endCropDrag"
            @pointercancel="endCropDrag"
            @wheel.prevent="adjustCropZoom"
          >
            <img
              v-if="cropImageUrl"
              :src="cropImageUrl"
              :alt="t('profile.edit.crop.imageAlt')"
              :style="profileCropImageStyle"
              draggable="false"
              @load="onCropImageLoad"
            />
          </div>
          <p class="profile-crop-help">{{ t('profile.edit.crop.help') }}</p>
          <div class="profile-crop-controls">
            <label>
              {{ t('profile.edit.crop.zoom') }}
              <input v-model.number="cropScale" type="range" min="1" max="2.4" step="0.05" />
            </label>
          </div>
          <div class="profile-crop-actions">
            <button type="button" class="profile-crop-rotate" @click="rotateCropImage">{{ t('profile.edit.crop.rotate') }}</button>
            <BaseButton variant="ghost" block @click="cancelCropEdit">{{ t('common.cancel') }}</BaseButton>
            <BaseButton block @click="applyCroppedImage">{{ t('profile.edit.crop.apply') }}</BaseButton>
          </div>
        </section>
      </div>
    </section>
  </AppLayout>
</template>
