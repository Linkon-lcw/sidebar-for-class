# Copilot Instructions for Sidebar for Class

## Overview
This project is an Electron-based sidebar application designed for quick application launching and system control. The architecture is modular, with clear separation between the renderer and main processes, allowing for efficient development and debugging.

## Architecture
- **Main Components**: The application consists of several key components located in the `src/` directory:
  - **Renderer**: Handles the UI and user interactions. Key files include:
    - `animation.js`: Manages animations for UI transitions.
    - `sidebar-ui.js`: Updates the sidebar interface based on user actions.
  - **Settings**: Contains React components for user settings, organized into sections for better maintainability.
  - **Sidebar**: Contains components specific to the sidebar functionality, including widgets for launching applications and controlling system volume.

## Developer Workflows
- **Building the Project**: Use the command `npm run build` to compile the application for production.
- **Running the Development Server**: Start the development server with `npm run dev`. This command runs Vite to serve the application.
- **Debugging**: Use the Electron debugging tools to inspect the application. Ensure to run the application with the `--inspect` flag for better debugging capabilities.

## Project Conventions
- **Configuration**: Configuration files are located in `data/config.json`. Changes to this file require a restart of the application to take effect.
- **Component Structure**: Follow the React component structure for new features. Each component should be placed in its respective directory under `src/settings/` or `src/sidebar/`.

## Integration Points
- **External Dependencies**: The project relies on several npm packages defined in `package.json`. Ensure to run `npm install` to install all dependencies before starting development.
- **Cross-Component Communication**: Use React context or props to manage state and communication between components. Avoid using global variables to maintain state.

## Examples
- To create a new sidebar widget, add a new component in `src/sidebar/components/` and ensure it is registered in `Sidebar.jsx`.
- For animations, modify `animation.js` to include new animation effects and update the relevant components to use these effects.

## Conclusion
These instructions should help AI coding agents quickly understand the structure and workflows of the Sidebar for Class project. For further details, refer to the README.md and the source code directly.