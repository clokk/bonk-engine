/**
 * JSX AST to Scene JSON transformer.
 * Walks the JSX AST produced by MDX and extracts scene data.
 */

import type {
  SceneJson,
  GameObjectJson,
  TransformJson,
  BehaviorJson,
  AnyComponentJson,
  SceneSettingsJson,
} from '../../src/engine/types';
import { DEFAULT_TRANSFORM, DEFAULT_SCENE_SETTINGS } from '../../src/engine/types/scene';
import { v4 as uuid } from 'uuid';

/** JSX AST node types (simplified from estree-jsx) */
interface JSXIdentifier {
  type: 'JSXIdentifier';
  name: string;
}

interface JSXMemberExpression {
  type: 'JSXMemberExpression';
  object: JSXIdentifier;
  property: JSXIdentifier;
}

interface JSXElement {
  type: 'JSXElement';
  openingElement: {
    name: JSXIdentifier | JSXMemberExpression;
    attributes: JSXAttribute[];
  };
  children: (JSXElement | JSXText | JSXExpressionContainer)[];
}

interface JSXAttribute {
  type: 'JSXAttribute';
  name: { name: string };
  value: JSXAttributeValue | null;
}

type JSXAttributeValue =
  | { type: 'Literal'; value: string | number | boolean }
  | { type: 'JSXExpressionContainer'; expression: Expression };

interface JSXText {
  type: 'JSXText';
  value: string;
}

interface JSXExpressionContainer {
  type: 'JSXExpressionContainer';
  expression: Expression;
}

type Expression =
  | { type: 'Literal'; value: unknown }
  | { type: 'ArrayExpression'; elements: Expression[] }
  | { type: 'ObjectExpression'; properties: ObjectProperty[] }
  | { type: 'Identifier'; name: string }
  | { type: 'UnaryExpression'; operator: string; argument: Expression };

interface ObjectProperty {
  type: 'Property';
  key: { name?: string; value?: string };
  value: Expression;
}

/** Get element name from JSX opening element */
function getElementName(openingElement: JSXElement['openingElement']): string {
  const name = openingElement.name;
  if (name.type === 'JSXIdentifier') {
    return name.name;
  }
  // Handle member expressions like Scene.Settings
  if (name.type === 'JSXMemberExpression') {
    return `${name.object.name}.${name.property.name}`;
  }
  return 'unknown';
}

/** Extract value from JSX attribute */
function getAttributeValue(attr: JSXAttribute): unknown {
  if (attr.value === null) {
    // Boolean attribute without value (e.g., <Sprite flipX />)
    return true;
  }

  if (attr.value.type === 'Literal') {
    return attr.value.value;
  }

  if (attr.value.type === 'JSXExpressionContainer') {
    return evaluateExpression(attr.value.expression);
  }

  return undefined;
}

/** Evaluate a simple expression to a value */
function evaluateExpression(expr: Expression): unknown {
  switch (expr.type) {
    case 'Literal':
      return expr.value;

    case 'ArrayExpression':
      return expr.elements.map(evaluateExpression);

    case 'ObjectExpression': {
      const obj: Record<string, unknown> = {};
      for (const prop of expr.properties) {
        const key = prop.key.name ?? prop.key.value ?? '';
        obj[key] = evaluateExpression(prop.value);
      }
      return obj;
    }

    case 'Identifier':
      // Handle special identifiers
      if (expr.name === 'undefined') return undefined;
      if (expr.name === 'true') return true;
      if (expr.name === 'false') return false;
      // Can't evaluate runtime identifiers
      console.warn(`Cannot evaluate identifier at build time: ${expr.name}`);
      return undefined;

    case 'UnaryExpression':
      if (expr.operator === '-') {
        const val = evaluateExpression(expr.argument);
        return typeof val === 'number' ? -val : undefined;
      }
      return undefined;

    default:
      return undefined;
  }
}

/** Get all attributes as a key-value object */
function getAttributes(element: JSXElement): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  for (const attr of element.openingElement.attributes) {
    if (attr.type === 'JSXAttribute') {
      attrs[attr.name.name] = getAttributeValue(attr);
    }
  }
  return attrs;
}

/** Get child elements (filtering out text nodes) */
function getChildElements(element: JSXElement): JSXElement[] {
  return element.children.filter(
    (child): child is JSXElement => child.type === 'JSXElement'
  );
}

/** Parse a component element into ComponentJson */
function parseComponent(element: JSXElement): AnyComponentJson {
  const name = getElementName(element.openingElement);
  const attrs = getAttributes(element);

  return {
    type: name,
    ...attrs,
  } as AnyComponentJson;
}

