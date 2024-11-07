import * as t from '@babel/types';
import type * as babel from '@babel/core';

/**
 * @experimental
 *
 * Search for components that use `use stateprovider` directive, then wrap them into StateProvider.
 */
export function babelReplaceStateProviderDirective(): babel.PluginObj<any> {
  return {
    name: 'statebuilder:stateprovider-directive',
    visitor: {
      Program(path) {
        let hasStateProviderDirective = false;
        let hasStateProviderImport = false;

        path.traverse({
          ImportDeclaration(importPath) {
            if (
              importPath.node.source.value === 'statebuilder' &&
              importPath.node.specifiers.some(
                (specifier) =>
                  'imported' in specifier &&
                  'name' in specifier.imported &&
                  specifier.imported.name === 'StateProvider',
              )
            ) {
              hasStateProviderImport = true;
              importPath.stop();
            }
          },
          FunctionDeclaration(path) {
            const bodyDirectives = path.node.body.directives || [];
            const stateProviderDirective = bodyDirectives.findIndex(
              (directive) => directive.value.value === 'use stateprovider',
            );
            if (stateProviderDirective !== -1) {
              hasStateProviderDirective = true;
              const originalName = path.node.id!.name;
              const wrappedName = `$Original${originalName}`;
              path.node.id = t.identifier(wrappedName);
              path.node.body.directives = path.node.body.directives.filter(
                (directive) => directive.value.value !== 'use stateprovider',
              );
              const wrappedComponent = t.functionDeclaration(
                t.identifier(originalName),
                [],
                t.blockStatement([
                  t.returnStatement(
                    t.jsxElement(
                      t.jsxOpeningElement(t.jsxIdentifier('StateProvider'), []),
                      t.jsxClosingElement(t.jsxIdentifier('StateProvider')),
                      [
                        t.jsxElement(
                          t.jsxOpeningElement(t.jsxIdentifier(wrappedName), []),
                          t.jsxClosingElement(t.jsxIdentifier(wrappedName)),
                          [],
                          true,
                        ),
                      ],
                      true,
                    ),
                  ),
                ]),
              );

              path.insertAfter(t.exportNamedDeclaration(wrappedComponent));
            }
          },
        });

        if (hasStateProviderDirective && !hasStateProviderImport) {
          const importDeclaration = t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier('StateProvider'),
                t.identifier('StateProvider'),
              ),
            ],
            t.stringLiteral('statebuilder'),
          );
          path.unshiftContainer('body', importDeclaration);
        }
      },
    },
  };
}
