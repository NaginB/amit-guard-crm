# 📏 Frontend Project Rules & Guidelines

## 🏗️ Project Structure & Architecture

- Follow **Component + Pages + Services** structure.
- Separate responsibilities clearly:
  - **Pages** → Route-based components (Next.js pages or React Router routes).
  - **Components** → Reusable UI components (buttons, inputs, modals, cards, etc.).
  - **Layouts** → Wrapper components for consistent layouts (header, footer, sidebar).
  - **Services/API** → Handle API calls and business logic (fetch, post, put, delete).
  - **Hooks** → Custom hooks for reusable logic (useAuth, useForm, useFetch).
  - **Utils/Helpers** → Common utility functions and constants.
- Keep **one component per file** for readability.
- Use **TypeScript interfaces/types** for props and state.
- Organize **folder structure by feature/domain** when possible.

Example structure:

```

src/
│── components/ # Reusable UI components
│── layouts/ # App layouts and wrappers
│── pages/ # Route-based pages
│── services/ # API calls and business logic
│── hooks/ # Custom hooks
│── utils/ # Helpers, formatters, validators
│── types/ # Interfaces and type definitions
│── assets/ # Images, icons, fonts
│── styles/ # Tailwind config, global styles

```

---

## 🎨 Styling & UI

- Use **Tailwind CSS** for consistent styling.
- Create **common UI components** instead of repeating code.
- Avoid inline styling; prefer **className with Tailwind utilities**.
- Use **variants and props** in components for flexibility.
- Keep **responsive design** in mind (mobile-first approach).
- Maintain **dark/light mode support** if applicable.

---

## 🔐 Security & Best Practices

- Sanitize all inputs before sending to backend.
- Handle sensitive data carefully (e.g., tokens, user info).
- Store JWT securely (HttpOnly cookies or localStorage with caution).
- Implement **role-based UI access** (hide/show components based on user roles).

---

## ⚡ Code Quality

- Use `ESLint` + `Prettier` for consistent formatting.
- Use **functional components** with hooks.
- Keep components **small and modular** (Single Responsibility Principle).
- Use **common utilities/hooks/components** instead of duplicating logic.
- Write **error boundaries** to handle unexpected errors gracefully.

---

## 🛠️ TypeScript

- Enable **strict mode** in `tsconfig.json`.
- Define **interfaces/types** for component props, state, and API responses.
- Avoid `any`; prefer proper typing or generics.
- Define API response types consistently (`SuccessResponse<T>`, `ErrorResponse`).

---

## 🔗 API Integration

- Centralize API calls in **services/api.ts** or similar.
- Handle errors consistently using **common response/error handling functions**.
- Use **Axios or Fetch wrapper** to manage headers, JWT tokens, and base URL.
- Example request pipeline:

```

apiService.post('/user', data)
.then(response => handleResponse(response))
.catch(error => handleError(error))

```

---

## ✅ Testing

- Write **unit tests** for components and hooks (Jest + React Testing Library).
- Test critical user flows with **integration tests**.
- Mock API calls in tests to avoid hitting real endpoints.

---

## 🚀 Deployment & Maintainability

- Use **Next.js build optimizations** or React production build.
- Use **Git branching strategy** (main/development/feature branches).
- Maintain **readable folder structure** and **clear naming conventions**.
- Document **common components and utilities** in README or storybook.
- Use **common state management** (Context API, Redux, Zustand, or Recoil) consistently.

```

---
```
