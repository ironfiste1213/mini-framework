import { createElement, mount, useState, useEffect, useRef } from '../framework/index.js'

const STORAGE_KEY = 'todomvc-mini-framework'

function TodoItem({ todo, isEditing, editText, onStartEdit, onEditChange, onKeyDown, onBlur, onToggle, onDestroy }) {
  let liClass = ''
  if (todo.completed) liClass += ' completed'
  if (isEditing) liClass += ' editing'

  return createElement('li', { className: liClass.trim() },
    createElement('div', { className: 'view' },
      createElement('input', {
        className: 'toggle',
        type: 'checkbox',
        checked: todo.completed,
        onChange: () => onToggle(todo.id)
      }),
      createElement('label', { onDblClick: () => onStartEdit(todo) }, todo.title),
      createElement('button', { className: 'destroy', onClick: () => onDestroy(todo.id) })
    ),
    isEditing && createElement('input', {
      className: 'edit',
      value: editText,
      onInput: (e) => onEditChange(e.target.value),
      onKeyDown: onKeyDown,
      onBlur: onBlur
    })
  )
}

function TodoApp() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })
  const [newText, setNewText] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.slice(1)
    if (hash === '/active') return 'active'
    if (hash === '/completed') return 'completed'
    return 'all'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1)
      if (hash === '/active') setRoute('active')
      else if (hash === '/completed') setRoute('completed')
      else setRoute('all')
    }

    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  useEffect(() => {
    if (editingId) {
      const editInput = document.querySelector('li.editing .edit')
      if (editInput) {
        editInput.focus()
        editInput.selectionStart = editInput.value.length
      }
    }
  }, [editingId])

  const addTodo = (title) => {
    const trimmed = title.trim()
    if (trimmed) {
      setTodos([...todos, { id: Date.now().toString(), title: trimmed, completed: false }])
      setNewText('')
    }
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const destroyTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setEditText('')
    }
  }

  const saveTodo = (id, title) => {
    setTodos(todos.map(t => t.id === id ? { ...t, title } : t))
  }

  const startEdit = (todo) => {
    setEditingId(todo.id)
    setEditText(todo.title)
  }

  const submitEdit = () => {
    if (!editingId) return
    const trimmed = editText.trim()
    if (trimmed) {
      saveTodo(editingId, trimmed)
    } else {
      destroyTodo(editingId)
    }
    setEditingId(null)
    setEditText('')
  }

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      submitEdit()
    } else if (e.key === 'Escape') {
      setEditingId(null)
      setEditText('')
    }
  }

  const toggleAll = () => {
    const areAllCompleted = todos.every(t => t.completed)
    setTodos(todos.map(t => ({ ...t, completed: !areAllCompleted })))
  }

  const clearCompleted = () => {
    setTodos(todos.filter(t => !t.completed))
  }

  const activeCount = todos.filter(t => !t.completed).length
  const completedCount = todos.length - activeCount

  const filteredTodos = todos.filter(todo => {
    if (route === 'active') return !todo.completed
    if (route === 'completed') return todo.completed
    return true
  })

  return createElement('div', null,
    createElement('header', { className: 'header' },
      createElement('h1', null, 'todos'),
      createElement('input', {
        className: 'new-todo',
        placeholder: 'What needs to be done?',
        autoFocus: true,
        value: newText,
        onInput: (e) => setNewText(e.target.value),
        onKeyDown: (e) => {
          if (e.key === 'Enter') {
            addTodo(newText)
          }
        }
      })
    ),
    todos.length > 0 && createElement('section', { className: 'main' },
      createElement('input', {
        id: 'toggle-all',
        className: 'toggle-all',
        type: 'checkbox',
        checked: activeCount === 0,
        onChange: toggleAll,
        onClick: toggleAll
      }),
      createElement('label', { htmlFor: 'toggle-all', onClick: toggleAll }, 'Mark all as complete'),
      createElement('ul', { className: 'todo-list' },
        ...filteredTodos.map(todo =>
          TodoItem({
            todo,
            isEditing: editingId === todo.id,
            editText: editingId === todo.id ? editText : todo.title,
            onStartEdit: startEdit,
            onEditChange: setEditText,
            onKeyDown: handleEditKeyDown,
            onBlur: submitEdit,
            onToggle: toggleTodo,
            onDestroy: destroyTodo
          })
        )
      )
    ),
    todos.length > 0 && createElement('footer', { className: 'footer' },
      createElement('span', { className: 'todo-count' },
        createElement('strong', null, activeCount),
        ` item${activeCount === 1 ? '' : 's'} left`
      ),
      createElement('ul', { className: 'filters' },
        createElement('li', null,
          createElement('a', { href: '#/', className: route === 'all' ? 'selected' : '' }, 'All')
        ),
        createElement('li', null,
          createElement('a', { href: '#/active', className: route === 'active' ? 'selected' : '' }, 'Active')
        ),
        createElement('li', null,
          createElement('a', { href: '#/completed', className: route === 'completed' ? 'selected' : '' }, 'Completed')
        )
      ),
      completedCount > 0 && createElement('button', {
        className: 'clear-completed',
        onClick: clearCompleted
      }, 'Clear completed')
    )
  )
}

const appContainer = document.getElementById('app')
if (appContainer) {
  mount(TodoApp, appContainer)
}

