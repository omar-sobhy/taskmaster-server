# Taskmaster Server

Taskmaster Server is a server for the "Taskmaster" web application. Taskmaster is a task-management application.

### Setting up the environment

Copy the contents of `.env.example` to `.env.dev`, `.env.test` (for tests), or `.env` (for prod).

### Usage

Everything is dockerized. The script `start.sh` is responsible for calling Docker Compose.

To start the server in prod, pass `-p` or `--prod` to `start.sh`.

To start the server in dev, **DO NOT** pass `-p`/`--prod` and `-t`/`--testing` to `start.sh` (it defaults to dev mode unless you tell it to start in test/prod mode).

To run tests, pass `-t` or `--testing` to `.start.sh`.

#### Calling the API

#### Endpoints that don't require auth

Call `<basePath>:<port>/<pathToEndpoint>` directly. For example, with the default environment in dev, you can login by running:

```js
const user = {
  username: 'Svitkona',
  password: 'VeryStrongPassword'
};

// uses the SuperAgent library -- use your favourite HTTP client instead
const response = await request
  .type('application/json')
  .post('http://<ip_or_hostname_of_container>:3000/login')
  .send(user);

// contains some user data, e.g. username and email
const returnedUser = response.body.user;
```

#### Login endpoint

Calling the login endpoint gives back a response with an Authorization cookie. This cookie must be sent back with every request that requires authorization.

### Tests

The tests are run in a Docker container.

Tests can also be run locally to assist in debugging (of course, this requires installing all dependencies locally too). The `test` command in `package.json` is `"env-cmd -f .env.test jest --config local.jest.config.js"`. This will tell Jest to load the "local" config, which sets up an in-memory MongoDB server and connects to it for testing.

Logging is disabled in tests by default. To configure this, pass `true` to the `start` function in `src/tests/local/globalSetup.ts` instead of false.

#### Debugging tests

##### VSCode

```json
{
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "runtimeArgs": [
        "--inspect-brk",
        // replace with path to actual npm binary
        "/home/portent/.nvm/versions/node/v20.4.0/bin/npm",
        "test",
        // passing extra args to jest
        "--",
        "--runInBand"
      ],
      // maybe unnecessary? investigate what happens if removed
      "envFile": "${workspaceFolder}/.env.test",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```
