import type { SchemaData } from '../types';
import { mapBlockToWire, mapDatasourceToWire } from '../map-to-wire';
import { collectSchemaExports, loadSchemaModule } from '../../../utils/schema/classify-exports';

/**
 * Classifies a module's exports into wire components and datasources, mapping
 * the content-shape DSL (`fields`/`allow`/`datasource`) to the MAPI wire shape.
 */
export function classifyExports(moduleExports: Record<string, unknown>): SchemaData {
  const { components, datasources } = collectSchemaExports(moduleExports);
  return {
    components: components.map(mapBlockToWire),
    datasources: datasources.map(mapDatasourceToWire),
  };
}

/**
 * Loads a TypeScript schema entry file and returns classified exports.
 *
 * Blocks and datasources are sourced solely from the entry file's exports
 * (directly or via an exported `schema` object). A block must be registered in
 * the entry file to be pushed; leaving a block file on disk without exporting it
 * has no effect. Uses jiti for TypeScript support.
 */
export async function loadSchema(entryPath: string): Promise<SchemaData> {
  const entryMod = await loadSchemaModule(entryPath);
  return classifyExports(entryMod);
}
