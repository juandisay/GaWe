I will revamp the Session Configuration page (`src/pages/Config.tsx`) to improve visual hierarchy and usability.

## 1. Hero-Style Session Name
- **Change**: Replace the "Session Details" card with a large, clean, top-level input field.
- **UX Goal**: Make the session name feel like the "title" of the document rather than a form field.
- **Implementation**:
  - Remove the enclosing `Card`.
  - Style the input as `text-4xl font-bold bg-transparent border-none focus:ring-0 px-0`.
  - Add a subtle placeholder "Enter Session Name...".

## 2. Enhanced Task Cards
- **Change**: Redesign the task list items for better readability and interaction.
- **UX Goal**: Reduce visual clutter while making inputs more accessible.
- **Implementation**:
  - **Task Name**: Use a seamless input that highlights on hover/focus.
  - **Duration Picker**: Replace the standard HTML number input with a styled "Time Capsule" (Clock Icon + Value + "min").
  - **Action Toolbar**: Group "Move Up", "Move Down", and "Delete" buttons into a compact row with clearer hover states.
  - **Visual Distinction**: Refine the color accents for "Work" (Blue) vs "Break" (Green) tasks to be more elegant (e.g., left border stripe instead of full background tint).

## 3. "Add Task" Action Panel
- **Change**: Polish the "Add Task" sidebar.
- **UX Goal**: Make adding tasks feel like a primary action.
- **Implementation**:
  - Keep the sticky sidebar layout.
  - Style the "Focus Task" and "Break" buttons as large, clickable tiles with clear icons and default duration hints.

## 4. Visual Polish & Spacing
- **Change**: Adjust global spacing and transitions.
- **Implementation**:
  - Ensure consistent gaps between the header, session name, and task list.
  - Refine `framer-motion` animations for smoother list updates.
