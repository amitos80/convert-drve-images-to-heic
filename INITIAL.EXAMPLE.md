## INITIAL.md: Simple Todo List Web Application

### 1. High-Level Overview

This document outlines the development of a simple, full-stack **Todo List** application. It will serve as the first feature demonstrating our standard architecture using a Next.js (TypeScript) frontend and a Python (FastAPI) backend.

### 2. Goals & Acceptance Criteria

| Goal | Description | Acceptance Criteria |
| :--- | :--- | :--- |
| **Core Functionality** | Users can create, view, and mark tasks as complete. | The UI successfully communicates with the API to perform CRUD operations for tasks. |
| **Architectural Adherence** | Follow all conventions in `GEMINI.md` and `STACKS.md`. | Modular structure (`src/todos/`), data validation via `pydantic` on the backend, and the **Test Triad** applied to all core logic. |
| **State Management** | Use a basic, modern state solution for the frontend. | Tasks data is managed using **Zustand** or simple React `useState`/`useReducer`. |

### 3. Proposed Technology Stack

| Layer | Technology | Rationale (from `STACKS.md`) |
| :--- | :--- | :--- |
| **Frontend** | **Next.js (App Router), TypeScript, Tailwind CSS** | Best for small-to-medium full-stack applications requiring a unified structure. |
| **Frontend State**| **Zustand** | Lightweight, simple, and performs well for simple global state. |
| **Backend API** | **Python, FastAPI** | High performance, excellent type-safety via `pydantic`, and a familiar backend choice for our team. |
| **Database** | **SQLite** (Initial, Local) | Simplest solution for a proof-of-concept. Will be replaced by **PostgreSQL** for deployment. |

### 4. Implementation Plan & Structure

The work will be split into two main modules: `backend/src/tasks` and `frontend/src/app/todos`.

#### 4.1. Backend (`backend/src/tasks/`)

1.  **Data Model (`tasks/models.py`):** Define the `Task` schema using `pydantic`.
    ```python
    # Example fields:
    # id: int
    # title: str
    # is_complete: bool = False
    ```
2.  **Service Logic (`tasks/service.py`):** Functions for CRUD operations (e.g., `get_all_tasks()`, `create_task(title: str)`). This will interact with the SQLite database.
3.  **API Routes (`tasks/router.py`):** Use `FastAPI.APIRouter` to expose endpoints:
    * `GET /api/v1/tasks` (List all tasks)
    * `POST /api/v1/tasks` (Create a new task)
    * `PATCH /api/v1/tasks/{id}` (Update task completion status)

#### 4.2. Frontend (`frontend/src/app/todos/`)

1.  **API Hook (`lib/hooks/useTasks.ts`):** A custom hook for fetching and modifying tasks, handling loading and error states.
2.  **Data Types (`lib/types/tasks.ts`):** Define the TypeScript interface for the `Task` model, mirroring the Python `pydantic` model.
3.  **Task Card Component (`components/TaskCard.tsx`):** A reusable component to display a single task, including a title and a checkbox for completion.
4.  **Page (`app/todos/page.tsx`):** The main client-side page that fetches tasks, renders the list, and handles the "Add New Task" input form.

### 5. Open Questions / Next Steps for Review

1.  **Deployment:** Should we use separate containers for the Next.js frontend and the FastAPI backend (as per `STACKS.md` principles)?
2.  **Styling:** Confirm that **Tailwind CSS** should be configured in the Next.js project before starting UI components.
