/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { FormEvent, useEffect, useState } from 'react';
import { USER_ID, getTodos, postTodo, updateTodo } from './api/todos';
import { Todo } from './types/Todo';
import { client } from './utils/fetchClient';

export enum FilterType {
  All = 'all',
  Active = 'active',
  Completed = 'completed',
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [completed, setCompleted] = useState<boolean>(true);
  const [todo, setTodo] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [filter, setFilter] = useState<string>(FilterType.All);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState<string>('');

  const handleDoubleClick = (todoItem: Todo) => {
    setNewTitle(todoItem.title);
    setEditingId(todoItem.id);
  };

  const handleBlur = (todoItem: Todo) => {
    setEditingId(null);

    updateTodo({
      id: todoItem.id,
      completed: todoItem.completed,
      userId: todoItem.userId,
      title: newTitle,
    })
      .then(updatedTodo => {
        setTodos(prevTodos =>
          prevTodos.map(t => (t.id === updatedTodo.id ? updatedTodo : t)),
        );
      })
      .catch(() => {
        setErrorMessage('Unable to update a todo');
        setTimeout(() => setErrorMessage(''), 3000);
      });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  };

  useEffect(() => {
    const fetchTodos = () => {
      getTodos()
        .then(todosList => {
          switch (filter) {
            case FilterType.Active:
              setTodos(todosList.filter(tod => !tod.completed));
              break;
            case FilterType.Completed:
              setTodos(todosList.filter(tod => tod.completed));
              break;
            default:
              setTodos(todosList);
              break;
          }
        })
        .catch(() => {
          setErrorMessage('Unable to load todos');
          setTimeout(() => setErrorMessage(''), 3000);
        });
    };

    fetchTodos();
  }, [filter]);

  useEffect(() => {
    if (todos.filter(tod => !tod.completed).length === todos.length) {
      setCompleted(true);
    } else {
      setCompleted(false);
    }
  }, [todos]);

  const addTodo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!todo.trim()) {
      setErrorMessage('Title should not be empty');

      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    postTodo({
      userId: USER_ID,
      title: todo,
      completed: false,
    })
      .then(newTodo => {
        setTodos(prev => [...prev, newTodo]);
        setTodo('');
      })
      .catch(() => {
        setErrorMessage('Unable to add a todo');
        setTimeout(() => setErrorMessage(''), 3000);
      });
  };

  const deleteTodoHandler = (todoId: number) => {
    client
      .delete(`/todos/${todoId}`)
      .then(() => {
        setTodos(prevTodos => prevTodos.filter(t => t.id !== todoId));
      })
      .catch(() => {
        setErrorMessage('Unable to delete a todo');
        setTimeout(() => setErrorMessage(''), 3000);
      });
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    todoItem: Todo,
  ) => {
    if (e.key === 'Enter') {
      handleBlur(todoItem);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const updateCompleted = (todoItem: Todo) => {
    updateTodo({
      id: todoItem.id,
      completed: !todoItem.completed,
      userId: todoItem.userId,
      title: todoItem.title,
    })
      .then(updatedTodo => {
        setTodos(prevTodos =>
          prevTodos.map(t => (t.id === updatedTodo.id ? updatedTodo : t)),
        );
      })
      .catch(() => {
        setErrorMessage('Unable to update a todo');
        setTimeout(() => setErrorMessage(''), 3000);
      });
  };

  const ClearCompleted = () => {
    const completedTodos = todos.filter(tod => tod.completed);

    Promise.all(completedTodos.map(tod => deleteTodoHandler(tod.id)));
  };

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          <button
            type="button"
            className="todoapp__toggle-all active"
            data-cy="ToggleAllButton"
          />

          <form onSubmit={addTodo}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={todo}
              onChange={e => setTodo(e.target.value)}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {todos.map(todoItem => (
            <div
              data-cy="Todo"
              className={`todo ${todoItem.completed ? 'completed' : ''}`}
              key={todoItem.id}
            >
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  checked={todoItem.completed}
                  onChange={() => updateCompleted(todoItem)}
                />
              </label>

              {editingId === todoItem.id ? (
                <input
                  data-cy="TodoEditInput"
                  type="text"
                  className="todo__edit"
                  value={newTitle}
                  onChange={handleChange}
                  onBlur={() => handleBlur(todoItem)}
                  onKeyDown={e => handleKeyDown(e, todoItem)}
                  autoFocus
                />
              ) : (
                <span
                  data-cy="TodoTitle"
                  className="todo__title"
                  onDoubleClick={() => handleDoubleClick(todoItem)}
                >
                  {todoItem.title}
                </span>
              )}

              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
                onClick={() => deleteTodoHandler(todoItem.id)}
              >
                ×
              </button>
            </div>
          ))}
        </section>
        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {todos.filter(tod => !tod.completed).length} items left
            </span>

            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={`filter__link ${filter === FilterType.All ? 'selected' : ''}`}
                data-cy="FilterLinkAll"
                onClick={() => setFilter(FilterType.All)}
              >
                All
              </a>

              <a
                href="#/active"
                className={`filter__link ${filter === FilterType.Active ? 'selected' : ''}`}
                data-cy="FilterLinkActive"
                onClick={() => setFilter(FilterType.Active)}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={`filter__link ${filter === FilterType.Completed ? 'selected' : ''}`}
                data-cy="FilterLinkCompleted"
                onClick={() => setFilter(FilterType.Completed)}
              >
                Completed
              </a>
            </nav>

            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              onClick={() => ClearCompleted()}
              disabled={completed}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      {errorMessage && (
        <div
          data-cy="ErrorNotification"
          className="notification is-danger is-light has-text-weight-normal"
        >
          <button
            data-cy="HideErrorButton"
            type="button"
            className="delete"
            onClick={() => setErrorMessage('')}
          />

          {errorMessage}
        </div>
      )}
    </div>
  );
};
