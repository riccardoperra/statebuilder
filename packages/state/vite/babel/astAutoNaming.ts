import * as t from '@babel/types';

export function astAddAutoNaming(
  program: t.Node,
  filterStores: (name: string) => boolean,
): boolean {
  if (program.type !== 'Program') {
    return false;
  }
  let modify = false;
  for (const statement of program.body) {
    t.traverse(statement, (node, ancestors) => {
      if (t.isCallExpression(node)) {
        if (t.isIdentifier(node.callee) && filterStores(node.callee.name)) {
          ancestorsLoop: {
            let variableName: string | null = null;
            for (const ancestor of ancestors) {
              if (
                t.isVariableDeclarator(ancestor.node) &&
                t.isIdentifier(ancestor.node.id)
              ) {
                variableName = ancestor.node.id.name;
                modify = true;
                const storeOptions = t.objectExpression([
                  createNameProperty(variableName!),
                ]);
                node.arguments.push(storeOptions);
                break ancestorsLoop;
              }
            }
          }
        }
      }
    });
  }

  return modify;
}

function createNameProperty(variableName: string) {
  return t.objectProperty(t.identifier('key'), t.stringLiteral(variableName));
}
