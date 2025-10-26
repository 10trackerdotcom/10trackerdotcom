'use client';

import { useState } from 'react';

export default function TaskModal({ day, tasks, focus, resources, onClose, onAddTask }) {
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({
    taskName: '',
    taskCategory: '',
    status: 'Not Started' // Default status
  });
  
  // Parse tasks and create an array of task objects
  const taskList = tasks.split('. ')
    .filter(task => task.trim().length > 0)
    .map((task, index) => ({
      id: index,
      name: task,
      category: index % 2 === 0 ? 'Java' : 'Aptitude', // Example categorization
      status: 'Not Started'
    }));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onAddTask) {
      onAddTask(day, newTask);
    }
    setNewTask({
      taskName: '',
      taskCategory: '',
      status: 'Not Started'
    });
    setShowForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-screen overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Day {day} Tasks: {focus}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Resources:</h3>
          <p>{resources}</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3">Task</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {taskList.map((task) => (
                <tr key={task.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{task.name}</td>
                  <td className="p-3">{task.category}</td>
                  <td className="p-3">
                    <select 
                      className="border rounded px-2 py-1"
                      defaultValue={task.status}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <button className="text-blue-600 hover:underline mr-2">
                      Edit
                    </button>
                    <button className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add New Task
          </button>
        ) : (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-semibold mb-2">Add New Task</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Name
                </label>
                <input
                  type="text"
                  name="taskName"
                  value={newTask.taskName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="taskCategory"
                  value={newTask.taskCategory}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select category</option>
                  <option value="Java">Java</option>
                  <option value="Aptitude">Aptitude</option>
                  <option value="DSA">DSA</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}