
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  DocumentData,
  QueryDocumentSnapshot,
  onSnapshot,
  Unsubscribe,
  query,
  orderBy,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Task, TaskData } from "../types";

const getTasksCollection = () => {
    return collection(db, "tasks");
}

// Helper to convert a Firestore document to a Task object
const docToTask = (doc: QueryDocumentSnapshot<DocumentData>): Task => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    assigneeId: data.assigneeId,
    dueDate: data.dueDate,
    priority: data.priority,
    status: data.status,
    reminderAt: data.reminderAt,
    isRecurring: data.isRecurring,
    recurrenceRule: data.recurrenceRule,
    recurrenceEndDate: data.recurrenceEndDate,
    originalTaskId: data.originalTaskId,
  } as Task;
};

export const listenToTasks = (callback: (tasks: Task[]) => void): Unsubscribe => {
  try {
    const tasksCollectionRef = getTasksCollection();
    // Order tasks by due date to maintain a consistent order
    const q = query(tasksCollectionRef, orderBy("dueDate"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasks = querySnapshot.docs.map(docToTask);
      callback(tasks);
    }, (error) => {
      console.error("Error listening to tasks collection:", error);
      throw new Error("Could not listen to tasks from database.");
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up tasks listener: ", error);
    throw new Error("Could not set up tasks listener.");
  }
};


export const addTask = async (taskData: TaskData): Promise<string> => {
  try {
    const tasksCollectionRef = getTasksCollection();
    const docRef = await addDoc(tasksCollectionRef, taskData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add task to database.");
  }
};

export const updateTask = async (
  taskId: string,
  taskUpdateData: Partial<TaskData>
): Promise<void> => {
  try {
    const taskDoc = doc(db, "tasks", taskId);
    await updateDoc(taskDoc, taskUpdateData);
  } catch (error) {
    console.error("Error updating document: ", error);
    throw new Error("Could not update task in database.");
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const taskDoc = doc(db, "tasks", taskId);
    await deleteDoc(taskDoc);
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw new Error("Could not delete task from database.");
  }
};

export const deleteRecurringSeries = async (originalTaskId: string): Promise<void> => {
    try {
        const tasksCollectionRef = getTasksCollection();
        const q = query(tasksCollectionRef, where("originalTaskId", "==", originalTaskId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn("No tasks found for this recurring series to delete. Deleting original task by ID.");
            await deleteDoc(doc(db, "tasks", originalTaskId));
            return;
        }
        
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

    } catch (error) {
        console.error("Error deleting recurring series: ", error);
        throw new Error("Could not delete recurring series from database.");
    }
}
