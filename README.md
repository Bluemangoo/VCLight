# VCLight

VCLight is a serverless framework, initially designed for Vercel Serverless, and gradually supporting more platforms like node `http` module and Netlify Function.

See the documents at [VCLight Document](https://vclight.bluemangoo.net/) \([repo](https://github.com/Bluemangoo/VCLight-Docs)\)

## Getting-started

### Use VCLight Cli to create a project

```shell
npx @vclight/cli create vclight-test
```

### Use template to create a project

Create a project with the template [here](https://github.com/Bluemangoo/VCLight-Example).

### Install dependencies

```shell
cd vclight-test
npm i
```

### Run

```shell
npm run dev:vercel
```

```shell
npm run dev:netlify
```

```shell
npm run dev:node
```

## Development

We use PNPM as our package manager.

```shell
pnpm install
```

This repo is a pnpm workspace. All our package is under `packages/`.
