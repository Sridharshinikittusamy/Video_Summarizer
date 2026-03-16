import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const TaskContext = createContext({});

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const refreshTasks = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/analyze/tasks?user_id=${user.id}`);
            if (!res.ok) throw new Error("Failed to fetch tasks");
            const data = await res.json();
            setTasks(data);
        } catch (err) {
            console.error("Task fetch error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user?.id) {
            refreshTasks();
        }
    }, [user?.id, refreshTasks]);

    // Polling for active tasks
    useEffect(() => {
        if (!tasks) return;
        const hasActiveTasks = tasks.some(t => t.status === 'pending' || t.status === 'processing');
        if (hasActiveTasks) {
            const interval = setInterval(() => {
                // Silent refresh
                fetch(`${import.meta.env.VITE_API_BASE_URL}/analyze/tasks?user_id=${user.id}`)
                    .then(res => res.json())
                    .then(data => setTasks(data))
                    .catch(err => console.error("Polling error:", err));
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [tasks, user?.id]);

    return (
        <TaskContext.Provider value={{ tasks, loading, error, refreshTasks, setTasks }}>
            {children}
        </TaskContext.Provider>
    );
};
