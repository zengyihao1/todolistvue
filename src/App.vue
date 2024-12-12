<template>
  <div class="min-h-screen p-4 sm:p-6 md:p-8 bg-white dark:bg-gray-900">
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- 标题和工具栏 -->
      <header class="flex items-center justify-between">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Todo List
        </h1>
        <div class="flex items-center gap-2">
          <button
            @click="openTabManager"
            class="btn-secondary p-2 hover:scale-105 transition-transform"
            title="管理列表"
          >
            <cog-icon class="w-5 h-5" />
          </button>
          <button
            @click="toggleDarkMode"
            class="btn-secondary p-2 hover:scale-105 transition-transform"
            :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
          >
            <sun-icon v-if="isDark" class="w-5 h-5" />
            <moon-icon v-else class="w-5 h-5" />
          </button>
        </div>
      </header>
      
      <!-- Tab 切换按钮 -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="currentTab = tab.id"
          :class="[
            'btn-secondary px-6 py-2 transition-all duration-200',
            currentTab === tab.id 
              ? 'bg-primary text-white hover:bg-primary-dark dark:bg-primary dark:text-white dark:hover:bg-primary-dark scale-105' 
              : 'hover:scale-105'
          ]"
        >
          {{ tab.name }}
        </button>
      </div>

      <!-- Tab 内容 -->
      <div class="relative min-h-[500px] overflow-hidden">
        <Transition name="fade" mode="out-in">
          <div
            v-if="currentTab && tabs.length > 0"
            :key="currentTab"
            class="w-full h-full p-6"
          >
            <TodoList 
              v-if="currentTabIndex >= 0"
              :list-id="tabs[currentTabIndex].id" 
              :list-name="tabs[currentTabIndex].name" 
            />
          </div>
        </Transition>
      </div>
    </div>

    <!-- Tab 管理弹窗 -->
    <TransitionRoot appear :show="isTabManagerOpen" as="template">
      <Dialog as="div" @close="closeTabManager" class="relative z-10">
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
                  管理列表
                </DialogTitle>
                
                <!-- Tab 列表 -->
                <div class="mt-4 space-y-4">
                  <div 
                    v-for="(tab, index) in tabs" 
                    :key="tab.id" 
                    class="flex items-center gap-2"
                    :class="{ 'opacity-75': tab.name === '总览' }"
                  >
                    <div class="flex-none flex gap-2">
                      <button
                        v-if="!tab.fixed && index > 1 && tab.name !== '总览'"
                        @click="moveTab(index, index - 1)"
                        class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="上移"
                      >
                        <chevron-up-icon class="w-4 h-4" />
                      </button>
                      <button
                        v-if="!tab.fixed && index < tabs.length - 1 && tab.name !== '总览'"
                        @click="moveTab(index, index + 1)"
                        class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="下移"
                      >
                        <chevron-down-icon class="w-4 h-4" />
                      </button>
                      <div v-if="tab.name === '总览'" class="w-8"></div>
                    </div>
                    <input
                      v-model="tabEdits[tab.id]"
                      type="text"
                      class="input flex-1"
                      :class="{ 'cursor-not-allowed bg-gray-100 dark:bg-gray-700': tab.name === '总览' }"
                      :placeholder="tab.name"
                      :disabled="tab.name === '总览'"
                      :title="tab.name === '总览' ? '总览列表不可编辑' : ''"
                    />
                    <button
                      v-if="!tab.fixed && tab.name !== '总览' && tabEdits[tab.id] !== '总览'"
                      @click="deleteTab(tab.id)"
                      class="btn-secondary p-2 text-red-500 hover:text-red-600"
                      :disabled="tabs.length <= 2"
                    >
                      <trash-icon class="w-5 h-5" />
                    </button>
                    <div v-if="tab.name === '总览' || tabEdits[tab.id] === '总览'" class="w-9"></div>
                  </div>
                </div>

                <!-- 添加新列表 -->
                <div class="mt-4">
                  <input
                    v-model="newTabName"
                    type="text"
                    class="input"
                    placeholder="新列表名称"
                    @keyup.enter="addTab"
                  />
                </div>

                <!-- 操作按钮 -->
                <div class="mt-6 flex justify-end gap-2">
                  <button
                    @click="closeTabManager"
                    class="btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    @click="saveChanges"
                    class="btn-primary"
                  >
                    保存
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- 确认对话框 -->
    <ConfirmDialog
      :is-open="confirmDialog.isOpen"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :type="confirmDialog.type"
      :confirm-text="confirmDialog.confirmText"
      :cancel-text="confirmDialog.cancelText"
      @confirm="confirmDialog.onConfirm"
      @cancel="confirmDialog.onCancel"
    />
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { useToast } from 'vue-toastification'
import { 
  SunIcon as MoonIcon, 
  MoonIcon as SunIcon,
  CogIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  LockClosedIcon
} from '@heroicons/vue/24/outline'
import { 
  Dialog, 
  DialogPanel, 
  DialogTitle, 
  TransitionChild, 
  TransitionRoot 
} from '@headlessui/vue'
import TodoList from './components/TodoList.vue'
import { todoApi, listTypeMap, addListTypeMapping, removeListTypeMapping } from './services/todoApi'
import ConfirmDialog from './components/ConfirmDialog.vue'

