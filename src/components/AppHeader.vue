<template>
  <van-nav-bar
    :title="title"
    :left-text="leftText"
    :left-arrow="leftArrow"
    :fixed="fixed"
    :placeholder="placeholder"
    @click-left="onClickLeft"
  >
    <template #right v-if="$slots.right">
      <slot name="right" />
    </template>
  </van-nav-bar>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  title: { type: String, default: '' },
  leftText: { type: String, default: '' },
  leftArrow: { type: Boolean, default: true },
  fixed: { type: Boolean, default: true },
  placeholder: { type: Boolean, default: true }
})

const emit = defineEmits(['click-left'])

const router = useRouter()

function onClickLeft() {
  emit('click-left')
  if (props.leftArrow && !props.leftText) {
    router.back()
  }
}
</script>
