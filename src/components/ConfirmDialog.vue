<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog 
      as="div" 
      @close="onCancel" 
      class="relative z-20"
      @keydown.enter="onConfirm"
      @keydown.esc="onCancel"
    >
      <TransitionChild
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
              <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                {{ title }}
              </DialogTitle>
              
              <div class="mt-2">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ message }}
                </p>
              </div>

              <div class="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  @click="onCancel"
                  class="btn-secondary"
                >
                  {{ cancelText }} (Esc)
                </button>
                <button
                  type="button"
                  @click="onConfirm"
                  :class="['btn', confirmButtonClass, 'text-white']"
                  ref="confirmButton"
                >
                  {{ confirmText }} (Enter)
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: '确认'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'warning', 'danger'].includes(value)
  }
})

const emit = defineEmits(['confirm', 'cancel'])
const confirmButton = ref(null)

// 当对话框打开时自动聚焦确定按钮
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    nextTick(() => {
      confirmButton.value?.focus()
    })
  }
})

// 根据类型返回按钮样式
const confirmButtonClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'bg-red-500 hover:bg-red-600 focus:ring-red-500/50'
    case 'warning':
      return 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500/50'
    default:
      return 'bg-primary hover:bg-primary-dark focus:ring-primary/50'
  }
})

const onConfirm = () => emit('confirm')
const onCancel = () => emit('cancel')
</script> 