const toast = useToast()

// 暗色模式
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
  storage: localStorage,
  storageKey: 'todo-theme-preference',
  disableTransition: false
})

// 切换函数
const toggleDarkMode = () => {
  isDark.value = !isDark.value
  localStorage.setItem('todo-theme-preference', isDark.value ? 'dark' : '')
}

// Tab 管理
const isTabManagerOpen = ref(false)
const newTabName = ref('')
const tabEdits = reactive({})

// Tab 配置
const defaultTabs = [
  { id: 'overview', name: '总览', fixed: true },  // 确保总览 tab 的 id 始终是 'overview'
  { id: 'xiaojia', name: '小家' },
  { id: 'mengder', name: '蒙der' },
  { id: 'zengshuaishuai', name: '曾帅帅' }
]

// 从 localStorage 获取 tabs，如果没有则使用默认值
const savedTabs = localStorage.getItem('todo-tabs')
const tabs = ref(savedTabs ? JSON.parse(savedTabs) : defaultTabs)

// 确保总览 tab 始终存在且 id 正确
if (!tabs.value.some(tab => tab.id === 'overview')) {
  tabs.value.unshift({ id: 'overview', name: '总览', fixed: true })
}

// 默认选中总览 tab
const currentTab = ref(localStorage.getItem('current-tab') || 'overview')

// 监听 tabs 变化并保存到本地存储
watch(tabs, (newTabs) => {
  // 确保总览 tab 的 id 不会被修改
  const updatedTabs = newTabs.map(tab => {
    if (tab.name === '总览') {
      return { ...tab, id: 'overview', fixed: true }
    }
    return tab
  })
  localStorage.setItem('todo-tabs', JSON.stringify(updatedTabs))
}, { deep: true })

// 监听 currentTab 变化并保存到本地存储
watch(currentTab, (newTab) => {
  localStorage.setItem('current-tab', newTab)
})

// 添加新 Tab
const addTab = () => {
  if (newTabName.value.trim()) {
    const name = newTabName.value.trim()
    const id = `tab_${Date.now()}`
    
    // 检查名称长度
    if (name.length > 10) {
      toast.error('表名不能超过10字���')
      return
    }
    
    // 检查是否已存在相同名称的 Tab
    if (tabs.value.some(tab => tab.name === name)) {
      toast.error('列表名称已存在')
      return
    }
    
    const newTab = { id, name }
    // 更新 listTypeMap
    addListTypeMapping(id, name)
    
    // 更新 tabs
    tabs.value.push(newTab)
    tabEdits[id] = name
    currentTab.value = id
    newTabName.value = ''
    toast.success('添加成功')
    
    // 关闭管理弹窗
    closeTabManager()
  } else {
    toast.error('列表名称不能为空')
  }
}

// 确认对话框状态
const confirmDialog = reactive({
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
  confirmText: '确定',
  cancelText: '取消',
  onConfirm: () => {},
  onCancel: () => {
    confirmDialog.isOpen = false
  }
})

