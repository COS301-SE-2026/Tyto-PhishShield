<h1>Coding Standards Document</h1>

<h2>Introduction</h2>
This document is to ensure that the projects codebase remains uniform, clear, reliable, and readable. The scope of this document covers general principles, naming conventions, formatting as well as file structure and the repository structure.

<h2>General Principles</h2>

 - **Keep It Simple, Stupid (KISS)** - Prefer simple solutions over complex solutions that are not really necassary.
 - **Readability** - Prioritise human readability when writing code. Do this by using meaningful names, keeping functions small and avoid deep nesting.
 - **Consistency** - Try to follow the existing coding patterns and style throughout the entire project.
 - **Boy Scout Rule** - When working on existing code, leave the code cleaner than you found it by only making improvements where appropriate.
 - **Fail Fast** - Validate inputs early and provide descriptive error messages. Any NestJS service should use `ValidationPipe` for DTO validation.

 ---

<h2>Naming Conventions</h2>

### General

 - Use **camelCase** for variables, functions, methods and object properties.
 - Use **PascalCase** for classes, interfaces, types, enums, modules, controllers and services.
 - Use **UPPER_SNAKE_CASE** for environment variables and shared constants.
 - Use **kebab-case** for files and folders.
 - Avoid single letter variables unless you want to use them for loop variables(e.g. `i`, `j`, `k`).

 ### Files and Folders

| Element | Convention | Example |
|---------|------------|---------|
| Folder names | `kebab-case` | `accounts-service` |
| Typescript files | `kebab-case` | `auth.service.ts` |
| DTOs | `*.dto.ts` | `register.dto.ts` |
| Unit tests | `*.spec.ts` | `auth.service.spec.ts` |
| E2E tests | `.*e2e.spec.ts` | `auth.e2e-spec.ts` |

### Variables

 - Use descriptive variable names.
 - Boolean variables should start with:
    - `is`
    - `has`
    - `should`

Example:
```ts
const userCount = 5;
const isAdmin = true;
const hasPermission = false;
```

### Functions
 - Use descriptive verbs for function names.
 - Event handles should start with:
    - `on`
    - `handle`

Example

```ts
function getUserById(id: string) Promise<User> {
    ...
}

function handleSubmit() {
    ...
}
```

### Classes
 - Use **PascalCase**.
 - Do not start interfaces with `I`.
 - End DTOs with `Dto`.
 - End NestJs providers with their role.

Examples:
 - `RegisterDto`
 - `UsersController`
 - `AuthService`
 - `RolesGuard`

### Enums
 - Use **PascalCase**.
 - Preferably string values for readability purposes.

---

<h2>Database Standards</h2>

- Use `snake_case` for PostgreSQL table and column names.
- Only use `synchronize: true` during development.
- Production databases should always use migrations.

---

<h2>Formatting and Styling</h2>

### Indentation

 - Use **2 spaces** for indentation.
 - Don't use tabs.

### Braces

Opening braces should be on the same line.
```ts
if (isActive) {
    doSomething();
} else {
    doSmethingElse();
}
```

### Spacing

 - Leave one blank line between functions.
 - Also seperate logical code blocks with a line.

### Line Length
 - Keep lines under **120 characters**.
 - Break long parameter lists and chained methods into multiple lines.

### Quotes
 - Use single quotes.(`'`)
 - Use template literals only when interpolation is required(e.g: console.log(`accounts Service is running on port ${port}`);).

 ### Semicolons
 - Always end statements with semicolons.

 ### Trailing Commas
Use trailing commas for multiline:
 - Arrays
 - Objects
 - Function parameters

### Imports
Organise imports in the following order where applicable:

1. Node built-in modules
2. External packages
3. Internal project modules

Avoid wildcard(`*`) import where possible.

### React / JSX
 - Use self-closing tags where appropriate.
 - Wrap multiline JSX in parentheses.

 ---

<h2>Linting Tools</h2>
The project uses **ESLint** together with **Prettier** to make sure it has a consistent code style and format.

### Configuration
 - Backend services extend the NestJS ESLint configuration
 - Frontend projects extend the recommended TypeScript and React ESLint configurations.
 - Formatting is shared throught the project's `perttierc`.

 ### Running the Linter

 ```bash
 pnpm lint:all
 ```

 Automatically fix formatting issues:
 eslint --fix

 ### Rules to Remember
 - Prefer `const` over `let`.
 - Never use `var`.
 - Remove unused variables.
 - Always use strict equality(`===` and `!==`).
 - Do not use `console.log()` in production code.
 - Use the project's logging service instead.

 ---

<h2>Repository Structure</h2>
The repository follows the structure below:

```
Tyto-PhishShield
│   .gitignore
│   README.md
│       
├───docs
│   │   README.md
│   │       
│   ├───research
│   │       README.md       #Research the team did for the project
│   │       
│   ├───setup-instructions
│   │       README.md       #Instructions on how to set up the project
│   │       
│   └───SRS
│           README.md       #Documents for Software Engineering
│           Software_Requirements_Specification.md
│           Test_Cases.md
│           User_Stories.md
│           
└───project
    │   README.md           #Folder to contain all the code
    │   
    ├───backend
    │   │   README.md       #Folder to contain all the backend services
    │   │   
    │   ├───accounts-service
    │   │       README.md   #Project folder for the accounts service source code
    │   │       
    │   ├───api-gateway
    │   │       README.md   #Project folder for the api gateway source code
    │   │
    │   ├───mailing-service
    │   │       README.md   #Project folder for the mailing service source code
    │   │  
    │   └───pgadmin-container
    │           README.md   #Folder for accessing pgadmin webview of the databases
    │           
    └───Frontend
        │   README.md       #Folder to contain all the frontend source code
        │   
        ├───design-spec-preview
        │       README.md   #Folder to contain the web-view of the design specification
        │
        ├───phishshield-outlook-addin
        │       README.md   #Project folder for the outlook addin source code
        │       
        └───website
                README.md   #Project folder for the website source code
```