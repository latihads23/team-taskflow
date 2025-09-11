-- Create tasks table for Team TaskFlow
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assignee_id TEXT NOT NULL,
  due_date TEXT NOT NULL, -- Using TEXT to match existing format (YYYY-MM-DD)
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status TEXT NOT NULL CHECK (status IN ('To Do', 'In Progress', 'Done')),
  reminder_at TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT CHECK (recurrence_rule IN ('daily', 'weekly', 'monthly') OR recurrence_rule IS NULL),
  recurrence_end_date TEXT,
  original_task_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for recurring tasks
ALTER TABLE tasks 
ADD CONSTRAINT fk_original_task 
FOREIGN KEY (original_task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_original_task_id ON tasks(original_task_id);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now (you can make this more restrictive later)
CREATE POLICY "Enable all operations for all users" ON tasks
  FOR ALL USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO tasks (title, description, assignee_id, due_date, priority, status) VALUES
('Setup Project Environment', 'Configure development environment and initialize project repository', 'u1', '2025-09-12', 'High', 'In Progress'),
('Design User Interface', 'Create mockups and wireframes for the main application interface', 'u2', '2025-09-14', 'Medium', 'To Do'),
('Implement Authentication', 'Set up user login and registration functionality', 'u3', '2025-09-15', 'High', 'To Do'),
('Database Migration', 'Migrate from Firebase to Supabase database', 'u1', '2025-09-11', 'Urgent', 'Done');
