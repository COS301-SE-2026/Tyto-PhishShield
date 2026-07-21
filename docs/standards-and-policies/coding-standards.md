<h1>Coding Standards Document</h1>

<h2>Introduction</h2>
This document is to ensure that the projects codebase remains uniform, clear, reliable, and readable. The scope of this document covers general principles, naming conventions, formatting as well as file structure and the repository structure.

<h2>General Principles</h2>

 - Keep it simple and stupid (KISS)
 - Ensure readability
 - Keep the coding style consistant

<h2>Naming Conventions</h2>

<h2>Formatting and Styling</h2>

<h2>Linting Tools</h2>

<h2>Repository Structure</h2>

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