/** Parse a Behavior element into BehaviorJson */
function parseBehavior(element: JSXElement): BehaviorJson {
  const attrs = getAttributes(element);
  const src = attrs.src as string;
  const props = attrs.props as Record<string, unknown> | undefined;

  return {
    type: 'Behavior',
    src,
    props: props && Object.keys(props).length > 0 ? props : undefined,
  };
}

/** Parse transform attributes from a GameObject */
function parseTransform(attrs: Record<string, unknown>): TransformJson {
  const position = attrs.position as [number, number] | undefined;
  const rotation = attrs.rotation as number | undefined;
  const scale = attrs.scale as [number, number] | undefined;
  const zIndex = attrs.zIndex as number | undefined;

  return {
    position: position ?? DEFAULT_TRANSFORM.position,
    rotation: rotation ?? DEFAULT_TRANSFORM.rotation,
    scale: scale ?? DEFAULT_TRANSFORM.scale,
    zIndex: zIndex ?? DEFAULT_TRANSFORM.zIndex,
  };
}

/** Parse a GameObject element */
function parseGameObject(element: JSXElement): GameObjectJson {
  const attrs = getAttributes(element);
  const children = getChildElements(element);

  const components: AnyComponentJson[] = [];
  const behaviors: BehaviorJson[] = [];
  const childGameObjects: GameObjectJson[] = [];

  for (const child of children) {
    const childName = getElementName(child.openingElement);

    if (childName === 'Behavior') {
      behaviors.push(parseBehavior(child));
    } else if (childName === 'GameObject') {
      childGameObjects.push(parseGameObject(child));
    } else if (childName === 'Prefab') {
      // Prefab instantiation - handle specially
      const prefabAttrs = getAttributes(child);
      return {
        id: (attrs.id as string) ?? uuid(),
        name: (attrs.name as string) ?? 'PrefabInstance',
        tag: attrs.tag as string | undefined,
        enabled: (attrs.enabled as boolean) ?? true,
        transform: parseTransform(attrs),
        prefab: {
          path: prefabAttrs.src as string,
          overrides: prefabAttrs.overrides as Record<string, unknown> | undefined,
        },
      };
    } else {
      // It's a component
      components.push(parseComponent(child));
    }
  }

  const gameObject: GameObjectJson = {
    id: (attrs.id as string) ?? uuid(),
    name: (attrs.name as string) ?? 'GameObject',
    transform: parseTransform(attrs),
  };

  if (attrs.tag) gameObject.tag = attrs.tag as string;
  if (attrs.enabled === false) gameObject.enabled = false;
  if (components.length > 0) gameObject.components = components;
  if (behaviors.length > 0) gameObject.behaviors = behaviors;
  if (childGameObjects.length > 0) gameObject.children = childGameObjects;

  return gameObject;
}

/** Parse scene settings from Scene.Settings element */
function parseSceneSettings(element: JSXElement): SceneSettingsJson {
  const attrs = getAttributes(element);
  return {
    gravity: (attrs.gravity as [number, number]) ?? DEFAULT_SCENE_SETTINGS.gravity,
    backgroundColor: attrs.backgroundColor as string | undefined,
    pixelsPerUnit: attrs.pixelsPerUnit as number | undefined,
  };
}

/** Main transformer: convert JSX elements to SceneJson */
export function transformJsxToScene(
  elements: JSXElement[],
  sceneName: string
): SceneJson {
  const scene: SceneJson = {
    name: sceneName,
    version: '1.0.0',
    settings: { ...DEFAULT_SCENE_SETTINGS },
    gameObjects: [],
  };

  for (const element of elements) {
    const name = getElementName(element.openingElement);

    if (name === 'Scene') {
      // Process Scene children
      const children = getChildElements(element);
      for (const child of children) {
        const childName = getElementName(child.openingElement);

        if (childName === 'Scene.Settings' || childName === 'Settings') {
          scene.settings = parseSceneSettings(child);
        } else if (childName === 'GameObject') {
          scene.gameObjects.push(parseGameObject(child));
        }
      }
    } else if (name === 'GameObject') {
      // Top-level GameObject (no Scene wrapper)
      scene.gameObjects.push(parseGameObject(element));
    }
  }

  return scene;
}

/** Transform for prefab files */
export function transformJsxToPrefab(
  elements: JSXElement[],
  prefabName: string
): { name: string; version: string; root: GameObjectJson } | null {
  for (const element of elements) {
    const name = getElementName(element.openingElement);

    if (name === 'Prefab') {
      const children = getChildElements(element);
      const rootGameObject = children.find(
        (c) => getElementName(c.openingElement) === 'GameObject'
      );

      if (rootGameObject) {
        return {
          name: prefabName,
          version: '1.0.0',
          root: parseGameObject(rootGameObject),
        };
      }
    } else if (name === 'GameObject') {
      // Single GameObject as prefab root
      return {
        name: prefabName,
        version: '1.0.0',
        root: parseGameObject(element),
      };
    }
  }

  return null;
}
