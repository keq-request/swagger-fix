import { OpenAPIV2, OpenAPIV3 } from "openapi-types";
import { fixSwagger } from "../src/index";

describe("fixSwagger", () => {
  it("should convert OpenAPI V2 document", () => {
    const input: OpenAPIV2.Document = {
      swagger: "2.0",
      info: { title: "Test API", version: "1.0" },
      paths: {
        "/test": {
          get: {
            operationId: "测试id",
            responses: {
              200: {
                $ref: "#/definitions/测试name",
              },
            },
          },
        },
      },
      definitions: {
        测试name: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
        },
      },
    };

    const output = fixSwagger(input);

    expect(output).toHaveProperty("definitions.CeShiName");
    expect(output).toHaveProperty(
      "paths./test.get.responses.200.$ref",
      "#/definitions/CeShiName",
    );
    expect(output).toHaveProperty("paths./test.get.operationId", "ceShiId");
  });

  it("should convert OpenAPI V3 document", () => {
    const input: OpenAPIV3.Document = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0" },
      paths: {
        "/test": {
          get: {
            operationId: "?测试id",
            responses: {
              200: {
                $ref: "#/components/schemas/测试name",
              },
            },
          },
          post: {
            operationId: "1测试id",
            responses: {
              200: {
                $ref: "#/components/schemas/测试name#",
              },
            },
          },
          put: {
            operationId: "yield",
            responses: {
              200: {
                $ref: "#/components/schemas/测试name",
              },
            },
          },
          delete: {
            operationId: "Test",
            responses: {
              200: {
                $ref: "#/components/schemas/测试name",
              },
            },
          }
        },
        "/test2": undefined,
      },
      components: {
        schemas: {
          测试name: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
          "测试name#": {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
        },
      },
    };

    const output = fixSwagger(input);

    expect(output).toHaveProperty("components.schemas.CeShiName1");
    expect(output).toHaveProperty(
      "paths./test.get.responses.200.$ref",
      "#/components/schemas/CeShiName1",
    );
    expect(output).toHaveProperty("paths./test.get.operationId", "ceShiId");
    expect(output).toHaveProperty("components.schemas.CeShiName2");
    expect(output).toHaveProperty(
      "paths./test.post.responses.200.$ref",
      "#/components/schemas/CeShiName2",
    );
    expect(output).toHaveProperty("paths./test.post.operationId", "_1CeShiId");
    expect(output).toHaveProperty("paths./test.put.operationId", "_yield");
    expect(output).toHaveProperty("paths./test.delete.operationId", "Test");
  });

  it("should handle invalid input", () => {
    const input: any = {
      info: { title: "Test API", version: "1.0" },
      paths: {},
    };

    expect(() => fixSwagger(input)).not.toThrow();
  });
});
