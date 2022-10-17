import React, { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import TopTodo from "./TopTodo";
import EditableTodoList from "./EditableTodoList";
import TodoForm from "./TodoForm";
import useLocalStorage from "../../../customHooks/useLocalStorage";

/** App for managing a todo list.
 *
 * Props:
 * - initialTodos: possible array of [ todo, ... ]
 *
 * State:
 * - todos: array of [ todo, ... ]
 *
 * App -> TodoApp -> { TodoForm, EditableTodoList }
 */

export default function TodoApp({ initialTodos }) {


  const [localTodos, setLocalTodos] = useLocalStorage("todos");
  const [todos, setTodos] = useState(
    //if no local todos, use initial todos
    localTodos ? JSON.parse(localTodos) : initialTodos);

  /** add a new todo to list */
  function create(newTodo) {
    let todo = { ...newTodo, id: uuid(), isDone: false };
    setTodos((todos) => [...todos, todo]);
  }

  useEffect(() => {
    const todoString = JSON.stringify(todos);
    setLocalTodos(todoString);
  }, [todos, setTodos]);


  /** update a todo with updatedTodo */
  function update(updatedTodo) {
    setTodos(() =>
      todos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo))
    );
  }

  /** delete a todo by id */
  function remove(id) {
    setTodos(() => todos.filter((todo) => todo.id !== id));
  }

  function finishTodo(todoDone) {
    console.log(todoDone);
    todoDone.isDone = !todoDone.isDone;

    setTodos(() =>
      todos.map((todo) => (todo.id === todoDone.id ? todoDone : todo))
    );
  }

  return (
    <main className="TodoApp">
      <div className="row">
        <div className="col-md-6">
          {todos.length > 0 ? (
            <EditableTodoList
              todos={todos}
              update={update}
              remove={remove}
              finishTodo={finishTodo}
            />
          ) : (
            <span className="text-muted">You have no todos.</span>
          )}
        </div>

        <div className="col-md-6">
          {todos.length > 0 && (
            <section className="mb-4">
              <h3>Top Todo</h3>
              <TopTodo todos={todos} finishTodo={finishTodo} />
            </section>
          )}

          <section>
            <h3 className="mb-3">Add Nü</h3>
            <TodoForm handleSave={create} />
          </section>
        </div>
      </div>
    </main>
  );
}
