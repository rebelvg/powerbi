import { getGroupId, parseArguments, retrieveToken } from './get-group-id';

process.on('unhandledRejection', (error) => {
  console.error('error', error);

  process.exit(1);
});

(async () => {
  const {
    tenant_id,
    username,
    password,
    client_id,
    client_secret,
    scope,
    resource,
    environment,
  } = parseArguments<{
    tenant_id: string;
    username: string;
    password: string;
    client_id: string;
    client_secret: string;
    scope: string;
    resource: string;
    environment: string;
  }>(process.argv, [
    '--tenant_id',
    '--username',
    '--password',
    '--client_id',
    '--client_secret',
    '--scope',
    '--resource',
    '--environment',
  ]);

  console.log('parsed_args', {
    tenant_id,
    username,
    client_id,
    scope,
    resource,
    environment,
  });

  const authToken = await retrieveToken({
    tenantId: tenant_id,
    username,
    password,
    clientId: client_id,
    clientSecret: client_secret,
    scope,
    resource,
  });

  const groupId = await getGroupId({
    authToken,
    environment,
  });

  console.log(`##vso[task.setvariable variable=group_id]${groupId}`);

  process.exit(0);
})();
