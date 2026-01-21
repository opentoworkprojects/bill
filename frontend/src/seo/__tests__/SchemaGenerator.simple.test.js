/**
 * Simple Schema Generator Test
 * 
 * Basic test to verify SchemaGenerator functionality
 */

import SchemaGenerator from '../core/SchemaGenerator';

describe('SchemaGenerator Simple Test', () => {
  test('should create SchemaGenerator instance', () => {
    const schemaGenerator = new SchemaGenerator();
    expect(schemaGenerator).toBeDefined();
  });

  test('should generate Organization schema', () => {
    const schemaGenerator = new SchemaGenerator();
    const orgData = {
      name: 'BillByteKOT',
      url: 'https://billbytekot.in',
      description: 'Restaurant billing software'
    };

    const schema = schemaGenerator.generateOrganizationSchema(orgData);

    expect(schema).toBeDefined();
    expect(schema['@type']).toBe('Organization');
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema.name).toBe('BillByteKOT');
  });
});