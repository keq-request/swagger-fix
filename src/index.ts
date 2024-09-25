import { pinyin } from "pinyin-pro";
import * as R from "ramda";
import { OpenAPI, OpenAPIV2, OpenAPIV3 } from "openapi-types";

function isV2(input: OpenAPI.Document): input is OpenAPIV2.Document {
  return "swagger" in input && input.swagger === "2.0";
}

function isV3(input: OpenAPI.Document): input is OpenAPIV3.Document {
  return "openapi" in input && input.openapi.startsWith("3.");
}

function convertStrToValid(word: string, fileNamingStyle: 'camelCase' | 'pascalCase') {
  const reservedWords = [
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "export",
    "extends",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "yield",
    "let",
    "static",
    "enum",
    "implements",
    "package",
    "protected",
    "interface",
    "private",
    "public",
    "await",
    "abstract",
    "boolean",
    "byte",
    "char",
    "double",
    "final",
    "float",
    "goto",
    "int",
    "long",
    "native",
    "short",
    "synchronized",
    "throws",
    "transient",
    "volatile",
  ];
  if (/^[a-zA-Z0-9_$]+$/.test(word) && !/^[0-9]/.test(word) && !reservedWords.includes(word)) {
    return word;
  }
  const pinyinArr = pinyin(word, {
    toneType: "none",
    type: "array",
    nonZh: "consecutive",
    v: true,
  });
  const pinyinResult = pinyinArr.reduce((acc, cur) => {
    if (!acc) return cur;
    if (!cur) return acc;
    return acc + cur.charAt(0).toUpperCase() + cur.slice(1);
  }, "");

  let validName = pinyinResult.replace(/[^a-zA-Z0-9_$]/g, "");
  if (fileNamingStyle === 'camelCase') {
    validName = validName.charAt(0).toLowerCase() + validName.slice(1);
  } else if (fileNamingStyle === 'pascalCase') {
    validName = validName.charAt(0).toUpperCase() + validName.slice(1);
  }
  if (validName === "" || !isNaN(parseInt(validName[0]))) {
    validName = "_" + validName;
  }

  if (reservedWords.includes(validName)) {
    validName = "_" + validName;
  }

  return validName;
}

function getNamePinyinMap(input: Map<string, Set<string>>) {
  const output = new Map<string, string>();
  for (const [key, value] of input) {
    const valueArr = [...value];
    if (valueArr.length === 1) {
      output.set(valueArr[0], key);
      continue;
    }
    valueArr.sort().forEach((v, i) => {
      output.set(v, `${key}${i + 1}`);
    });
  }
  return output;
}

function getPinyinNamesMapAndNewSchemas(input: Record<string, any>) {
  const output: Record<string, any> = {};
  const pinyinNamesMap = new Map<string, Set<string>>();
  for (const schemaName of Object.keys(input)) {
    const schemaPinyin = convertStrToValid(schemaName, 'pascalCase');
    const set = pinyinNamesMap.get(schemaPinyin) || new Set<string>();
    set.add(schemaName);
    pinyinNamesMap.set(schemaPinyin, set);
  }
  const namePinyinMap = getNamePinyinMap(pinyinNamesMap);
  for (const [schemaName, schema] of Object.entries(input)) {
    output[namePinyinMap.get(schemaName)!] = schema;
  }
  return { schemas: output, pinyinNamesMap };
}

function convertSchemas(input: OpenAPI.Document) {
  let pinyinNamesMap = new Map<string, Set<string>>();
  if (isV2(input) && input.definitions) {
    const result = getPinyinNamesMapAndNewSchemas(input.definitions);
    input.definitions = result.schemas;
    pinyinNamesMap = result.pinyinNamesMap;
  }
  if (isV3(input) && input.components?.schemas) {
    const result = getPinyinNamesMapAndNewSchemas(input.components.schemas);
    input.components.schemas = result.schemas;
    pinyinNamesMap = result.pinyinNamesMap;
  }
  return getNamePinyinMap(pinyinNamesMap);
}

