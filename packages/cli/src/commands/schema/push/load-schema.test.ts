import { describe, expect, it } from 'vitest';

import { classifyExports } from './load-schema';

// The DSL export predicates (`isComponent` / `isDatasource` / `isSchemaObject`)
// are unit-tested in `src/utils/schema/classify-exports.test.ts`. This suite
// covers the push-specific wire mapping in `classifyExports`.

describe('classifyExports', () => {
  it('should classify a mixed module and map blocks to the wire schema shape', () => {
    const moduleExports = {
      pageBlock: { name: 'page', id: 1, created_at: '', updated_at: '', fields: [{ name: 'title', type: 'text', pos: 0 }] },
      heroBlock: { name: 'hero', id: 1, created_at: '', updated_at: '', fields: [{ name: 'headline', type: 'text', pos: 0 }] },
      colorsDatasource: { name: 'Colors', slug: 'colors', id: 1, created_at: '', updated_at: '' },
      headlineField: { type: 'text', max_length: 120 },
      someHelper: () => {},
      StoryblokTypes: undefined,
    };

    const result = classifyExports(moduleExports);

    expect(result.components).toHaveLength(2);
    expect(result.components[0].name).toBe('page');
    expect(result.components[0].schema).toEqual({ title: { type: 'text', pos: 0 } });
    expect(result.components[1].name).toBe('hero');
    expect(result.datasources).toHaveLength(1);
    expect(result.datasources[0].name).toBe('Colors');
  });

  it('should map DSL reference keys (allow, datasource) to their wire equivalents', () => {
    const moduleExports = {
      pageBlock: {
        name: 'page',
        fields: [
          { name: 'body', type: 'bloks', pos: 0, allow: ['hero', 'teaser'] },
          { name: 'theme', type: 'option', pos: 1, source: 'internal', datasource: 'colors' },
        ],
      },
    };

    const { components } = classifyExports(moduleExports);

    expect(components[0].schema).toEqual({
      body: {
        type: 'bloks',
        pos: 0,
        component_whitelist: ['hero', 'teaser'],
        restrict_components: true,
        restrict_type: '',
      },
      theme: { type: 'option', pos: 1, source: 'internal', datasource_slug: 'colors' },
    });
  });

  it('should return empty arrays when no matching exports', () => {
    const result = classifyExports({ helper: () => {}, constant: 42 });

    expect(result.components).toHaveLength(0);
    expect(result.datasources).toHaveLength(0);
  });

  it('should unwrap a schema object with blocks and datasources', () => {
    const moduleExports = {
      schema: {
        blocks: {
          pageBlock: { name: 'page', id: 1, created_at: '', updated_at: '', fields: [{ name: 'title', type: 'text', pos: 0 }] },
          heroBlock: { name: 'hero', id: 1, created_at: '', updated_at: '', fields: [] },
        },
        datasources: {
          colorsDatasource: { name: 'Colors', slug: 'colors', id: 1, created_at: '', updated_at: '' },
        },
      },
    };

    const result = classifyExports(moduleExports);

    expect(result.components).toHaveLength(2);
    expect(result.components[0].name).toBe('page');
    expect(result.components[1].name).toBe('hero');
    expect(result.datasources).toHaveLength(1);
    expect(result.datasources[0].name).toBe('Colors');
  });

  it('should unwrap a schema object that only has blocks (components-only space)', () => {
    const moduleExports = {
      schema: {
        blocks: {
          pageBlock: { name: 'page', id: 1, created_at: '', updated_at: '', fields: [{ name: 'title', type: 'text', pos: 0 }] },
          heroBlock: { name: 'hero', id: 1, created_at: '', updated_at: '', fields: [] },
        },
      },
    };

    const result = classifyExports(moduleExports);

    expect(result.components).toHaveLength(2);
    expect(result.components[0].name).toBe('page');
    expect(result.components[1].name).toBe('hero');
    expect(result.datasources).toHaveLength(0);
  });
});
