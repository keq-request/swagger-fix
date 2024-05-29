<h1 align="center" style="text-align: center">swagger-fix</h1>
<!-- title -->

[npm]: https://www.npmjs.com/package/swagger-fix

[![version](https://img.shields.io/npm/v/swagger-fix.svg?logo=npm&style=for-the-badge)][npm]
[![downloads](https://img.shields.io/npm/dm/swagger-fix.svg?logo=npm&style=for-the-badge)][npm]
[![dependencies](https://img.shields.io/librariesio/release/npm/swagger-fix?logo=npm&style=for-the-badge)][npm]
[![license](https://img.shields.io/npm/l/swagger-fix.svg?logo=github&style=for-the-badge)][npm]

<!-- description -->

swagger-fix is a tool to fix invalid content in swagger file, make schema name and operationId valid by converting chinese to pinyin. Both OpenAPI 2.0 and 3.0 are supported.

<!-- description -->

## Usage

```typescript
import { fixSwagger } from 'swagger-fix';

const swagger = {
  swagger: '2.0',
  info: {
    title: 'API',
    version: '1.0.0',
  },
  paths: {
    '/api': {
      get: {
        operationId: '获取数据',
        responses: {
          200: {
            $ref: '#/definitions/数据',
          },
        },
      },
    },
  },
  definitions: {
    数据: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
    },
  },
};

const fixedSwagger = fixSwagger(swagger);
console.log(fixedSwagger);
// {
//   swagger: '2.0',
//   info: {
//     title: 'API',
//     version: '1.0.0',
//   },
//   paths: {
//     '/api': {
//       get: {
//         operationId: 'huoQuShuJu',
//         responses: {
//           200: {
//             $ref: '#/definitions/shuJu',
//           },
//         },
//       },
//     },
//   },
//   definitions: {
//     shuJu: {
//       type: 'object',
//       properties: {
//         name: {
//           type: 'string',
//         },
//       },
//     },
//   },
// };
```