<template>
  <div class="space-y-6">
    <!-- 添加新任务 -->
    <div v-if="!isOverview" class="flex gap-2">
      <input
        v-model="newTodo"
        @keyup.enter="addTodo"
        type="text"
        placeholder="添加新的待办事项..."
        class="input flex-1"
        :disabled="loading"
      />
      <button 
        @click="addTodo" 
        class="btn-primary flex items-center gap-2"
        :disabled="loading"
      >
        <plus-icon class="w-5 h-5" />
        {{ loading ? '添加中...' : '添加' }}
      </button>
    </div>

    <!-- 过滤器和统计 -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <button
          v-for="filter in filters"
          :key="filter.value"
          @click="currentFilter = filter.value"
          :class="[
            'btn-secondary px-3 py-1.5',
            currentFilter === filter.value 
              ? 'bg-primary text-white hover:bg-primary-dark dark:bg-primary dark:text-white dark:hover:bg-primary-dark' 
              : ''
          ]"
        >
          {{ filter.label }}
        </button>
      </div>
      
      <div class="text-sm text-gray-600 dark:text-gray-400">
        完成度: {{ completionRate }}%
      </div>
    </div>

    <!-- Loading 状态 -->
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    </div>

    <!-- Todo列表 -->
    <TransitionGroup
      v-else
      tag="ul"
      class="space-y-2"
      name="list"
      appear
    >
      <li
        v-for="todo in filteredTodos"
        :key="todo.id"
        class="group flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm 
               hover:shadow-md transition-all duration-200 animate-fade-in"
        @dblclick="toggleRepeat(todo)"
      >
        <button
          @click="toggleTodo(todo)"
          class="flex-shrink-0"
        >
          <check-circle-icon
            :class="[
              'w-6 h-6 transition-colors duration-200',
              todo.status ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'
            ]"
          />
        </button>
        
        <div class="flex-1">
          <span
            :class="[
              'block transition-all duration-200',
              todo.status ? 'text-gray-400 line-through' : '',
              todo.isRepeat ? 'text-red-500' : ''
            ]"
          >
            {{ todo.content }}
          </span>
          <div class="text-xs text-gray-500 dark:text-gray-400 flex gap-2">
            <span>{{ formatDate(todo.createTime) }}</span>
            <span v-if="isOverview">{{ todo.listType }}</span>
            <span v-if="todo.isRepeat" class="text-red-500">重复</span>
          </div>
        </div>

        <button
          @click="removeTodo(todo)"
          class="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <trash-icon class="w-5 h-5 text-red-500 hover:text-red-600" />
        </button>
      </li>
    </TransitionGroup>

    <!-- 空状态 -->
    <div
      v-if="!loading && filteredTodos.length === 0"
      class="text-center py-8 text-gray-500 dark:text-gray-400"
    >
      {{ currentFilter === 'all' ? '还没有待办事项' : '没有符合条件的待办事项' }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import {
  PlusIcon,
  CheckCircleIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import { todoApi, listTypeMap } from '../services/todoApi'

const toast = useToast()

// 状态
const todos = ref([])
const newTodo = ref('')
const currentFilter = ref('active')
const loading = ref(false)

// 过滤器选项
const filters = [
  { label: '待完成', value: 'active' },
  { label: '已完成', value: 'completed' },
  { label: '全部', value: 'all' }
]

// 添加 props
const props = defineProps({
  listId: {
    type: String,
    required: true
  },
  listName: {
    type: String,
    required: true
  }
})

// 计算是否是总览模式
const isOverview = computed(() => props.listId === 'overview')

// 获取所有待办事项
const fetchTodos = async () => {
  try {
    loading.value = true
    console.log(`开始获取${props.listName}待办事项，listId:`, props.listId)
    const response = await todoApi.getAllTodos(props.listId)
    console.log(`获取${props.listName}待办事项成功:`, response.data)
    
    // 处理响应数据
    if (Array.isArray(response.data)) {
      todos.value = response.data
    } else {
      todos.value = []
      console.warn('响应数据不是数组:', response.data)
    }
  } catch (error) {
    console.error(`获取${props.listName}待办事项失败:`, error)
    toast.error('获取待办事项失败')
    todos.value = []
  } finally {
    loading.value = false
  }
}

// 监听 listId 的变化
watch(() => props.listId, (newListId) => {
  console.log('listId changed:', newListId)
  fetchTodos()
}, { immediate: true })

// 添加待办事项
const addTodo = async () => {
  const text = newTodo.value.trim()
  if (text) {
    try {
      loading.value = true
      console.log(`开始添加${props.listName}待办事项:`, text)
      const response = await todoApi.createTodo(text, props.listId)
      console.log(`加${props.listName}待办事项成功:`, response.data)
      if (response.data.listType === listTypeMap[props.listId]) {
        // 新添加的项目始终在未完成项的最前面
        const uncompletedTodos = todos.value.filter(t => !t.status)
        const completedTodos = todos.value.filter(t => t.status)
        todos.value = [response.data, ...uncompletedTodos, ...completedTodos]
      }
      newTodo.value = ''
      toast.success('添加成功')
    } catch (error) {
      console.error(`添加${props.listName}待办事失败:`, error)
      toast.error('添加失败')
    } finally {
      loading.value = false
    }
  }
}

// 切换待办事项状态
const toggleTodo = async (todo) => {
  try {
    const newStatus = !todo.status
    await todoApi.updateTodo(todo.id, {
      content: todo.content,
      status: newStatus,
      isRepeat: todo.isRepeat
    })
    todo.status = newStatus
    // 重新排序数组
    todos.value = [...todos.value].sort((a, b) => {
      if (a.status === b.status) {
        return new Date(b.createTime) - new Date(a.createTime)
      }
      return a.status ? 1 : -1
    })
    toast.success(newStatus ? '已完成' : '已取消成')
  } catch (error) {
    toast.error('更新失败，请重试')
    console.error('新待办事项失败:', error)
  }
}

// 删除待办事项
const removeTodo = async (todo) => {
  try {
    await todoApi.deleteTodo(todo.id)
    const index = todos.value.indexOf(todo)
    todos.value.splice(index, 1)
    toast.success('删除功')
  } catch (error) {
    toast.error('删除失败，请试')
    console.error('删除待办事项失败:', error)
  }
}

// 计算属性
const filteredTodos = computed(() => {
  if (!Array.isArray(todos.value)) {
    console.warn('todos 不是数组:', todos.value)
    return []
  }
  
  // 按状态和时间排序
  const sortedTodos = [...todos.value].sort((a, b) => {
    // 先按状态排序
    if (a.status !== b.status) {
      return a.status ? 1 : -1
    }
    
    // 然后按时间排序
    return new Date(b.createTime) - new Date(a.createTime)
  })
  
  // 然后根据过滤条件筛选
  switch (currentFilter.value) {
    case 'active':
      return sortedTodos.filter(todo => !todo.status)
    case 'completed':
      return sortedTodos.filter(todo => todo.status)
    default:
      return sortedTodos
  }
})

const completionRate = computed(() => {
  if (!Array.isArray(todos.value) || todos.value.length === 0) return 0
  const completedCount = todos.value.filter(todo => todo.status).length
  return Math.round((completedCount / todos.value.length) * 100)
})

// 格式化日期的函数
const formatDate = (dateString) => {
  if (!dateString) return ''
  
  // 解析原始时间
  const date = new Date(dateString)
  
  // 式化年月日
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  // 格式化时分秒
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  // 返回格式化后的时间字符串
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 切换待办事项的重复状态
const toggleRepeat = async (todo) => {
  try {
    await todoApi.toggleRepeat(todo.id, todo.isRepeat, todo.status)
    todo.isRepeat = !todo.isRepeat
    toast.success(todo.isRepeat ? '已设为重复任务' : '已取消重复')
  } catch (error) {
    console.error('切换重复状态失败:', error)
    toast.error('操作失败，请重试')
  }
}
</script>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.list-leave-active {
  position: absolute;
  width: 100%;
}

/* 添加列表悬浮效果 */
.group {
  transition: all 0.3s ease;
}

.group:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style> 