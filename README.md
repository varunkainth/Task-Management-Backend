# Task Management Project - Backend

## Introduction

Welcome to the **Task Management Project Backend**! This backend service is responsible for handling all the server-side operations, including user authentication, task management, email notifications, and more. It provides a robust API for the frontend to interact with, ensuring secure and efficient task management.

## Features

- **User Authentication**: Secure login and registration with JWT tokens, including email verification.
- **Two-Factor Authentication**: Enhance account security with two-factor authentication (2FA), requiring a secondary code during login.
- **Task Management**: Create, update, delete, and categorize tasks. Assign tasks to users and track progress.
- **Email Notifications**: Automatically send email notifications for task assignments, approaching deadlines, and other important events.
- **Team Collaboration**: Manage team members within projects, assign tasks, and track overall project progress.
- **Caching**: Utilize Redis to cache frequently accessed data, improving performance and scalability.
- **RESTful API**: Expose endpoints for all major functionalities, adhering to RESTful principles.

## Technologies Used

- **Node.js**: The JavaScript runtime used to build the server.
- **Express**: A minimal and flexible Node.js web application framework.
- **Mongoose**: A MongoDB object modeling tool designed to work in an asynchronous environment.
- **Redis**: An in-memory data structure store, used as a database, cache, and message broker.
- **JWT (JSON Web Tokens)**: Used for securing the authentication process.
- **Nodemailer**: Integrated for sending email notifications.
- **Two-Factor Authentication (2FA)**: Implemented using [speakeasy](https://www.npmjs.com/package/speakeasy) and [qrcode](https://www.npmjs.com/package/qrcode) packages.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or Yarn
- MongoDB
- Redis

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/varunkainth/task-management-backend.git
   cd task-management-backend
2.  Install dependencies:
    ```bash 
    npm install
3. Set the Environment Varibales in .env file 
    take ref from .env.sample file
4. Start the server:
    ```bash
    npm run dev