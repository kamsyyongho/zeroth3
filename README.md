## File structure

```
├── README.md
├── package.json
├── public
│   └── ...
├── src
│   ├── App.tsx // main entry point that initializes keycloak and the api and contains all routes
│   ├── constants // various constants used in the app
│   │   └── ...
│   ├── hooks // hooks and context
│   │   ├── Rootprovider.tsx // wraps the app in all context providers
│   │   ├── api // grants access to the api
│   │   │   └── ...
│   │   ├── i18n // translation and time converting
│   │   │   └── ...
│   │   ├── keycloak // grants access to keycloak and user roles
│   │   │   └── ...
│   │   └── window // hook for dynamically updated window dimensions
│   │   │   └── ...
│   ├── i18n // all translations
│   │   ├── i18n-config.ts
│   │   ├── index.ts
│   │   └── translations
│   │       ├── en.ts
│   │       ├── index.ts
│   │       ├── ko.ts
│   │       └── shortcuts.ts // editor shortcuts for macOS and Windows
│   ├── index.tsx
│   ├── react-app-env.d.ts
│   ├── routes // all comonents - sorted by the routes they are used
│   │   ├── IAM
│   │   │   ├── IAM.tsx // main page that contains fetch logic and tabs
│   │   │   ├── IAMTabs.tsx // tab management logic
│   │   │   ├── TranscribersSummary.tsx // contains the transcriber update logic and table component
│   │   │   ├── UsersSummary.tsx // contains the user update logic and table component
│   │   │   └── components
│   │   │       ├── transcribers // table for displaying transcriber info
│   │   │       │   └── ...
│   │   │       └── users // table for user and role management
│   │   │           └── ...
│   │   ├── editor
│   │   │   ├── AudioPlayer.tsx // contains all of the logic for keeping in sync with the editor
│   │   │   ├── Editor.tsx // contains all of the custom logic for the main editor
│   │   │   ├── EditorPage.tsx // the main page component that has all of the update logic / apis
│   │   │   ├── components
│   │   │   │   ├── helpers
│   │   │   │   │   └── ...
│   │   │   │   ├── ConfidenceSlider.tsx
│   │   │   │   ├── EditorControls.tsx // contains buttons and shortcut listeners
│   │   │   │   ├── EditorFetchButton.tsx
│   │   │   │   ├── EntityContent.tsx // the word component for a segment
│   │   │   │   ├── SegmentBlock.tsx // contains the header and main content of a segment
│   │   │   │   ├── SegmentBlockHead.tsx // displays the time and controls for a segment
│   │   │   │   ├── SegmentSplitPicker.tsx // for splitting a single-word segment into two segments
│   │   │   │   ├── SegmentTimePicker.tsx // for changing a segment's start and end times
│   │   │   │   ├── StarRating.tsx // for rating a completed transcript
│   │   │   │   └── WordTimePicker.tsx
│   │   │   ├── helpers // abstracted functions for various editor components
│   │   │   │   └── ...
│   │   │   ├── styles
│   │   │   │   └── editor.css
│   │   │   └── workers
│   │   │       └── editor-page.worker.ts
│   │   ├── main
│   │   │   └── Home.tsx
│   │   ├── model-config
│   │   │   └── ...
│   │   ├── model-training
│   │   │   └── ...
│   │   ├── models
│   │   │   ├── Models.tsx
│   │   │   └── components
│   │   │       ├── ModelTabs.tsx
│   │   │       ├── SubgraphFormDialog.tsx
│   │   │       ├── acoustic-model
│   │   │       │   └── ...
│   │   │       ├── language-model
│   │   │       │   └── ...
│   │   │       └── subgraph
│   │   │           └── SubGraphList.tsx
│   │   ├── profile
│   │   │   ├── Profile.tsx
│   │   │   └── components
│   │   │       └── OrganizationPickerDialog.tsx
│   │   ├── projects
│   │   │   ├── ProjectDetails.tsx // main project page that hosts the details and tabs
│   │   │   ├── ProjectTableTabs.tsx // hosts the TDP and SET components
│   │   │   ├── ProjectsDialog.tsx // the popup for selecting projects
│   │   │   ├── components
│   │   │   │   └── ...
│   │   │   ├── TDP
│   │   │   │   ├── TDP.tsx // contains the TDP table and update logic
│   │   │   │   └── components
│   │   │   │       └── ...
│   │   │   └── set
│   │   │       ├── SET.tsx // contains the SET table and update logic
│   │   │       └── components
│   │   │           └── ...
│   │   └── shared
│   │       ├── ...
│   │       ├── Drawer.tsx // shows drawer items based on user permissions
│   │       ├── NotFound.tsx // 404
│   │       ├── PageErrorFallback.tsx // renders when a component crashes
│   │       ├── form-fields // custom form components for `Formik`
│   │       │   └── ...
│   │       └── header
│   │           ├── Header.tsx // contains logic for storing and updating current user / org / project
│   │           └── components
│   │               └── ...
│   ├── serviceWorker.ts
│   ├── services
│   │   ├── api
│   │   │   ├── api-config.ts
│   │   │   ├── api-problem.ts // logic for building api errors
│   │   │   ├── api.ts // main api class that contains the controllers
│   │   │   ├── controllers // api logic for backend enpoints / controllers
│   │   │   │   └── ...
│   │   │   └── types // for the api and controllers
│   │   │       └── ...
│   │   └── env
│   │       ├── environment-variables.ts // exports variables from .env
│   │       └── index.tsx
│   ├── theme
│   │   ├── icons // icon / svg resources
│   │   │   ├── OrganizationSvgIcon.tsx // function that allows passing of custom colors to the icon
│   │   │   ├── ProfileSvgIcon.tsx // function that allows passing of custom colors to the icon
│   │   │   └── ...
│   │   ├── icons.tsx // exports functions that take in props for all icons
│   │   ├── images // image resources
│   │   │   └── ...
│   │   ├── images.tsx // exports all images
│   │   └── index.ts // logic for the global custom MUI theme
│   ├── types
│   │   ├── ...
│   │   ├── global.d.ts // types for global state from `reactn` (must reset server on change)
│   │   ├── modules
│   │   │   ├── file-loaders.d.ts // used for web worker file paths
│   │   │   └── material-ui-toggle-icon.d.ts // type declaration for external component
│   │   └── ...
│   └── util
│       ├── log
│       │   └── logger.ts // used for logging during development
│       └── misc.ts
├── tsconfig.json
├── tslint.json
└── yarn.lock
```

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
