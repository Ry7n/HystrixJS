# Contributing

## Guidelines for pull requests

- Write tests for any changes.
- Separate unrelated changes into multiple pull requests.
- For bigger changes, make sure you start a discussion first by creating an issue and explaining the intended change.
- Ensure the build is green before you open your PR.

## Development dependencies

- nvm 0.30.2

## Setting up a development machine

Install all dependencies, run all tests
```
nvm install
npm install
npm test
```

## During development

- `npm run watch` - Runs tests on any changes to the code base