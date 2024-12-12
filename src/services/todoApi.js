import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// listId 到 listType 的映射
export const listTypeMap = {
  ...JSON.parse(localStorage.getItem('listTypeMap') || '{}'),
  'xiaojia': '小家',
  'mengder': '蒙der',
  'zengshuaishuai': '曾帅帅'
}

// 动态添加新的映射
export const addListTypeMapping = (id, name) => {
  listTypeMap[id] = name
  const currentMappings = { ...listTypeMap }
  localStorage.setItem('listTypeMap', JSON.stringify(currentMappings))
}

// 删除映射
export const removeListTypeMapping = (id) => {
  delete listTypeMap[id]
  const currentMappings = { ...listTypeMap }
  localStorage.setItem('listTypeMap', JSON.stringify(currentMappings))
}

export const todoApi = {
  // 获取所有待办事项
  getAllTodos(listId) {
    if (listId === 'overview') {
      return api.get('/todos')  // 总览模式获取所有待办事项
    }
    const listType = listTypeMap[listId]
    return api.get(`/todos/type/${encodeURIComponent(listType)}`)  // 按类型获取
  },

  // 创建待办事项
  createTodo(content, listId) {
    if (listId === 'overview') {
      throw new Error('总览模式下不能创建待办事项')
    }
    return api.post('/todos', {
      content,
      listType: listTypeMap[listId],
      creator: '张三',
      isRepeat: false  // 添加 isRepeat 字段
    })
  },

  // 更新待办事项状态
  updateTodo(id, { content, status, isRepeat }) {
    if (content) {
      // 全量更新
      return api.put(`/todos/${id}`, {
        content,
        status,
        creator: 'zyh',
        isRepeat
      })
    } else {
      // 仅更新状态，但也要传递 isRepeat
      return api.put(`/todos/${id}`, {
        status,
        isRepeat
      })
    }
  },

  // 删除待办事项
  deleteTodo(id) {
    return api.delete(`/todos/${id}`)
  },

  // 根据ID获取待办事项
  getTodoById(id) {
    return api.get(`/todos/${id}`)
  },

  // 切换待办事项的重复状态
  toggleRepeat(id, currentIsRepeat, currentStatus) {
    // 更新 isRepeat 字段，同时传递当前的 status 值
    return api.put(`/todos/${id}`, {
      isRepeat: !currentIsRepeat,
      status: currentStatus
    })
  }
} 