function convertSchemaReferences(
  input: Record<string, any>,
  namePinyinMap: Map<string, string>,
) {
  const stack = [input];
  while (stack.length) {
    const current = stack.pop()!;
    for (const [key, value] of Object.entries(current)) {
      if (key === "$ref" && typeof value === "string") {
        const schemaName = value.split("/").pop();
        if (schemaName && namePinyinMap.has(schemaName)) {
          current[key] = `${value.split("/").slice(0, -1).join("/")}/${namePinyinMap.get(schemaName)}`;
        }
      } else if (typeof value === "object" && value !== null) {
        stack.push(value);
      }
    }
  }
}

function convertV2OperationIds(input: OpenAPIV2.Document) {
  const pinyinOperationsMap = new Map<string, Set<string>>();
  for (const path of Object.values(input.paths)) {
    for (const [key, operation] of Object.entries(path)) {
      if (
        [
          "get",
          "post",
          "put",
          "delete",
          "options",
          "head",
          "patch",
          "trace",
        ].includes(key)
      ) {
        if (
          typeof operation === "object" &&
          "operationId" in operation &&
          operation.operationId
        ) {
          const operationPinyin = convertStrToValid(operation.operationId, 'camelCase');
          const set =
            pinyinOperationsMap.get(operationPinyin) || new Set<string>();
          set.add(operation.operationId);
          pinyinOperationsMap.set(operationPinyin, set);
        }
      }
    }
  }
  const namePinyinMap = getNamePinyinMap(pinyinOperationsMap);
  for (const path of Object.values(input.paths)) {
    for (const [key, operation] of Object.entries(path)) {
      if (
        [
          "get",
          "post",
          "put",
          "delete",
          "options",
          "head",
          "patch",
          "trace",
        ].includes(key)
      ) {
        if (
          typeof operation === "object" &&
          "operationId" in operation &&
          operation.operationId
        ) {
          operation.operationId = namePinyinMap.get(operation.operationId);
        }
      }
    }
  }
}

function convertV3OperationIds(input: OpenAPIV3.Document) {
  const pinyinOperationsMap = new Map<string, Set<string>>();
  for (const path of Object.values(input.paths)) {
    if (!path) continue;
    for (const [key, operation] of Object.entries(path)) {
      if (
        [
          "get",
          "post",
          "put",
          "delete",
          "options",
          "head",
          "patch",
          "trace",
        ].includes(key)
      ) {
        if (
          typeof operation === "object" &&
          "operationId" in operation &&
          operation.operationId
        ) {
          const operationPinyin = convertStrToValid(operation.operationId, 'camelCase');
          const set =
            pinyinOperationsMap.get(operationPinyin) || new Set<string>();
          set.add(operation.operationId);
          pinyinOperationsMap.set(operationPinyin, set);
        }
      }
    }
  }
  const namePinyinMap = getNamePinyinMap(pinyinOperationsMap);
  for (const path of Object.values(input.paths)) {
    if (!path) continue;
    for (const [key, operation] of Object.entries(path)) {
      if (
        [
          "get",
          "post",
          "put",
          "delete",
          "options",
          "head",
          "patch",
          "trace",
        ].includes(key)
      ) {
        if (
          typeof operation === "object" &&
          "operationId" in operation &&
          operation.operationId
        ) {
          operation.operationId = namePinyinMap.get(operation.operationId);
        }
      }
    }
  }
}

function convertOperationIds(input: OpenAPI.Document) {
  if (isV2(input)) {
    convertV2OperationIds(input);
  }
  if (isV3(input)) {
    convertV3OperationIds(input);
  }
}

function fixSwagger<T extends OpenAPI.Document>(input: T): T {
  const output = R.clone(input);
  const schemaNamePinyinMap = convertSchemas(output);
  convertSchemaReferences(output, schemaNamePinyinMap);
  convertOperationIds(output);
  return output;
}

export { fixSwagger };
