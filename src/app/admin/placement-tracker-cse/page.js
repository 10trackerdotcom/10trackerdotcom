'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Scalable focus area options
const FOCUS_AREAS = [
  'Java',
  'Aptitude',
  'DSA',
  'Computer Networks',
  'Operating System',
  'DBMS'
  // Add more focus areas here as needed
];

export default function PlacementTrackerForm({ onAddEntry }) {
  const [formData, setFormData] = useState({
    dayNumber: '',
    focusAreas: [{ focus_area: '', tasks: [{ task_id: uuidv4(), task: '', resources: '' }] }],
    timeRequired: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e, focusIndex, taskIndex = null) => {
    const { name, value } = e.target;
    setFormData(prevData => {
      const newFocusAreas = [...prevData.focusAreas];
      if (taskIndex !== null) {
        // Update task or resources
        const newTasks = [...newFocusAreas[focusIndex].tasks];
        newTasks[taskIndex] = {
          ...newTasks[taskIndex],
          [name]: value,
          task_id: newTasks[taskIndex].task_id || uuidv4()
        };
                newFocusAreas[focusIndex] = { ...newFocusAreas[focusIndex], tasks: newTasks };
      } else {
        // Update focus area
        newFocusAreas[focusIndex] = { ...newFocusAreas[focusIndex], [name]: value };
      }
      return { ...prevData, focusAreas: newFocusAreas };
    });
  };

  const addFocusArea = () => {
    setFormData(prevData => ({
      ...prevData,
      focusAreas: [...prevData.focusAreas, { focus_area: '', tasks: [{ task: '', resources: '' }] }]
    }));
  };

  const removeFocusArea = (focusIndex) => {
    setFormData(prevData => ({
      ...prevData,
      focusAreas: prevData.focusAreas.filter((_, i) => i !== focusIndex)
    }));
  };

  const addTask = (focusIndex) => {
    setFormData(prevData => {
      const newFocusAreas = [...prevData.focusAreas];
      newFocusAreas[focusIndex] = {
        ...newFocusAreas[focusIndex],
        tasks: [
          ...newFocusAreas[focusIndex].tasks,
          { task_id: uuidv4(), task: '', resources: '' }
        ]
      };
      return { ...prevData, focusAreas: newFocusAreas };
    });
  };
  

  const removeTask = (focusIndex, taskIndex) => {
    setFormData(prevData => {
      const newFocusAreas = [...prevData.focusAreas];
      newFocusAreas[focusIndex] = {
        ...newFocusAreas[focusIndex],
        tasks: newFocusAreas[focusIndex].tasks.filter((_, i) => i !== taskIndex)
      };
      return { ...prevData, focusAreas: newFocusAreas };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Combine tasks and resources for duplicate focus areas
    const combinedFocusAreas = [];
    const focusAreaMap = new Map();

    formData.focusAreas.forEach(area => {
      if (!area.focus_area) return; // Skip empty focus areas
      if (focusAreaMap.has(area.focus_area)) {
        focusAreaMap.set(area.focus_area, [
          ...focusAreaMap.get(area.focus_area),
          ...area.tasks.filter(task => task.task) // Only include non-empty tasks
        ]);
      } else {
        focusAreaMap.set(area.focus_area, area.tasks.filter(task => task.task));
      }
    });

    focusAreaMap.forEach((tasks, focus_area) => {
      if (tasks.length > 0) {
        combinedFocusAreas.push({ focus_area, tasks });
      }
    });

    if (combinedFocusAreas.length === 0) {
      setMessage({ text: 'Please add at least one valid focus area with tasks', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase
        .from('placement_tracker_cse')
        .insert([{
          day_number: parseInt(formData.dayNumber),
          focus_areas: combinedFocusAreas,
          time_required: formData.timeRequired,
          notes: formData.notes
        }]);

      if (error) throw error;

      setMessage({
        text: 'Placement tracker entry added successfully!',
        type: 'success'
      });

      // Reset form
      setFormData({
        dayNumber: '',
        focusAreas: [{ focus_area: '', tasks: [{ task: '', resources: '' }] }],
        timeRequired: '',
        notes: ''
      });

      // Notify parent component
      if (onAddEntry) onAddEntry();

    } catch (error) {
      setMessage({
        text: `Error: ${error.message || 'Failed to add entry'}`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add CSE Placement Tracker Entry</h2>

      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dayNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Day Number *
            </label>
            <input
              type="number"
              id="dayNumber"
              name="dayNumber"
              value={formData.dayNumber}
              onChange={e => setFormData(prev => ({ ...prev, dayNumber: e.target.value }))}
              required
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="timeRequired" className="block text-sm font-medium text-gray-700 mb-1">
              Time Required (e.g., 5h) *
            </label>
            <input
              type="text"
              id="timeRequired"
              name="timeRequired"
              value={formData.timeRequired}
              onChange={e => setFormData(prev => ({ ...prev, timeRequired: e.target.value }))}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Focus Areas & Tasks *
          </label>
          {formData.focusAreas.map((area, focusIndex) => (
            <div key={focusIndex} className="mb-4 p-4 border border-gray-200 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Focus Area {focusIndex + 1}</h3>
                {formData.focusAreas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFocusArea(focusIndex)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="mb-2">
                {/* <label htmlFor={`focus_area_${focusIndex}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Focus Area
                </label>
                <select
                  id={`focus_area_${focusIndex}`}
                  name="focus_area"
                  value={area.focus_area}
                  onChange={e => handleChange(e, focusIndex)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a focus area</option>
                  {FOCUS_AREAS.map(focus => (
                    <option key={focus} value={focus}>{focus}</option>
                  ))}
                </select> */}

<div className="mb-2">
  <label htmlFor={`focus_area_${focusIndex}`} className="block text-sm font-medium text-gray-700 mb-1">
    Focus Area
  </label>
  <input
    type="text"
    id={`focus_area_${focusIndex}`}
    name="focus_area"
    value={area.focus_area}
    onChange={e => handleChange(e, focusIndex)}
    required
    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
    placeholder="Enter focus area (e.g., Java, DSA)"
  />
</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tasks
                </label>
                {area.tasks.map((task, taskIndex) => (
                  <div key={taskIndex} className="mb-2 p-2 border border-gray-100 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-600">Task {taskIndex + 1}</span>
                      {area.tasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTask(focusIndex, taskIndex)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="mb-2">
                      <label
                        htmlFor={`task_${focusIndex}_${taskIndex}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Task Description
                      </label>
                      <input
                        type="text"
                        id={`task_${focusIndex}_${taskIndex}`}
                        name="task"
                        value={task.task}
                        onChange={e => handleChange(e, focusIndex, taskIndex)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Learn Java basics"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`resources_${focusIndex}_${taskIndex}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Resources
                      </label>
                      <textarea
                        id={`resources_${focusIndex}_${taskIndex}`}
                        name="resources"
                        value={task.resources}
                        onChange={e => handleChange(e, focusIndex, taskIndex)}
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., GeeksforGeeks - Java, Oracle Java Tutorials"
                      ></textarea>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addTask(focusIndex)}
                  className="flex items-center px-3 py-1 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 text-sm"
                >
                  <span className="mr-1">+</span> Add Task
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addFocusArea}
            className="flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700"
          >
            <span className="mr-2">+</span> Add Focus Area
          </button>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows="2"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
          >
            {isSubmitting ? 'Submitting...' : 'Add Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}