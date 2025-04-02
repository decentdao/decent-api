import { join } from 'path';
import { readdirSync } from 'node:fs';

interface EndpointDoc {
  route: string;
  method: string;
  description: string;
  title: string;
  params?: { name: string; description: string }[];
  body?: string;
  returns?: string;
}

interface TypeDefinition {
  name: string;
  fields: { name: string; type: string }[];
}

async function parseTypesFile(content: string): Promise<Map<string, TypeDefinition>> {
  const types = new Map<string, TypeDefinition>();
  const typeRegex = /export type (\w+)\s*=\s*{([^}]+)}/g;
  const fieldRegex = /(\w+)\s*:\s*([^;]+);/g;

  let match;
  while ((match = typeRegex.exec(content)) !== null) {
    const typeName = match[1] || '';
    const fieldsContent = match[2] || '';
    const fields: { name: string; type: string }[] = [];

    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(fieldsContent)) !== null) {
      if (fieldMatch[1] && fieldMatch[2]) {
        fields.push({
          name: fieldMatch[1],
          type: fieldMatch[2].trim()
        });
      }
    }

    types.set(typeName, { name: typeName, fields });
  }

  return types;
}

async function resolveType(typeName: string, types: Map<string, TypeDefinition>): Promise<string> {
  const type = types.get(typeName);
  if (!type) return typeName;

  let markdown = '```typescript\n';
  markdown += `type ${type.name} = {\n`;
  for (const field of type.fields) {
    markdown += `  ${field.name}: ${field.type};\n`;
  }
  markdown += '}\n```\n';
  return markdown;
}

async function parseJsDocComments(content: string, types: Map<string, TypeDefinition>): Promise<EndpointDoc[]> {
  const endpoints: EndpointDoc[] = [];
  const jsDocRegex = /\/\*\*\s*([\s\S]*?)\s*\*\/\s*app\.(get|post|put|delete)/g;
  const routeRegex = /@route\s+(GET|POST|PUT|DELETE)\s+([^\n]+)/;
  const paramRegex = /@param\s+{([^}]+)}\s+([^\s-]+)\s*-\s*([^\n]+)/g;
  const returnsRegex = /@returns\s+{([^}]+?)}\s+([^\n]+)/;
  const bodyRegex = /@body\s+{([^}]+)}/;
  const titleRegex = /@title\s+([^\n]+)/;

  let match;
  while ((match = jsDocRegex.exec(content)) !== null) {
    const jsDocContent = match[1] || '';
    const method = match[2]?.toUpperCase() || '';
    
    const routeMatch = routeRegex.exec(jsDocContent);
    if (!routeMatch) continue;

    const titleMatch = titleRegex.exec(jsDocContent);
    const title = titleMatch?.[1]?.trim() || '';

    const endpoint: EndpointDoc = {
      route: routeMatch[2] || '',
      method: routeMatch[1] || '',
      description: jsDocContent
        .split('\n')[1]?.trim()
        .replace(/\*\s*/, '')
        .trim() || '',
      title: title,
    };

    // Parse parameters
    const params: { name: string; description: string }[] = [];
    let paramMatch;
    while ((paramMatch = paramRegex.exec(jsDocContent)) !== null) {
      if (paramMatch[2] && paramMatch[3]) {
        params.push({
          name: paramMatch[2],
          description: paramMatch[3].trim(),
        });
      }
    }
    if (params.length > 0) {
      endpoint.params = params;
    }

    // Parse return type - now preserving array brackets
    const returnsMatch = returnsRegex.exec(jsDocContent);
    if (returnsMatch && returnsMatch[1]) {
      endpoint.returns = returnsMatch[1].trim();
    }

    // Parse body
    const bodyMatch = bodyRegex.exec(jsDocContent);
    if (bodyMatch) {
      endpoint.body = bodyMatch[1];
    }

    endpoints.push(endpoint);
  }

  return endpoints;
}

async function generateMarkdown(endpoints: EndpointDoc[], types: Map<string, TypeDefinition>): Promise<string> {
  let markdown = '# Decent API Documentation\n\n';

  // Group endpoints by their base route
  const groups = endpoints.reduce((acc, endpoint) => {
    const base = endpoint.route.split('/')[1] || 'default';
    if (!acc[base]) acc[base] = [];
    acc[base].push(endpoint);
    return acc;
  }, {} as Record<string, EndpointDoc[]>);

  for (const [group, groupEndpoints] of Object.entries(groups)) {
    markdown += `## ${group.charAt(0).toUpperCase() + group.slice(1)} Endpoints\n\n`;

    for (const endpoint of groupEndpoints) {
      // Use title property or fallback to description
      const title = endpoint.title || endpoint.description;
      
      markdown += `### ${title}\n`;
      markdown += `${endpoint.method} \`${endpoint.route}\`\n`;

      if (endpoint.params?.length) {
        markdown += '- **Parameters**:\n';
        for (const param of endpoint.params) {
          markdown += `  - \`${param.name}\`: ${param.description}\n`;
        }
        markdown += '\n';
      }

      if (endpoint.body) {
        markdown += '- **Body**: ';
        markdown += `\`${endpoint.body}\`\n\n`;
      }

      if (endpoint.returns) {
        markdown += '- **Response**: ';
        markdown += `\`${endpoint.returns}\`\n\n`;
      }
    }
  }

  return markdown;
}

async function main() {
  try {
    // Create docs directory
    const docsDir = join(process.cwd(), 'src/api');

    // Read types file
    const typesContent = await Bun.file(join(process.cwd(), 'src/api/types.ts')).text();
    const types = await parseTypesFile(typesContent);

    // Read route files
    const routesDir = join(process.cwd(), 'src/api/routes');
    const files = readdirSync(routesDir);
    const routeFiles = files.filter(f => f.endsWith('.ts'));

    const allEndpoints: EndpointDoc[] = [];

    // Parse each route file
    for (const file of routeFiles) {
      const content = await Bun.file(join(routesDir, file)).text();
      const endpoints = await parseJsDocComments(content, types);
      allEndpoints.push(...endpoints);
    }

    // Generate and write markdown
    const markdown = await generateMarkdown(allEndpoints, types);
    await Bun.write(join(docsDir, 'README.md'), markdown);

    console.log('Documentation generated successfully in docs/api.md');
  } catch (error) {
    console.error('Error generating documentation:', error);
  }
}

main();
