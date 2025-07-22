# RAWA Chatbot

Welcome to the RAWA Chatbot project! This application is built with Next.js, React, and TypeScript. The app features a chat interface with an integrated charting component as well as several other reusable UI components. This guide will help you understand the project's structure, key components, and how to start developing.

---

## Table of Contents

- [RAWA Chatbot](#rawa-chatbot)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Directory Structure](#directory-structure)
  - [Key Components](#key-components)
    - [Components](#components)
    - [AppChart Component](#appchart-component)
    - [Lib Utilities](#lib-utilities)
    - [App Directory](#app-directory)
  - [Getting Started](#getting-started)
  - [Development Guidelines](#development-guidelines)
  - [Further Resources](#further-resources)

---

## Project Overview

The RAWA Chatbot is a conversational interface that lets users interact with a bot that can both respond with text messages and render data charts. Key features include:

- **Chat Interface**: Built in the `src/components/Chat.tsx` file. It handles user input, displays messages, and uses pre-filled messages to help new users get started.
- **Reusable UI Components**: Standard UI elements like buttons, inputs, cards, avatars, etc. are provided under `src/components/ui`.
- **Charting with AppChart**: A reusable chart component (in `src/components/AppChart/AppChart.tsx`) that uses the Recharts library to render various types of charts (bar, line, area, pie, mixed, scatter). This component is highly configurable via the `ChartConfig` interface.
- **Utility Helpers**: Common functions like class name merging and number formatting are located in the `src/lib/utils.ts` file.
- **State Management and Routing**: The app leverages Next.js routing (`src/app` folder) and Redux for state management. The `Providers` component wraps the application to provide Redux state and persistence.

---

## Directory Structure

Here's an overview of the key directories:

- **`src/app/`**

  - **Pages & Layouts**:
    - `layout.tsx`: Global layout wrapping all pages (includes the navbar, sidebar, and providers).
    - `page.tsx`: The main landing page that starts a new chat session.
    - `c/[id]/page.tsx`: Dynamic route to view an individual chat session.
  - **API Routes**:
    - `api/chat/route.ts`: API endpoint (for chat functionality) that leverages OpenAI and streaming responses.

- **`src/components/`**

  - **Chat Components**:
    - `Chat.tsx`: Main chat interface including message display and textarea input.
    - `EmptyChat.tsx` & `PrefilledMessages`: Shown when no chat history exists.
  - **Chart Components**:
    - `AppChart/`: Contains the `AppChart.tsx` component that renders various charts.
    - `ChartTooltip/` & `ChartWrapper/`: Helper components used by `AppChart` to render tooltips, legends, and consistent layout.
  - **UI Components** (`src/components/ui/`):
    - Contains basic UI elements (e.g., `button.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, etc.), used across the app.
  - **Providers & Layout**:
    - `Providers/`: Wraps the app with Redux and persistence providers.
    - `Navbar.tsx` and `Sidebar.tsx`: Layout components providing navigation and chat list.

- **`src/lib/`**
  - **Utils**:
    - `utils.ts`: Contains helper functions like `cn` for merging class names and `numeralFormat` for number formatting.

---

## Key Components

### Components

- **Chat**:  
  Located at `src/components/Chat.tsx`, this is the main interface for user interaction. It handles user input, displays conversation messages, and manages actions such as liking or retrying a message.

- **Navbar & Sidebar**:

  - **Navbar** (`src/components/Navbar.tsx`): Provides the top navigation, including the RAWA logo and user greeting.
  - **Sidebar** (`src/components/Sidebar.tsx`): Lets users start a new chat and navigate through chat histories.

- **Providers**:  
  The `Providers` component (in `src/components/Providers/`) wraps the application with the Redux store and persistence gate, ensuring all components are connected to the app state.

### AppChart Component

- **AppChart**:  
  Found in `src/components/AppChart/AppChart.tsx`, this component uses the [Recharts](https://recharts.org) library to render various types of charts such as bar, line, area, scatter, and pie charts.
- **Configuration**:  
  It uses a `ChartConfig` interface to control aspects like chart type, axes, tooltips, and legends. Study the configuration options in this file to understand how charts are customized.

- **Supporting Components**:
  - **ChartTooltip** (`src/components/ChartTooltip/ChartTooltip.tsx`): Custom tooltip used in charts.
  - **ChartWrapper** (`src/components/ChartWrapper/ChartWrapper.tsx`): Provides consistent layout and header elements for charts.

### Lib Utilities

- **Utils**:  
  The `src/lib/utils.ts` file provides common helper functions:
  - **`cn` Function**: Merges Tailwind CSS classes using `clsx` and `tailwind-merge`.
  - **`numeralFormat` Function**: Formats numbers (using the [numeral](http://numeraljs.com) package).

### App Directory

- **Pages & Routing**:  
  The `src/app` folder contains the global layout (`layout.tsx`) and pages (like `page.tsx` and `c/[id]/page.tsx`). These files define the routes of your Next.js app and how different pages are structured.
- **API Integration**:  
  The `api/chat/route.ts` file demonstrates how the chat API route handles requests. It shows how to integrate with external services (like OpenAI) for generating chat responses.

---

## Getting Started

1. **Install Dependencies**  
   Make sure you have Node.js installed. From the root of the project, install dependencies using:

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Run the Development Server**  
   Start the Next.js development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to view the app.

3. **Folder Navigation**
   - Explore `src/app/` to see how pages are structured.
   - Check out `src/components/` to review reusable components.
   - Look into `src/lib/utils.ts` for helper functions used throughout the project.

---

## Development Guidelines

- **Code Style & Structure**:

  - Written in TypeScript using functional components.
  - Follows a modular structure with separated UI components, reusable helpers, and configuration files.
  - Use named exports and keep code concise and declarative.

- **Working on Components**:

  - When working with charts (in `AppChart`), modify the config and styling via the provided interfaces and helper functions.
  - Follow the pattern used in the `Navbar`, `Sidebar`, and `Chat` components for creating new components.
  - Use the `cn` utility in `src/lib/utils.ts` for combining Tailwind CSS classes.

- **State Management**:  
  Redux is used for managing chat state. Changes in chat data (adding new chats, messages, etc.) should use the provided Redux actions.

- **Internationalization & Accessibility**:  
  Ensure that any new UI elements are accessible (using proper ARIA attributes) and consider internationalization for user-facing text.

---

## Further Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Recharts Documentation](https://recharts.org/en-US/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
