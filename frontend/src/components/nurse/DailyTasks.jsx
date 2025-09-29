import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, AlertTriangle, Pill } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DailyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAdministerForm, setShowAdministerForm] = useState(false);
  const [administerData, setAdministerData] = useState({
    notes: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/nurses/today-tasks');
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/nurses/administer-task', {
        taskId: selectedTask.id,
        notes: administerData.notes
      });

      toast.success('Task administered successfully!');
      setShowAdministerForm(false);
      setSelectedTask(null);
      setAdministerData({ notes: '' });
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to administer task');
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'badge-success';
      case 'PENDING':
        return 'badge-warning';
      case 'OVERDUE':
        return 'badge-danger';
      default:
        return 'badge-gray';
    }
  };

  const getTaskPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'LOW':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily Tasks</h2>
          <p className="text-gray-600">Continuous infusion and medication administration</p>
        </div>
        <div className="text-sm text-gray-500">
          {tasks.filter(task => task.status === 'PENDING').length} pending tasks
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tasks.filter(task => task.status === 'COMPLETED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tasks.filter(task => task.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tasks.filter(task => task.status === 'OVERDUE').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Scheduled Time</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <div>
                      <p className="font-medium">{task.patient.name}</p>
                      <p className="text-sm text-gray-500">ID: {task.patient.id}</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center">
                      <Pill className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="font-medium">{task.medicationName}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-sm">{task.dailyDose}</span>
                  </td>
                  <td>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm">{formatTime(task.scheduledTime)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getTaskStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td>
                    <span className={`font-medium ${getTaskPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    {task.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowAdministerForm(true);
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        Administer
                      </button>
                    )}
                    {task.status === 'COMPLETED' && (
                      <span className="text-green-600 text-sm">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Administer Task Modal */}
      {showAdministerForm && selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Administer Medication
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Patient:</strong> {selectedTask.patient.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Medication:</strong> {selectedTask.medicationName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Dosage:</strong> {selectedTask.dailyDose}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Scheduled Time:</strong> {formatTime(selectedTask.scheduledTime)}
                </p>
              </div>

              <form onSubmit={handleAdminister} className="space-y-4">
                <div>
                  <label className="label">Administration Notes</label>
                  <textarea
                    className="input"
                    rows="3"
                    placeholder="Any observations or notes about the administration..."
                    value={administerData.notes}
                    onChange={(e) => setAdministerData({...administerData, notes: e.target.value})}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdministerForm(false);
                      setSelectedTask(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Mark as Administered
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTasks;