// 删除 Tab
const deleteTab = (id) => {
  const tab = tabs.value.find(t => t.id === id)
  if (tab.fixed) {
    toast.error('该列表不能删除')
    return
  }
  if (tabs.value.length > 1) {
    confirmDialog.title = '删除列表'
    confirmDialog.message = `确定要删除"${tab.name}"列表吗？此操作不可撤销。`
    confirmDialog.type = 'danger'
    confirmDialog.confirmText = '删除'
    confirmDialog.cancelText = '取消'
    confirmDialog.onConfirm = () => {
      const index = tabs.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tabs.value = tabs.value.filter(t => t.id !== id)
        if (currentTab.value === id) {
          currentTab.value = tabs.value[0].id
        }
        delete tabEdits[id]
        // 删除映射
        removeListTypeMapping(id)
        toast.success(`已删除"${tab.name}"列表`)
      }
      confirmDialog.isOpen = false
    }
    confirmDialog.isOpen = true
  } else {
    toast.error('至少保留一个列表')
  }
}

// 保存更改
const saveChanges = () => {
  // 检查是否有重复的名称
  const names = new Set()
  for (const id in tabEdits) {
    const tab = tabs.value.find(t => t.id === id)
    const name = tabEdits[id].trim()

    // 不允许将其他 tab 改名为"总览"
    if (name === '总览' && tab.id !== 'overview') {
      toast.error('不能使用"总览"作为列表名称')
      return
    }

    if (tab.fixed) {
      // 如果是固定 tab，使用原始名称
      tabEdits[id] = tab.name
      continue
    }
    
    if (names.has(name)) {
      toast.error('列表名称不能重复')
      return
    }
    if (!name) {
      toast.error('列表名称不能为空')
      return
    }
    names.add(name)
  }

  // 保存更改
  tabs.value = tabs.value.map(tab => {
    if (tab.fixed) {
      return tab  // 固 tab 保持不变
    }
    const newName = tabEdits[tab.id].trim()
    addListTypeMapping(tab.id, newName)
    return {
      ...tab,
      name: newName
    }
  })
  
  closeTabManager()
  toast.success('保存成功')
}

// 打开 Tab 管理器
const openTabManager = () => {
  isTabManagerOpen.value = true
  // 初始化编辑状态
  tabs.value.forEach(tab => {
    tabEdits[tab.id] = tab.name
  })
}

// 关闭 Tab 管理器
const closeTabManager = () => {
  isTabManagerOpen.value = false
  newTabName.value = ''
  // 重置编辑状态
  tabs.value.forEach(tab => {
    tabEdits[tab.id] = tab.name
  })
}

// 添加排序函数
const moveTab = (fromIndex, toIndex) => {
  // 不允许移动固定 tab
  if (tabs.value[fromIndex].fixed) {
    return
  }
  // 不允许其他 tab 移动到固定 tab 的位置
  if (toIndex === 0) {
    return
  }
  const tab = tabs.value.splice(fromIndex, 1)[0]
  tabs.value.splice(toIndex, 0, tab)
}

// 添加计算属性获取当前 tab 索引
const currentTabIndex = computed(() => {
  const index = tabs.value.findIndex(tab => tab.id === currentTab.value)
  return index >= 0 ? index : 0  // 如果找不到，返回第一个 tab 的索引
})

// 在 script setup 中添加一个函数来删除指定 tab
const removeTabById = (targetId) => {
  const tab = tabs.value.find(t => t.id === targetId)
  if (tab) {
    tabs.value = tabs.value.filter(t => t.id !== targetId)
    if (currentTab.value === targetId) {
      currentTab.value = tabs.value[0].id
    }
    delete tabEdits[targetId]
    removeListTypeMapping(targetId)
    console.log(`已删除 ID 为 ${targetId} 的 tab`)
  }
}

// 在控制台中调用这个函数
removeTabById('tab_1733379560255')

// 在 script setup 中添加
onMounted(() => {
  // 删除指定的 tab
  removeTabById('tab_1733379560255')
})
</script>

<style scoped>
/* 淡入淡出效果 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* 确保内容容器始终占满空间 */
.relative {
  min-height: inherit;
  height: 100%;
}
</style>
